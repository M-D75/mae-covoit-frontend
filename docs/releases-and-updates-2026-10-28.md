# Versions et mises à jour Covia — 28 octobre 2026

## Livraison locale

Le contrôle est intégré à l’application et au backend, sans publication, push, commit, migration distante ni modification des `.env*`. La messagerie et le suivi natif restent présents. Le patch `docs/wip/controle-version-frontend-inacheve.patch` a été examiné, pas appliqué : ses références à 029, ses variables de build manuelles et sa conservation indéfinie d’une obligation hors ligne ne sont pas reprises.

La migration préparée **033_client_release_policy.sql** est la source unique de la politique. Aucune version publiée ou URL de boutique n’est créée par défaut. Les quatre lignes Android/iOS/web/legacy démarrent en observation, minimum zéro, dernière version non publiée. Le mécanisme fonctionne alors sans annoncer de mise à jour. Ne pas appliquer l’ancien 029 en parallèle ; 033 retire son ancien trigger s’il existe dans TEST. Si une base avait réellement utilisé 029, examiner ses valeurs et reporter manuellement les seules contraintes toujours justifiées avant la bascule.

Sans 033, la vérification indique une indisponibilité ; les nouvelles mutations sensibles du backend refusent le service plutôt que d’inventer une politique. Les lectures et actions de récupération ne sont pas verrouillées par cette absence. Appliquer la migration dans TEST avant d’y déployer le backend compatible.

## Identité de l’application

`release.json` est la source de préparation des releases. Les valeurs actuelles reflètent les fichiers locaux existants : Android **1.0.1 / build 4**, iOS **1.0.0 / build 1**, web **0.1.0 / build 1**, protocole **2**. Ces numéros ne prouvent aucune publication en boutique.

Au démarrage natif, Capacitor `App.getInfo()` lit réellement `versionCode` / `versionName` sous Android et `CFBundleVersion` / `CFBundleShortVersionString` sous iOS. Le numéro npm n’est pas utilisé pour inventer la version installée. Les builds iOS à plusieurs composantes sont comparés numériquement, pas alphabétiquement : 2.10.1 vient après 2.9.9. Une défaillance de lecture native est bornée à 1,5 seconde ; elle n’est pas remplacée par une fausse version installée.

Le build web constitue aussi le numéro du bundle JavaScript intégré aux binaires natifs. Il doit augmenter à chaque livraison de nouveaux assets. La compilation vérifie `release.json` contre les vrais fichiers Gradle et Xcode, puis émet un `release.json` public dans le résultat de build. Aucun secret ni identifiant de compte n’y figure.

Commandes, depuis le frontend, avec Node/npm disponibles :

```sh
node scripts/check-release.cjs
# Après choix et modification des numéros dans release.json seulement :
node scripts/check-release.cjs --sync
npm run build:prod
npx cap sync
node scripts/check-release.cjs --check-assets
```

`--sync` modifie uniquement les valeurs de version Gradle et Xcode, toutes configurations. `--check-assets` doit suivre la vraie compilation et la copie Capacitor : il refuse un ancien bundle ou une métadonnée absente dans les projets natifs. Les valeurs actuelles n’ont pas été augmentées arbitrairement. Il faudra choisir des numéros supérieurs à ceux réellement déjà soumis aux boutiques, y compris des builds internes non publics. Le contrôle courant borne les composantes de build à neuf chiffres ; le projet n’approche pas cette limite.

## Dernière version et minimum compatible

La table `public.client_release_policy` est lisible uniquement par le rôle serveur. Les utilisateurs ordinaires ne peuvent pas modifier la politique. Elle contient par plateforme :

- `latest_version`, `latest_build`, `latest_bundle`, `latest_protocol` : dernière release effectivement publiée ;
- `published_at`, `verified_at`, `update_url` : disponibilité réelle et vérification du canal ;
- `minimum_build`, `minimum_bundle`, `minimum_protocol`, `minimum_socket_protocol` : seuils de compatibilité distincts ;
- `mode` : observation ou application des minima ;
- `incompatibility_reason` : justification obligatoire d’un minimum appliqué, pas une simple envie de promouvoir une release.

Une release plus récente, publiée et vérifiée, donne une proposition facultative tant que le client reste compatible. Un minimum appliqué donne une obligation pour les nouvelles opérations. **Un déploiement backend ne change aucun seuil automatiquement.** Une amélioration visuelle ou une correction compatible ne justifie pas de relever le minimum.

Les contraintes et validations refusent un minimum supérieur au dernier build, un protocole minimum supérieur au dernier protocole, une obligation sans publication/vérification/lien de distribution, une vérification future ou un motif manquant. Les liens Android doivent désigner le package réel `com.maecovoit.app`; cela ne prouve pas que sa fiche est publiée. L’URL iOS exige l’identifiant App Store réel, encore non fourni. Aucun identifiant App Store ni lien actuellement disponible n’est inventé. Le web utilise une URL HTTPS de sa véritable origine ; le client écarte un lien d’une autre origine.

