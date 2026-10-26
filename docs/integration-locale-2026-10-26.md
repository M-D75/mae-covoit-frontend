# Covia — intégration locale du 26 octobre 2026

## Où travailler maintenant

Les deux dépôts habituels sont sur une nouvelle branche **`codex/covia-dev`** :

- Frontend : `/Users/ekko-vi/Documents/5-GIT/MAE-Solutions/mae-covoit-frontend` (base `f8c5026`, branche initiale `refont`).
- Backend : `/Users/ekko-vi/Documents/5-GIT/MAE-Solutions/serveur-mae-covoit-ekko` (base `3657c97`, branche initiale `refont`).

Les cartes de villages avec marqueurs et itinéraire, ainsi que le PIN de montée frontend/backend et la migration 028, sont intégrés directement dans ces dossiers. Les changements restent locaux, non commités. Aucun push, déploiement, serveur applicatif lancé ou migration distante appliquée pendant cette intégration.

## Changements utilisateur conservés

Le `.env.example` frontend modifié et les fichiers `.env.development` / `.env.production` non suivis sont inchangés. Tous les autres fichiers `.env*` existants sont également préservés. Le modèle `.env.example` backend reçoit uniquement le paramètre vide `BOARDING_PIN_KEY`, comme prévu dans le correctif PIN ; aucune clé n’a été créée ou copiée.

Les modifications utilisateur de `package.json` et `package-lock.json` backend sont conservées à l’identique. Aucune installation de dépendances n’a été effectuée. Les empreintes de contrôle sont enregistrées dans `etat-avant.json`, sans contenu de secrets.

## Contrôle des versions : brouillon conservé, pas activé

Le travail suspendu du 17 octobre n’était pas prêt à être utilisé. Son frontend appelait un point d’accès backend qui n’est pas présent dans le correctif durable récupérable. Intégrer ces branchements dans l’app active aurait produit des erreurs de vérification.

Le brouillon frontend complet correspondant est conservé dans :

- `docs/wip/controle-version-frontend-inacheve.patch` dans le dépôt frontend ;
- `controle-version-frontend-inacheve.patch` dans ce dossier de livraison.

Ce patch contient `VersionGate.vue`, `clientIdentity.js`, `versionCompatibility.js`, `webUpdate.js`, les adaptations App / Service Worker / HTTP / Supabase et le SQL 029 préparé. Il peut s’appliquer sur le frontend intégré actuel (`git apply --check` vérifié), mais il **ne doit pas être appliqué pour activer la fonctionnalité** avant récupération ou reconstruction de sa partie backend, revue et tests. Les paramètres publics envisagés sont `VUE_APP_RELEASE_BUILD` et `VUE_APP_RELEASE_VERSION` ; ils ne sont pas ajoutés à votre configuration active.

Le répertoire temporaire backend `/tmp/covia-boarding-backend` a disparu. Son correctif PIN était sauvegardé et a été récupéré. Aucun livrable sauvegardé de son module de contrôle des versions n’a été retrouvé parmi les fichiers disponibles ; cette partie n’a donc pas été inventée ou annoncée comme intégrée. La référence Git de l’ancien worktree backend est laissée en place, sans nettoyage.

Le worktree frontend original est conservé, sans modification ni suppression. Sa différence complète hors fichiers `.env*` est sauvegardée dans `frontend-copie-complete-sans-env.patch`. Le correctif préexistant des dépendances backend est sauvegardé séparément.

## Tests et compilation

- Backend : **25 tests réussis**, exécutés depuis le dépôt habituel ; vérification de syntaxe incluse. Aucun backend applicatif démarré.
- Frontend : **96 tests réussis dans 17 fichiers**, contrôle de style des fichiers intégrés réussi et compilation de production réussie (harnais temporaire expliqué ci-dessous).
- Les contrôles SQL PIN de sécurité/concurrence avaient été validés localement lors de la livraison du 17 octobre. Ils n’ont pas été rejoués contre Supabase pendant cette intégration.

L’exécution frontend habituelle rencontre dans cet environnement un refus de lecture du fichier parent `/Users/ekko-vi/Documents/5-GIT/package.json`, lors de la résolution de dépendances et de la découverte PostCSS. Les vérifications de reprise utilisent un harnais temporaire sous `/tmp` qui pointe directement sur les sources et dépendances du dépôt habituel ; la compilation désactive uniquement la recherche ascendante d’une configuration PostCSS externe, en gardant les plugins du projet. Aucun fichier de configuration du dépôt n’est changé pour ce contournement. Aucun avertissement de dépendances n’a entraîné de mise à jour automatique.

## Suite à reprendre

1. Continuer le développement dans les deux dossiers habituels, branche `codex/covia-dev`.
2. Préparer le secret serveur PIN selon `docs/boarding-pin.md` et examiner la migration `supabase/migrations/028_booking_boarding_pin.sql`.
3. Appliquer manuellement les migrations nécessaires au projet test Covia-Dev (`ziaqkswbsjgnmmajnfyp`) uniquement quand sa version de code concorde. Cette intégration n’a modifié ni les connexions existantes ni le projet distant. **Ne pas appliquer le SQL 029 du brouillon maintenant.**
4. Reprendre séparément le contrôle des versions : récupérer/reconstruire le backend manquant, revoir les cas réseau/cache et les canaux Android/iOS réels, tester frontend/backend/SQL ensemble puis préparer une activation explicite.
5. Effectuer ensuite la revue, les commits et le déploiement coordonné lorsque souhaité. Rien n’a été publié ici.

Les documents du 17 octobre conservent leur historique ; leurs mentions d’anciens aperçus ou de serveurs locaux ne décrivent pas un serveur lancé par cette intégration.
