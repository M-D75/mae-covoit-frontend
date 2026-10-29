# Diagnostic PIN — 29 octobre 2026

## Cause visuelle confirmée et correctif

Le style global non encapsulé de `App.vue` impose aux champs des cartes une hauteur de 78 px, une marge basse de -20 px et une largeur interne de 90 %. Les styles globaux de `Profil.vue` et `CompProfil.vue` placent le menu inférieur à 9999, au-dessus de l'ancien dialogue PIN à 3000.

La reproduction charge les vrais styles globaux de l'application et des vues, le vrai menu de trajet et le composant PIN. Avant correction, le bouton chevauche le champ de 8 px. Après isolation des styles du champ et de la carte, l'espacement mesuré est de 12 px. Le dialogue passe à 13000. Sa position suit le viewport visible, avec défilement interne ; la marge automatique globale est neutralisée. Le contrôle local du bundle confirme que le précédent correctif de présentation était déjà servi : le problème ne venait donc pas uniquement d'un ancien cache.

Les aperçus précédents isolés ne reproduisaient pas ces styles globaux. La nouvelle vérification couvre les thèmes clair et sombre et un viewport réduit simulant le clavier. Elle ne remplace pas un essai avec clavier natif sur téléphone. Les données et services des aperçus sont fictifs ; aucun PIN réel n'y figure.

## Confirmation et erreurs

Le rafraîchissement périodique utilisait l'état occupé de la confirmation et effaçait les erreurs précédentes. Il dispose maintenant d'un état séparé. Un refus reste visible après une lecture d'état, et la saisie n'est plus désactivée pendant cette lecture. Une confirmation annule la lecture concurrente et ignore sa réponse tardive.

Le client exige une preuve de confirmation pour la réservation concernée avant d'afficher la réussite. Les messages distinguent code refusé, blocage, fenêtre de montée, accès, réservation, session, version, simulation et service indisponible. « Actualiser l'état » ne fait qu'une lecture.

Le serveur peut avoir persisté la montée avant qu'une opération de règlement échoue. Il renvoie désormais dans ce cas une réponse 202 explicitement confirmée avec règlement à vérifier. Cela ne déclare pas le paiement réussi. Une clé PIN indisponible produit une erreur de service 503. Les contrôles d'identité, les groupes de réservation, la fenêtre temporelle, les limites de tentatives et les protections de simulation et de paiement sont conservés.

## Limites du diagnostic connecté

Le périmètre autorisé est le conducteur mourdas.mohamed@mae-solutions.yt et le passager mourdasm13@gmail.com, trajet Tsingoni–Mamoudzou. Les lectures ciblées de Covia-Dev montrent que la réservation 153 du trajet 344 est déjà à bord, avec paiement capturé. Cela ne permet pas d'identifier la tentative des dernières captures : on ne peut pas attribuer son refus à un code incorrect ou à une expiration.

Le fichier `.env.development.local` contient une clé PIN au format attendu et cible Covia-Dev. Cela ne prouve pas la configuration effectivement chargée par le processus en cours ni la cohérence entre plusieurs instances. Le fichier `.env` par défaut ne correspond pas à ce contexte Dev. Aucune valeur secrète n'a été affichée ou modifiée. Conserver la clé existante : la remplacer peut invalider les codes déjà émis.

Si le refus persiste après chargement du correctif, relever uniquement le statut HTTP et le code d'erreur de la requête échouée ; ne pas transmettre le PIN.

## Chargement et validation

Le serveur backend en cours n'a pas été redémarré. Un redémarrage manuel est nécessaire pour charger ses modifications, avec le fichier Dev explicite et la même clé. Hors simulation, la commande prévue est `NODE_ENV=development node --env-file=.env.development.local server.js`. En simulation, conserver les options et listes autorisées déjà utilisées ; ne pas activer les paiements automatiquement. Aucune nouvelle migration n'est nécessaire pour ce correctif.

Validation : 226 tests frontend et 66 tests backend réussis, lint réussi et compilation de production réussie. Les tests couvrent notamment l'erreur conservée après rafraîchissement, les réponses concurrentes, les réponses de confirmation incomplètes, le règlement en attente après montée persistée et la clé indisponible.

Aucune confirmation réelle, aucun règlement réel, aucune écriture distante, aucun déploiement, commit ou redémarrage d'un serveur utilisateur n'a été effectué.
