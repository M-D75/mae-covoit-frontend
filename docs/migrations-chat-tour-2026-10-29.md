# Messagerie, rappels SQL et guidage — 29 octobre 2026

## Ce qui a été vérifié dans Covia-Dev, sans écrire

La migration 033 est annoncée appliquée dans TEST par l’utilisateur et la compatibilité est annoncée réglée. Cela ne prouve pas l’application des migrations précédentes.

- La route locale `/trips/1/conversations`, appelée sans session, retourne 401 : le backend connaît la route et garde l’authentification. Aucun échange réel n’a été demandé.
- Dans Covia-Dev, le RPC `trip_chat_operation` retourne HTTP 404 `PGRST202` pour sa signature attendue ; il est aussi absent des métadonnées OpenAPI lues avec la clé serveur existante. Le backend du dépôt traduit précisément une erreur RPC non métier en `CHAT_MIGRATION_OR_SERVICE_UNAVAILABLE` (503). La cause concordante est donc la migration **031 manquante dans le schéma REST exposé**, ou sa publication dans le cache PostgREST à réparer si elle a déjà été exécutée. On n’a pas lu de corps de message. La réponse authentifiée exacte du trajet de la capture n’a pas été interceptée ; on ne prétend pas l’avoir reproduite avec le compte utilisateur.
- Le RPC `boarding_pin_operation` répond à une action volontairement invalide, avec acteur nul, par `BOARDING_FORBIDDEN` : sa présence est confirmée, sans créer, lire ou vérifier un PIN. Cela ne garantit pas tous les grants/triggers de 028.
- `log_credit` figure dans les métadonnées serveur ; une requête anonyme HEAD limitée à zéro ligne est refusée (401). C’est compatible avec un accès client fermé, mais ne prouve pas toutes les révocations de 030, notamment grants de colonnes/séquence.
- Le schéma privé de messagerie et le job pg_cron ne sont pas auditables de façon fiable par cette API REST publique. Leur absence n’est pas déduite du simple fait qu’ils ne sont pas exposés. Le script SQL de catalogue ci-dessous permet de trancher en lecture seule dans SQL Editor.

Aucune migration ni purge distante exécutée. Aucune donnée financière, aucun contenu de message, aucun secret ou PIN affiché.

## Rappel précis des étapes

1. Dans le tableau de bord **Covia-Dev**, vérifier la référence `ziaqkswbsjgnmmajnfyp`, puis exécuter seulement pour audit [verify-trip-migrations.sql](testing/verify-trip-migrations.sql). Il ne lit que les catalogues, droits et présence des objets. Pour 030, compléter avec [verify-log-credit.sql](testing/verify-log-credit.sql).
2. **028_booking_boarding_pin.sql** : nécessaire au PIN, après **024_repair_settings_id_sequence.sql**. Le RPC existe déjà dans l’audit ; ne pas la réappliquer aveuglément. Vérifier ses objets et droits si un doute persiste. Les migrations géographiques 025–027 sont indépendantes et absentes de ce dépôt sous ces numéros.
3. **030_secure_log_credit.sql** : durcissement autonome des droits de l’ancien journal de crédits, sans modification de solde. Ni prérequis de la messagerie ni preuve de fonctionnement du PIN. Vérifier les grants complets avant de conclure qu’elle est appliquée. **029 est un brouillon obsolète, ne pas l’appliquer.**
4. **031_trip_text_messaging.sql** : élément qui manque selon l’API actuelle. Revoir et appliquer manuellement dans TEST si absent, puis confirmer présence du schéma `messaging_private`, de ses trois tables RLS et de `public.trip_chat_operation(uuid,text,bigint,uuid,jsonb)`. Les rôles anon/authenticated ne doivent pas accéder directement aux tables privées ni exécuter le RPC ; le backend utilise service_role après authentification. Si le catalogue indique que le RPC existe déjà mais que REST renvoie encore PGRST202, vérifier signature/grants/cache PostgREST avant une nouvelle application.
5. **032_schedule_chat_retention.sql** : **facultatif**, uniquement après 031 et si le propriétaire a déjà activé `pg_cron`. Vérifier le job `covia-chat-retention`, horaire `7 * * * *`, actif. Ne pas activer une extension silencieusement. Sans ce job, le backend du dépôt purge au démarrage puis chaque heure à la minute 7, hors simulation ; les accès expirés sont filtrés même si la purge physique attend. Surveiller disponibilité et exécutions. Le mode simulation ne remplace pas un ordonnanceur de rétention.
6. **033_client_release_policy.sql** : annoncée appliquée et compatibilité réglée ; ne pas en déduire 028/030/031/032. Pas besoin du contournement temporaire local si la politique normale fonctionne.

