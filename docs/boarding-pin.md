# Code de montée — livraison du 17 octobre 2026

## Comportement livré

Le passager affiche un code à six chiffres dans le dialogue « Code de montée ». Le chauffeur le saisit pour confirmer la montée de cette réservation. Un groupe de sièges partage un seul code ; les autres passagers et les réservations indépendantes ont leur propre validation. Après confirmation, la base conserve `in_car` : aucune nouvelle saisie après reconnexion, arrêt intermédiaire, expiration ou réouverture du dialogue. Les réservations déjà confirmées avant cette migration restent confirmées.

La position GPS ne participe pas à cette décision. Cette livraison ne traite ni l’arrivée, ni la fin du trajet, ni le suivi public du véhicule.

## Autorité et regroupement

`boarding_pin_operation` est une fonction SQL réservée à `service_role`. Le backend transmet exclusivement le sujet du JWT vérifié, jamais un identifiant d’acteur fourni par le navigateur. SQL vérifie le propriétaire du trajet pour confirmer et le propriétaire passager pour afficher le code. Le chauffeur peut consulter un état de confirmation sans code ni données cryptographiques.

Le groupe reprend la portée métier existante : même trajet, même passager et même `reservation_request_id`. En l’absence de cet identifiant, un `payment_intent_id` commun regroupe les sièges. Sans ces deux identifiants, chaque ligne reste indépendante : les anciennes lignes ne permettent pas de prouver qu’elles constituent une réservation commune. Des trajets distincts ne sont pas fusionnés. Une modification des membres après émission bloque la validation au lieu de réutiliser un code sur un autre ensemble.

La réservation doit être acceptée, non refusée, non annulée, sans absence déclarée. La validation reste ouverte de 30 minutes avant le départ à une heure après, comme le backend actuel. Ces durées sont également fixées dans la migration ; les faire évoluer nécessite de synchroniser SQL et backend. L’émission peut précéder cette fenêtre, mais le code expire au plus tard une heure après le départ prévu lors de son émission. Un changement d’horaire n’étend pas cette expiration.

## Secrets et protection contre les essais

Le backend produit le code avec `crypto.randomInt`. Il conserve uniquement un chiffré AES-256-GCM pour le réaffichage et une preuve HMAC-SHA256 pour la comparaison. La clé dédiée `BOARDING_PIN_KEY` est un secret serveur de 32 octets encodé en 64 caractères hexadécimaux. Elle n’est ni créée ni livrée avec ce correctif. La générer une fois avec `openssl rand -hex 32`, puis la conserver dans le gestionnaire de secrets du backend. Ne jamais la placer dans une variable `VUE_APP_*`, un patch ou des logs. Elle doit être identique sur toutes les instances et conservée entre redémarrages. Une rotation non accompagnée rend les anciens codes illisibles ; aucun renouvellement automatique n’est prévu.

La table est dans un schéma privé, sans accès `anon`/`authenticated`, avec RLS activée et aucune politique publique. Aucune colonne PIN n’est ajoutée à `booking`, donc les lectures existantes de réservations n’exposent pas le code. Les réponses sensibles portent `Cache-Control: no-store`. L’interface garde le code uniquement en mémoire et le retire à la fermeture.

Cinq tentatives erronées maximum par réservation, persistées et sérialisées en base. Les requêtes concurrentes ne permettent pas de dépasser cette limite. Le cinquième échec bloque cette réservation jusqu’à son expiration ; il n’existe pas de déblocage automatique, de génération de remplacement ou de réinitialisation côté client. L’interface affiche le blocage. Les nouvelles routes ne journalisent ni code, ni preuve, ni chiffré, ni corps de requête. Vérifier également la configuration des journaux HTTP du déploiement avant activation.

## Règlement et compatibilité

L’ancienne route `POST /bookings/presence` renvoie 410 et n’effectue plus aucun règlement. Un trigger empêche toute nouvelle écriture `in_car=true` sans confirmation PIN persistée, y compris par l’ancien RPC `transition_booking_group(..., 'presence')` ou un ancien backend. Le signal Socket.IO fourni par un client ne marque plus une présence dans l’interface.

