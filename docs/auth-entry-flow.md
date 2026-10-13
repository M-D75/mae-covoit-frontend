# Inscription et connexion — 13 octobre 2026

## Comportement

- Depuis l'accueil ou une page protégée, un appareil sans préférence locale
  ouvre `/sign`. Après une inscription réussie ou une session authentifiée,
  il ouvre `/login` lorsqu'une nouvelle authentification est nécessaire.
- Cette préférence (`mae-auth-entry=login`) ne contient aucun identifiant
  ni token, et ne remplace jamais la vérification de session Supabase.
- Les routes `/login` et `/sign` restent accessibles explicitement. Le bouton
  de changement de mode conserve la destination prévue après authentification.
- Un titre indique le mode courant. L'encart « Pas encore de compte ? » /
  « Vous avez déjà un compte ? » contient un bouton explicite et reste dans
  le flux défilant pour éviter le chevauchement avec le clavier.
- La validation a lieu à l'envoi. Après une inscription réussie sans session,
  les champs et la validation sont remis à zéro et une confirmation reste
  visible. Si Supabase retourne immédiatement une session, le parcours
  continue vers la complétion du profil ou la destination demandée.
- Un échec conserve les champs, affiche une erreur et autorise une reprise.
  Les soumissions simultanées sont bloquées.

## Validation

31 tests d'authentification passent, dont 11 nouveaux tests couvrant la
préférence locale, les erreurs de stockage, la validation, la confirmation,
la session immédiate, les échecs réseau et le changement de mode.
Le lint des fichiers modifiés et la compilation de production passent.
Les ressources Android ont été synchronisées via Capacitor.

À vérifier sur le prochain APK : inscription avec confirmation par mail,
absence d'erreur sous le champ vidé, visibilité de l'encart avec le clavier,
connexion d'un utilisateur existant et ouverture de l'inscription sur une
installation vierge. Les comptes créés avant l'ajout de la préférence peuvent
voir l'inscription par défaut jusqu'à leur prochaine connexion réussie.
Une absence de stockage local ne prouve pas que la personne n'a aucun compte :
le bouton « Se connecter » reste donc toujours disponible sur l'inscription.