Après accord et application manuelle des éléments réellement manquants, redémarrer vous-même le backend avec son code actuel et la configuration TEST explicite. Hors simulation, depuis le dossier backend :

```sh
NODE_ENV=development node --env-file=.env.development.local server.js
```

Pour le simulateur, conserver intégralement les listes et gardes de la commande déjà validée dans `trip-simulation.md`, en chargeant le même fichier de développement. Le `.env` backend par défaut vise la production : ne pas employer seulement `node server.js`. Ne pas ajouter le flag de compatibilité temporaire si 033 fonctionne. Aucune clé n’est à recopier dans le chat. Aucun serveur utilisateur n’a été démarré ou redémarré par cet audit.

## Corrections locales

La messagerie n’affiche un état vide qu’après un chargement réussi. Un échec de contacts ou d’historique masque « Aucun échange / Aucun message » ; les messages déjà chargés restent visibles. Le code d’indisponibilité de migration/service produit une explication dédiée.

Le SVG du véhicule ne comporte plus de disque, cercle, contour ou halo ajouté autour de la voiture. Le dessin original, ses couleurs, son orientation, sa taille, son ancrage et son opacité de position ancienne sont conservés. Google et Leaflet consomment la même fabrique. Les marqueurs passager et les contours de villages restent inchangés.

L’aide textuelle est remplacée par deux mises en évidence successives des vrais éléments de `CardTrajetHistory` : en-tête (passagers/demandes côté conducteur, profil du conducteur côté passager), puis corps du trajet. Une seule cible est encadrée à la fois, avec pulsation lente et retardée. L’utilisateur choisit Suivant, Terminer ou Passer ; aucun clic sur une action métier, GPS, acceptation, paiement ou PIN n’est automatisé. La carte est accessible par le parcours réel ; une réservation en attente n’est pas présentée comme acceptée.

La progression est mémorisée par compte et rôle. Revoir l’aide permet un nouveau parcours ; si le vrai cadre n’est pas présent, l’aide propose d’ouvrir Mes trajets ou de passer, sans inventer une cible ou des données. Le cadre suit le défilement/redimensionnement, les contrôles restent dans l’écran ; `prefers-reduced-motion` rend l’encadrement statique. Les contrôles sont accessibles au clavier et suivent les thèmes clair/sombre. Le dialogue de version, le recadrage et l’écran d’avis restent prioritaires.

## Vérifications du lot

210 tests frontend réussis (28 fichiers), lint ciblé et compilation de production réussis. Les tests vérifient l’absence de faux état vide, la voiture sans disque tout en conservant le passager, l’ordre des cibles, la progression isolée par compte, la sélection du bon trajet et le défilement immédiat sans clic métier lorsque la réduction des animations est demandée. Les vérifications SQL de messagerie (isolation, RLS/service-only, idempotence concurrente, lecture par destinataire, pagination, annulation, expiration/purge de quinze jours) et le nouveau script de catalogue ont réussi sur une base jetable locale, ensuite supprimée ; son serveur PostgreSQL a été arrêté.

Aperçu isolé avec vrais composants de carte de trajet et services fictifs : étapes conducteur/passager, clair/sombre, une seule cible active, défilement et contrôles dans l’écran, SVG voiture/passager, puis erreur de messagerie sans état vide. Les SDK cartographiques réels et une session connectée du trajet utilisateur n’ont pas été pilotés ; leur source commune de SVG est couverte par les tests existants Google/Leaflet. Aucun compte ni message distant n’a été modifié.
