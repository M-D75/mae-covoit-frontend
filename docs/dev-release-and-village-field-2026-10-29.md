# Essais web locaux et champ village — 29 octobre 2026

## Diagnostic en lecture seule

Le backend `http://localhost:3001/client/compatibility` répond HTTP 503 au contrôle de version. Le premier appel depuis l’environnement restreint n’avait pas pu établir la connexion ; l’appel local autorisé a bien atteint le serveur. Aucune conclusion « serveur arrêté » ne doit être tirée du premier appel.

Une lecture REST séparée, explicitement limitée à Covia-Dev (`ziaqkswbsjgnmmajnfyp`), de `client_release_policy?select=platform&limit=4` renvoie HTTP 404, code `PGRST205` : table absente du schéma REST exposé (migration 033 probablement non appliquée, ou cache de schéma à vérifier). Cette lecture ne prouve pas à elle seule la configuration du processus backend déjà lancé. Aucun secret n’est affiché, aucune écriture distante effectuée.

Les fichiers `.env.development.local` frontend/backend inspectés ciblent Covia-Dev et le frontend utilise localhost:3001. Le `.env` backend par défaut cible un autre projet, de production : ne jamais démarrer le serveur avec seulement `node server.js` pour cet essai. Aucun `.env*` n’a été modifié.

## Deux options

**Option recommandée : politique normale disponible.** Revoir puis appliquer manuellement dans Covia-Dev uniquement la migration [033](../supabase/migrations/033_client_release_policy.sql), si elle manque réellement. Elle crée quatre lignes `observe`, sans inventer de publication ni de minimum obligatoire, et le garde SQL de publication directe. Vérifier ensuite que le backend peut lire ces lignes avec sa clé serveur existante et que `/client/compatibility` répond normalement. Ce travail n’a appliqué aucune migration distante.

**Option temporaire : API locale en politique indisponible.** Le nouveau module backend `lib/dev-release-fallback.js` n’autorise l’exception que si toutes les conditions suivantes sont réunies :

- `COVIA_DEV_RELEASE_FALLBACK=allow-unavailable` explicite ;
- `NODE_ENV=development` ou `test` ;
- `API_SUPABASE_URL=https://ziaqkswbsjgnmmajnfyp.supabase.co` exactement, avec éventuel slash final ;
- client déclaré `web`, adresse de connexion réseau en boucle locale ;
- en-têtes Host et Origin limités à localhost, 127.0.0.1 ou ::1, sans en-têtes de proxy/transfert ; l’origine doit être une origine HTTP(S) valide.

Une requête distante, une base de production, un mode production, un client natif ou l’absence du flag ne bénéficie pas de l’exception. Une politique invalide ou partielle n’est pas traitée comme une panne à contourner. Un refus connu (`APP_UPDATE_REQUIRED`) demeure actif, y compris après expiration du cache et échec de son rafraîchissement. Le défaut reste protégé.

Pour un serveur local hors simulation, reprendre la commande habituelle en chargeant explicitement le fichier de développement, par exemple depuis le dossier backend :

```sh
NODE_ENV=development COVIA_DEV_RELEASE_FALLBACK=allow-unavailable \
node --env-file=.env.development.local server.js
```

Si l’essai utilise le simulateur, **ajouter ces deux variables à la commande de simulation déjà validée** dans `trip-simulation.md`, en conservant ses listes utilisateurs/trajets/réservations et ses gardes. Ne pas remplacer cette commande par l’exemple hors simulation. Aucun serveur applicatif réel n’a été démarré ou redémarré ici, aucun paiement/PIN créé. Ne pas changer les clés OAuth ou Stripe pour ce contrôle.

Le frontend utilise sa configuration de développement existante vers localhost:3001 et Covia-Dev, sans flag client supplémentaire. Le navigateur envoie Origin ; une commande de diagnostic sans Origin reste volontairement refusée pour l’exception. Le serveur signale `status: unavailable`, `developmentAllowed: true`, `cacheSeconds: 0` en gardant HTTP 503 sur le point de diagnostic. Le frontend affiche « Essai web local · politique indisponible », jamais « à jour ». Cet état n’est pas mis en cache comme autorisation de version et disparaît au prochain échec ou changement de serveur. Sur les mutations authentifiées effectivement autorisées, le serveur ajoute `X-Covia-Dev-Release-Fallback: unavailable` puis laisse le traitement métier décider de son propre résultat.

Pour désactiver, retirer le flag et redémarrer manuellement le backend avec la même cible et les mêmes autres gardes. Ne jamais ajouter cette option aux commandes de déploiement.

## Cohérence SQL et limites

L’exception ne change ni le JWT, ni les gardes de simulation, ni les contrôles métier/paiement, ni les RPC, ni le trigger SQL. Elle ne crée pas de réservation ou de publication fictive et ne transforme pas un backend arrêté en service disponible.

La publication frontend passe directement par Supabase/RLS. Si le trigger 033 est installé mais sa politique manque ou impose un minimum incompatible, la base continue à refuser ; aucun en-tête de développement ne la contourne. La migration 033 avec ses lignes `observe` reste donc nécessaire pour tester ce parcours sous un contrôle de version SQL complet. Si 033 n’est pas installée, le flag serveur ne l’installe pas et ne fournit pas sa protection SQL. Aucun bypass SQL ni nouvel accès base n’est ajouté. Les tests SQL vérifient aussi qu’un faux en-tête de développement ne permet aucune insertion lorsque la politique SQL manque.

## Champ de village

Le retrait d’une règle globale de `LoginSign.vue` a fait réapparaître le style `solo` Vuetify (fond/ombre) dans le sélecteur partagé `components/publish/Search.vue`. La correction vise uniquement `.village-search-input` : fond transparent, pas d’ombre, de bord ni de surcouche intérieure. La capsule extérieure conserve son style. Le focus clavier conserve un contour visible autour du champ, et le nom accessible est « Saisissez un village ». Départ et arrivée utilisent le même composant ; les champs de connexion/profil ne sont pas concernés.

## Validation

204 tests frontend et 63 tests backend réussis ; lint ciblé et compilation de production réussis. Vérifications SQL réussies dans une base jetable, supprimée après le test et serveur PostgreSQL jetable arrêté. Tests positifs de l’exception locale et négatifs pour mode production, cible de production, faux domaine, adresse distante, hôte/origine distante, proxy, plateforme native, absence du flag, politique partielle/invalide et incompatibilité connue pendant une panne. Tests frontend : état indisponible explicite, absence de faux état `current`, absence de cache de l’exception, retrait après échec réseau. Tests SQL sur une base jetable locale uniquement. Aperçus du composant village réel dans une largeur de 390 px, clair/sombre, départ/arrivée et focus clavier. Aucun test connecté n’a modifié un compte ou une donnée distante.
