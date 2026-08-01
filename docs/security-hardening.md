# Sécurité et préparation des tests réels

## État actuel

Les écritures sensibles passent maintenant par le backend authentifié :
réservation, acceptation/refus, présence, annulation, rechargement, capture,
conversion des gains, remboursement, notation et suppression de compte. Les
nouveaux contrats répondent sous l'une de ces deux formes :

```json
{ "status": "ok", "data": {} }
{ "status": "error", "code": "CODE_STABLE", "message": "...", "retriable": false }
```

Les doubles clics et reprises réseau utilisent un UUID stable. Les montants,
propriétaires et transitions sont recalculés ou vérifiés côté serveur et les
opérations monétaires critiques sont idempotentes en base.

## Ordre de déploiement obligatoire

1. Utiliser d'abord une Supabase de développement/staging et Stripe en mode
   test (`sk_test_…` et `pk_test_…`). Ne pas commencer sur le projet marqué
   `PRODUCTION` dans le Dashboard.
2. Sauvegarder la base.
3. Appliquer dans l'ordre les migrations `004` à `018`. Le serveur dépend des
   RPC et colonnes des migrations `009` à `016` ; `017` nettoie les anciennes
   politiques RLS récursives qui peuvent subsister sur `trip` et `booking`, et
   `018` reconstruit celles des autres tables directement lues par le client.
4. Vérifier les erreurs de migration, en particulier les index uniques sur les
   anciennes données. La contrainte de prix est `NOT VALID` : elle protège les
   nouveaux trajets, puis doit être validée après nettoyage des anciens prix.
5. Configurer le backend d'après son `.env.example`, puis le déployer avant le
   frontend.
6. Déployer/reconstruire le frontend avec les clés publiques de la même
   Supabase et le même environnement Stripe.

Les migrations n'ont pas été exécutées par cet audit contre une vraie base :
faire au minimum un `supabase db reset` sur une copie ou un passage staging
avant toute migration de production.

## Lancer le frontend local sans appeler la production

Créer un `.env.local` (ignoré par Git) à partir de `.env.example`, puis vérifier
au minimum ces valeurs avant `npm run serve` :

```env
VUE_APP_MODE=local
VUE_APP_MAP_PROVIDER=leaflet
VUE_APP_API_GOOGLE_ROUTE_API_KEY=your_routes_browser_key
VUE_APP_SERVER_LOCAL_URL=http://localhost:3001
```

`VUE_APP_MODE=local` envoie les routes métier vers
`http://localhost:3001`. Les villages et publications utilisent la Supabase
configurée dans le frontend dans les deux modes ; l'ancien endpoint MBABUF
n'est plus utilisé. Une valeur conservée dans `localStorage` peut encore primer
sur le fournisseur de carte : voir `docs/maps.md`.

Pour tester un backend distant de staging sans viser la production, définir
`VUE_APP_MODE=online` et `VUE_APP_SERVER_ONLINE_URL` avec son URL exacte.
Ajouter aussi l'origine du frontend à `CORS_ALLOWED_ORIGINS` côté backend.

Après avoir configuré l'environnement du backend, le lancer avec `npm start`.
`GET http://localhost:3001/health` doit répondre `{ "status": "ok" }` avant
de lancer le frontend avec `npm run serve`.

## Variables serveur

- `API_SUPABASE_SERVICE_ROLE_KEY` : clé privée Supabase permettant au backend
  d'exécuter les RPC protégés et `auth.admin.deleteUser`. Elle est obligatoire
  pour les opérations métier et ne doit jamais être placée dans le frontend.
- `FIREBASE_SERVICE_ACCOUNT` : chemin absolu vers le JSON privé d'un compte de
  service Firebase. Il est nécessaire seulement pour envoyer des push FCM.
- `FIREBASE_PROJECT_ID` : identifiant du projet Firebase ; facultatif si le
  JSON précédent contient déjà `project_id`.
- `STRIPE_WEBHOOK_SECRET` : secret `whsec_…` créé lors de la déclaration du
  endpoint Stripe `/webhook`.
- `DRIVER_PAYOUT_RATE` : part du montant passager restant après remboursements
  destinée au chauffeur (`0.59` par défaut). Ce n'est pas le net après frais
  Stripe.