La plateforme `legacy` désigne l’absence d’en-têtes, pas un système d’exploitation déduit du navigateur. Ne l’appliquer qu’après avoir vérifié l’accès à des versions compatibles pour **tous** les publics concernés : un ancien client Android sans en-têtes ne peut pas être distingué avec certitude d’un ancien client iOS/web. Garder `legacy` en observation pendant une transition progressive est un choix explicite à documenter.

## Popup, connexion et trajet en cours

Le contrôle se fait au lancement, au retour au premier plan et au retour réseau, avec limitation des vérifications rapprochées. Requête bornée à quatre secondes ; cache client au maximum cinq minutes, sans prolonger son échéance lors d’une reprise hors ligne. Le cache est séparé par serveur/environnement et identité de build. La politique serveur est relue au maximum toutes les soixante secondes ; prévoir cette propagation dans une activation.

La popup suit le thème clair/sombre. Facultatif : **Mettre à jour / Plus tard**. Obligatoire : pas de Plus tard ; vérification à nouveau et accès limité aux trajets existants. Fermer une popup depuis une vue de récupération ne rend pas les nouvelles opérations acceptables côté serveur. L’entrée Version de Covia et mises à jour est disponible dans les informations générales.

Une panne réseau seule ne crée pas d’obligation, ne déconnecte pas le compte, ne remplace pas la carte et ne stoppe pas le GPS. Une obligation encore en cache devient informative hors ligne et expire avec sa courte échéance ; le serveur reste l’autorité lorsqu’il redevient joignable. Les messages d’erreur d’une opération refusée ne sont jamais transformés en succès.

Le contenu sous la popup reste monté. Les vues trajet/messages/profil et un suivi natif actif privilégient un avertissement et un accès à la récupération plutôt qu’un écran qui abandonnerait le trajet. Aucun appel d’arrêt du suivi, de validation PIN, d’arrivée, d’annulation ou de paiement n’est produit par ce contrôle.

Mettre à jour reste une action volontaire. Si un trajet est sélectionné ou un suivi natif actif, une confirmation explique l’effet possible : l’installation peut fermer l’application, un rechargement web peut interrompre le GPS web et perdre un brouillon. Le bouton Continuer mon trajet ferme cette confirmation. Ouvrir une boutique ne stoppe pas préalablement le service natif.

Sur le web, le code vérifie une métadonnée de build plus récente sur l’origine courante, puis active le service worker en attente seulement après le clic. Aucun rechargement au retour au premier plan ou à la simple détection du worker. Une tentative est mémorisée par cible pour éviter une boucle de rechargements du même ancien build. Ni les caches généraux du navigateur ni la session Supabase ne sont effacés.

## Protection serveur et limites

Les requêtes HTTP et connexions Socket.IO portent la plateforme, le build installé, le bundle et le protocole. **Ce sont des déclarations de compatibilité, pas des preuves de binaire signé, d’authentification ou de droits.** JWT Supabase, RLS, propriété du trajet et protections financières restent obligatoires et sont vérifiés indépendamment. Un client hostile peut mentir sur sa version ; le schéma et les règles métier doivent donc rester sûrs même avec de faux en-têtes.

Après authentification et le garde du simulateur, les nouvelles mutations sensibles incompatibles retournent HTTP 426 `APP_UPDATE_REQUIRED` avant leur traitement. Les en-têtes Supabase supplémentaires sont limités au POST de publication PostgREST ; ils ne changent pas les appels Auth/rafraîchissement de session. Vérifier leur préflight CORS dans TEST. Le garde SQL protège aussi la publication directe via Supabase/RLS : cette publication ne passe pas seulement par Node. Aucune mutation financière n’est fabriquée pour démontrer le contrôle.

Lectures et suppressions/arrêts restent accessibles selon leurs droits habituels. Les confirmations de réservations/autorisation déjà engagées, rapprochements, validation de montée, messages du trajet, signalements, récupération Connect et arrêt du suivi peuvent rester pris en charge si leur protocole est encore compatible. Ces exceptions ne donnent jamais accès à une nouvelle réservation, recharge ou publication incompatible. Une panne de la seule politique ne verrouille pas ces récupérations ; les mutations nouvelles refusent temporairement avec 503.

Le minimum du protocole socket est contrôlé à la connexion et à chaque paquet, pour couvrir une connexion déjà ouverte au moment d’une évolution. Un paquet incompatible reçoit un refus explicite, pas un faux accusé positif ; l’arrêt du partage reste permis. Un build ancien dont le protocole de suivi reste compatible n’est pas déconnecté au seul motif qu’une mise à jour est requise pour de nouvelles opérations. Si la table de politique est momentanément indisponible, une session de suivi authentifiée conserve sa compatibilité connue, ou le traitement existant validant ses données en l’absence de politique connue. Cela ne permet aucune nouvelle opération financière par socket.

Le HTTP natif de position utilise sa capacité temporaire propre et reste indépendant de la popup et du JWT WebView. Il n’est pas révoqué pour une simple hausse de minimum de l’application ; son contrat GPS continue d’être validé par le serveur. Un changement réellement incompatible de ce contrat exige une migration dédiée et une stratégie de fin de trajet : ne pas l’improviser en relevant le minimum de l’interface.

