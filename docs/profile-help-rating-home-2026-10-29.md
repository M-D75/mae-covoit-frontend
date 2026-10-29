# Profil, aide, avis et accueil — 29 octobre 2026

Modifications locales, sans commit, publication, migration distante ou changement de photo réelle. Les comptes et le parcours autorisés pour l’essai connecté restent ceux de `trip-simulation.md` : conducteur mourdas.mohamed@mae-solutions.yt, passager mourdasm13@gmail.com, Tsingoni → Mamoudzou. Le script de préparation reste non exécuté.

## Historique et photo

Le bouton Historique ouvre un dialogue dédié, rechargeable, qui interroge les publications du conducteur et ses réservations passager des trente derniers jours. Les places d’un même trajet sont regroupées ; les identifiants, rôles, dates et possibilités d’avis sont conservés lors du regroupement par mois. Une erreur de lecture s’affiche avec une action Réessayer ; un prix absent n’est pas inventé. Les requêtes restent soumises à la session et aux règles RLS existantes.

La sélection photo accepte JPEG/PNG jusqu’à 3 Mo, avec annulation sans changement. Le brouillon est en mémoire, associé à l’utilisateur ; il ne remplace pas l’avatar affiché et n’est pas persisté dans le cache local. Le recadrage produit une image JPEG de 512 px au maximum. La sauvegarde vérifie la session, met à jour `account.avatar`, exige la ligne réellement retournée puis change l’affichage. Une erreur réseau, de droits, de lecture ou de décodage préserve la photo enregistrée et ferme le chargement. Aucun bucket Storage ou droit supplémentaire n’est créé. Le sélecteur de fichiers système existant est utilisé, sans demander une permission caméra globale.

## Avis facultatif et erreur de compatibilité

Le message « Vérification de compatibilité indisponible. Réessayez. » provient du contrôle de versions backend. `/ratings` manquait à sa liste explicite des opérations de récupération. Cet envoi reste soumis à l’authentification, aux contrôles métier et au RPC SQL existants ; si une politique connue impose un protocole incompatible, il reste refusé. Une panne de lecture de politique ne bloque plus seule l’avis. Les nouveaux paiements restent refusés dans ce cas. La correction doit être chargée par le backend utilisé pour l’essai ; aucun serveur utilisateur n’a été redémarré ici.

Plus tard et le retour Android quittent l’avis vers l’accueil sans envoyer de note. Une préférence de report est isolée par compte et trajet, sans contenu d’avis. Le démarrage complet efface l’invite transitoire et le routeur n’impose plus cet écran. Une simple mise en arrière-plan ne simule ni abandon ni note. L’historique permet de rouvrir volontairement un avis après une nouvelle lecture des réservations éligibles du compte. Le serveur garde la décision finale d’éligibilité et empêche les doublons.

## Aide et mises à jour

Une aide courte et fermable est demandée après une réservation ou publication réellement réussie, jamais après un échec. Elle distingue demande en attente et acceptation ; décrit les passagers/demandes accessibles dans l’en-tête du cadre conducteur, les messages et le bouton Carte ; elle n’active ni GPS ni confirmation de montée. Elle est mémorisée par compte et rôle sur cette installation, à sa première présentation. Cela ne prétend pas prouver la toute première opération historique du compte sur tous ses appareils. Profil → Revoir l’aide permet de la rejouer. Elle attend la fermeture du dialogue de mise à jour et n’interrompt pas le recadrage ou l’avis.

Le dialogue de version utilise une icône d’actualisation avec nom accessible et infobulle. Le message de résultat distingue version à jour, nouvelle version, mise à jour obligatoire et vérification impossible, même en présence d’une ancienne politique en cache. Le bouton de récupération porte le libellé Mes trajets.

## Accueil

Illustration approuvée fournie par le parent : source PNG conservée et variante WebP transparente 960 × 640 d’environ 96 ko. Affichage sans recadrage avec une référence importée explicite, texte alternatif et largeur responsive. Aucune nouvelle image générée ici.

Le pool contient exactement les onze phrases validées dans `src/services/launchSlogan.js`. Un tirage a lieu au chargement du processus web ; navigation et arrière-plan conservent ce choix. Un nouveau lancement complet peut tirer une autre phrase, sans garantir qu’elle soit différente de la précédente. Aucune variante supplémentaire.

## Vérification et limites

198 tests frontend réussis (27 fichiers). Tests frontend : photo invalide/lecture refusée/session différente/sauvegarde refusée, nettoyage du chargement, historique des deux rôles et regroupement, report par compte, sortie sans note, retour Android et retrait de son écouteur, aide rejouable, onze slogans stables et quatre résultats du contrôle de versions. 59 tests backend réussis. Tests backend : avis autorisé en panne de politique, nouveau paiement refusé, protocole connu incompatible refusé. Compilation de production et lint ciblé vérifiés.

Aperçu local isolé avec composants réels, requêtes et comptes fictifs : illustration claire/sombre, historique, aide conducteur et dialogue de version avec actualisation et résultat. Les dépendances de recherche sont remplacées dans cet aperçu ; transitions et blocage du défilement des dialogues sont désactivés uniquement dans l’aperçu automatisé. Cet aperçu n’est pas une preuve de session connectée ni de comportement natif.

À vérifier sur téléphone de test : sélecteur photo annulé/refusé puis nouvelle sélection, recadrage et sauvegarde avec compte jetable autorisé ; retour matériel Android depuis un avis ; arrière-plan puis reprise ; arrêt complet et relance sans avis imposé. Vérifier les règles RLS de la cible et charger le backend corrigé avant l’essai réel. Aucun PIN, paiement, photo ou avis réel n’a été créé pour la validation.

## Ajout : entrée connexion et hiérarchie d’authentification

L’entrée par défaut est désormais `/login`, même sur un appareil neuf ou lorsque le stockage local est indisponible. La route explicite `/sign` reste l’inscription ; le passage entre les deux conserve la destination demandée. Le bouton principal plein, bleu Covia et arrondi est suivi immédiatement du bouton texte « Pas encore de compte ? » en connexion ou « Déjà un compte ? Se connecter » en inscription. Le formulaire de récupération reste accessible sous ces actions. Les champs et boutons suivent le thème clair/sombre ; l’ancien thème clair forcé est retiré. Les boutons de fournisseur ont des noms accessibles, et les états de validation/chargement empêchent les doubles soumissions.

Les services OAuth, URL de callback et configurations existantes ne sont pas modifiés. Tests supplémentaires : connexion par mot de passe, récupération, erreur OAuth avec callback existant et choix connexion/inscription. Total frontend : 202 tests réussis. Aperçu de largeur 390 px avec services entièrement fictifs : connexion claire, inscription sombre, bascule vers la récupération. Aucun e-mail réel ni authentification distante lancé pendant ces contrôles.
