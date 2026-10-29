# Réflexion produit — aide après la première réservation

Document de réflexion uniquement, 28 octobre 2026. Aucun composant, déclencheur, stockage de progression ou parcours de tutoriel n’a été ajouté.

## Objectif

Après la première réservation confirmée par le serveur, expliquer brièvement où retrouver son trajet, sa carte et ses messages. Si la demande attend l’accord du conducteur, le dire explicitement : ne pas présenter la réservation comme acceptée ni la montée comme confirmée. Éviter un déclenchement pendant une authentification bancaire ou avant son retour serveur.

Proposer une aide courte, facultative, dismissible et rejouable depuis une entrée Aide. Ne pas imposer une visite générale de l’application ni rouvrir automatiquement l’aide après chaque navigation ou reconnexion. Une éventuelle mémorisation de l’aide vue devra être limitée au compte connecté, sans enregistrer les messages ou positions.

## Repères passager

Montrer le cadre de sa réservation et son statut. Expliquer que la messagerie sert à convenir des détails avec le conducteur, que la carte est accessible en une action depuis l’échange et que le partage de localisation est volontaire. Présenter le code de montée comme un code à communiquer au conducteur au moment convenu ; seule sa validation réelle sur le serveur confirme « à bord ». Aucun succès du PIN hors ligne, aucune arrivée ou paiement déclenché par une zone de village à annoncer.

Expliquer simplement la conservation des messages : quinze jours après chaque envoi, échanges propres à ce trajet, signalement disponible si nécessaire. L’aide ne doit pas demander d’envoyer de données sensibles pour essayer le chat.

## Repères conducteur

Conserver la distinction entre la partie consacrée au jour/planning, qui permet de gérer les demandes et d’accepter/refuser les réservations, et le cadre d’un trajet, qui ouvre son échange ou le suivi correspondant. Dans le parcours existant observé, le cadre du trajet conducteur conduit déjà à la messagerie lorsque des contacts sont disponibles ; la carte est accessible depuis celle-ci en une action. Conserver ce choix avant le départ, plutôt que déplacer sans besoin les commandes habituelles.

Les aides contextuelles proposées : « Gérer les demandes de ce jour » près du planning, « Échanger avec les passagers de ce trajet » près de son cadre, puis « Ouvrir la carte et activer volontairement le suivi » dans la messagerie. Présenter le sélecteur de contact et ses non-lus sans donner l’impression d’un groupe partagé entre tous les passagers.

## Forme envisagée et décisions à prendre

Deux ou trois indications courtes au moment où la commande est utile, chacune fermable, plutôt qu’une séquence bloquante. L’aide pourrait rester lisible en clair/sombre, sur petit écran, avec des boutons suffisamment grands et des libellés accessibles. La version rejouable doit montrer les vrais intitulés présents dans l’application.

À décider avant implémentation : ce qui compte comme « première réservation » (demande persistée ou acceptation), emplacement de l’entrée Revoir l’aide, prise en compte d’un compte à la fois conducteur et passager, priorité entre une aide et une erreur de réservation, et comportement sur un trajet annulé ou ancien. Ne pas ajouter de collecte analytique ou d’autoactivation du GPS dans le cadre de cette aide.

Valider le texte et quelques maquettes avec un nouveau passager et un conducteur avant d’écrire le code. La réussite serait qu’ils retrouvent spontanément le bon échange et la carte, et distinguent une demande, une acceptation et une montée confirmée.