**Une ancienne application sans ce mécanisme ne peut pas afficher cette popup.** Elle peut seulement rencontrer un refus serveur ou SQL, parfois rendu comme une erreur générique par son ancienne interface. Prévoir une période de transition et une communication externe autorisée par les responsables ; aucun message externe n’est envoyé dans ce lot. Un minimum ne répare pas rétroactivement l’ancienne interface.

## Procédure pour chaque release

1. Identifier le changement réellement incompatible, s’il y en a un. Sinon laisser les minima existants. Examiner la compatibilité des opérations de récupération et du suivi actif.
2. Choisir les numéros dans `release.json`, vérifier les derniers numéros déjà soumis, synchroniser et compiler. Vérifier les assets copiés, puis construire/signaler les vrais binaires via le parcours de publication habituel. La simple mise à jour du web ne remplace pas un nouveau binaire natif.
3. Installer et essayer les builds TEST, notamment les scénarios ancien compatible, ancien incompatible, hors ligne, connexion en cours, retour de boutique, trajet actif, validation PIN réelle autorisée et paiement de test autorisé. Vérifier la version réellement retournée par App.getInfo sur l’appareil installé.
4. Publier la version compatible dans le bon canal. Vérifier sa disponibilité avec un compte réellement éligible, les pays et le déploiement progressif concernés. Une soumission, un état en revue ou une version interne inaccessible aux utilisateurs concernés ne suffit pas.
5. Dans la base de cet environnement seulement, enregistrer la dernière version, sa vraie URL, `published_at` et l’heure de vérification réelle `verified_at`. Garder d’abord `mode='observe'` et les minima existants. Vérifier la proposition facultative sur un ancien client.
6. Seulement si l’incompatibilité le justifie et après la disponibilité vérifiée, enregistrer `incompatibility_reason`, les minima réellement nécessaires et `mode='enforce'`. Ne pas appliquer le maximum du build à tous les utilisateurs par automatisme. Contrôler le 426, le refus SQL de publication et les accusés socket, ainsi que l’accès au trajet existant.
7. Surveiller les erreurs et le parcours réel de récupération. Pour un retour arrière, restaurer les derniers minima compatibles ou repasser en observation ; garder les contrôles d’authentification et financiers. Le cache serveur et le bail client peuvent retarder l’affichage pendant quelques minutes.

Les valeurs de publication doivent être renseignées explicitement par un opérateur propriétaire. Les lignes initiales et les liens iOS manquants restent non publiés ; ce document ne fournit pas de requête activant un minimum fictif.

## Sources

- [Android : versionCode et versionName](https://developer.android.com/studio/publish/versioning), [Google Play : numéros de version](https://support.google.com/googleplay/android-developer/answer/17367361).
- Contrat Capacitor 6 vérifié dans `node_modules/@capacitor/app/dist/esm/definitions.d.ts` : build/numéro de version natif, sans dépendance ajoutée.

## Validation de ce lot et étapes restantes

- **187 tests frontend** dans 26 fichiers, **57 tests backend**, style et compilation web réussis. Le build émet bien la version web 0.1.0 / build 1 / protocole 2 et un service worker acceptant l’activation explicite `SKIP_WAITING`.
- Migration 033 exécutée uniquement dans une base PostgreSQL locale jetable : refus des droits utilisateurs sur la politique, minima non publiés refusés, refus réel de publication d’un ancien build/protocole, absence d’insertion fantôme, version iOS à composantes numériques et valeur initiale legacy en observation.
- Tests client : cache borné sans prolongation hors ligne, pas de boucle de rechargement web, fichier de release trouvé depuis une route imbriquée/sous-répertoire, App.getInfo natif réel simulé, appels Auth Supabase inchangés, dialogue facultatif fermable et obligation distinguée de la récupération/du suivi actif.
- Aperçu navigateur isolé clair/sombre : boutons facultatifs Mettre à jour / Plus tard, popup obligatoire sans Plus tard, accès aux trajets, absence de verrouillage pendant la vérification indisponible et bouton Réessayer. Toutes les versions affichées dans ces scénarios sont des fixtures ; aucune disponibilité de boutique n’est annoncée réellement.
- Pas de migration distante, de push, de commit, de signature, d’installation native ou de publication. Pas de preuve d’ouverture des boutiques ni de fin de trajet sur téléphone dans ce lot. La recette native, le préflight PostgREST, les caches d’hébergement et le parcours d’un ancien binaire doivent être vérifiés dans TEST.

Pour l’hébergement web, prévoir une révalidation du document HTML, du service worker et des métadonnées de release, sans réutiliser indéfiniment un ancien document de navigation. Vérifier le numéro réellement affiché après rechargement. Avec plusieurs onglets d’une même origine, l’activation d’un worker est partagée ; les autres onglets ne sont pas rechargés automatiquement, mais une navigation ultérieure peut demander leur actualisation. Ni leurs sessions d’authentification ni le suivi natif ne sont effacés par le contrôle.