`google-services.json` est une configuration cliente Android : ce n'est pas un
compte de service FCM serveur et il ne remplace pas
`FIREBASE_SERVICE_ACCOUNT`.

## Webhook en local et en production

Pour les premiers tests locaux avec une carte Stripe synchrone, le webhook
n'est pas bloquant : `getSoldes` réconcilie les rechargements et captures, et
les tâches périodiques du backend parcourent aussi les transactions suivies
pour importer les remboursements Dashboard et reprendre les virements. Le
webhook reste obligatoire avant une mise en production, car il réduit ce délai
et reçoit immédiatement les changements arrivant sans utilisateur connecté.

Événements minimum :

- `payment_intent.succeeded` ;
- `refund.created` ;
- `refund.updated` ;
- `refund.failed` ;
- `charge.refunded` ;
- `charge.refund.updated`.

En local, Stripe CLI peut transférer les événements vers
`http://localhost:3001/webhook` et fournit alors un secret `whsec_…` local.

## Scénarios de validation staging

Utiliser au moins deux comptes : un chauffeur et un passager. Le chauffeur doit
terminer l'onboarding Connect en mode test avant le scénario de virement.

1. Connexion Google, expiration de session et reconnexion.
2. Ajout, sélection et suppression d'une carte.
3. Rechargement normal, état `processing`, challenge 3-D Secure, double clic et
   réponse HTTP volontairement interrompue.
4. Réservation par crédits puis par carte, validation chauffeur, présence,
   capture et redémarrage du backend pendant une opération.
5. Refus, absence et annulation, avec vérification du solde et du nombre de
   places après chaque reprise.
6. Conversion des gains en crédits, puis tentative répétée avec le même UUID.
7. Remboursement admin avant et après le virement Connect.
   Refaire le test depuis le Dashboard Stripe pour vérifier son import.
8. Notation 1 à 5 après présence confirmée.
9. Suppression d'un compte vierge avant les scénarios de paiement.

La suppression physique est volontairement refusée avec
`ACCOUNT_HAS_FINANCIAL_HISTORY` dès qu'un paiement, rechargement, gain ou
conversion est suivi. La suppression RGPD d'un tel compte demande une procédure
d'anonymisation conservant les registres comptables ; un `CASCADE` n'est pas
suffisant.

## Limites restant avant une vraie production

- Les lectures RLS de `account` et `booking` restent larges pour compatibilité
  avec l'ancien frontend ; une politique de confidentialité plus fine est à
  concevoir et tester rôle par rôle.
- La publication de trajet reste une écriture directe Supabase protégée par RLS.
  La validation complète du véhicule et des champs de publication doit encore
  être centralisée côté serveur avant la production.
- La messagerie Socket.IO est gardée en mémoire : elle disparaît au redémarrage
  et ne fonctionne pas correctement sur plusieurs instances.
- L'interface de remboursement admin n'est pas routée ; seule l'API protégée
  existe actuellement.
- Si l'application est fermée entre un challenge 3-D Secure de réservation et
  l'appel de finalisation, l'autorisation non liée reste chez Stripe jusqu'à son
  expiration automatique.
- FCM est en « best effort » et un crash juste après l'envoi peut produire un
  doublon de notification.
- Les tests automatisés ne remplacent pas encore Stripe/Supabase par un vrai
  environnement d'intégration.
- La sérialisation des inversions de virement est sûre dans une instance Node.
  Pour plusieurs instances backend, utiliser un worker financier unique ou un
  verrou PostgreSQL distribué avant la production.
- Aucun limiteur de débit global n'est encore configuré. Avant une ouverture
  publique, protéger l'API et les sockets au reverse proxy et limiter au moins
  l'authentification, les créations Stripe et les messages.

## Secrets à tourner

Une ancienne clé secrète Stripe a existé sous un nom `VUE_APP_*`, donc dans un
bundle client. Elle doit être considérée compromise : la tourner dans Stripe,
garder la nouvelle uniquement sur le backend et contrôler les anciens logs.
Toutes les clés Google côté frontend doivent être restreintes par domaine,
application Android/bundle iOS et API autorisée.