La confirmation et l’écriture `in_car` sont atomiques et verrouillent les mêmes lignes que les transitions d’annulation/absence. Le paiement externe suit cette transaction ; il ne peut pas être atomique avec PostgreSQL. Le chemin Stripe vérifie désormais la présence réellement persistée de tout le groupe, sans option de contournement, et utilise une clé d’idempotence stable par PaymentIntent. Les protections existantes de finalisation du registre, de capture de crédits et de récupération sont conservées. Une réponse de paiement perdue se reprend sans PIN et sans deuxième règlement. Le worker existant reprend également les captures de crédits non terminées. Un incident de règlement peut donc laisser une montée confirmée avec un règlement en attente : il ne faut pas effacer la confirmation pour réessayer.

## Installation préparée — non exécutée

1. Examiner les correctifs et sauvegarder la base selon la procédure habituelle.
2. Préparer `BOARDING_PIN_KEY` dans la configuration privée du backend, sans changer les secrets existants.
3. Appliquer manuellement `028_booking_boarding_pin.sql` via l’éditeur SQL Supabase, après les migrations métier existantes jusqu’à 024. Les migrations géographiques 025–027 livrées précédemment sont indépendantes ; la numérotation 028 évite leur collision.
4. Déployer le backend puis le frontend ensemble dans une fenêtre prévue. Dès que le trigger est installé, les anciens clients ne peuvent plus auto-confirmer : cette incompatibilité est intentionnelle et impose la mise à jour du frontend.
5. Vérifier le parcours complet avec des comptes de test et un moyen de paiement de test avant ouverture aux utilisateurs. Aucune de ces opérations distantes n’a été exécutée ici.

Un retour à une ancienne application doit conserver le verrou PIN en base ; le retirer réintroduirait l’auto-confirmation. Aucun script qui supprime cette protection ou les confirmations n’est livré.

## Vérification effectuée

- Frontend : 96 tests dans 17 fichiers, contrôle de style et compilation de production réussis.
- Backend : 25 tests réussis, dont les routes isolées (sans démarrer le serveur), le chiffrement, l’intégrité du chiffré et le refus sans clé.
- PostgreSQL 14 local jetable : droits de lecture/exécution, mauvais acteur, mauvais code, groupe multi-sièges, réservations indépendantes, second passager, expiration, fenêtre de départ, rejeu, reconnexion et ancien RPC bloqué.
- Concurrence SQL réelle : huit essais erronés concurrents limités à cinq, deux confirmations correctes concurrentes donnant un seul état durable, dix courses annulation/confirmation conservant des états exclusifs.

Le script backend `scripts/test-boarding-sql.py` exige un socket PostgreSQL local sous `/tmp` ; il crée et supprime sa propre base jetable. Exemple : `BOARDING_TEST_PGSOCKET=/tmp BOARDING_TEST_PGPORT=55439 python3 scripts/test-boarding-sql.py`. Les rôles locaux `anon`, `authenticated`, `service_role` doivent exister. Les fixtures reproduisent les colonnes nécessaires et l’ancien RPC ; elles ne remplacent pas un essai d’intégration du schéma Supabase distant. Aucun paiement Stripe réel, backend applicatif, migration distante ou publication n’a été lancé.

## Dossiers de travail depuis le 26 octobre 2026

Le code est désormais intégré aux deux dépôts habituels sur `codex/covia-dev` :

- Frontend : `/Users/ekko-vi/Documents/5-GIT/MAE-Solutions/mae-covoit-frontend`.
- Backend : `/Users/ekko-vi/Documents/5-GIT/MAE-Solutions/serveur-mae-covoit-ekko`.

L’ancienne copie frontend est conservée. Le backend temporaire disparu a été récupéré depuis le correctif durable PIN. Les anciennes variantes de patch restent des sauvegardes et ne doivent pas être réappliquées sur ces dépôts déjà intégrés. Voir `docs/integration-locale-2026-10-26.md` pour les changements utilisateur préservés, les tests de reprise et l’état inachevé du contrôle de version. Aucun commit, push ou changement distant effectué.
