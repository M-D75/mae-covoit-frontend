# Préparation du test Google Play — 11 octobre 2026

## Changements techniques

- `compileSdkVersion` et `targetSdkVersion` : 36.
- `minSdkVersion` : 24 (Android 7.0 minimum), pour la protection automatique Play.
- `versionCode` : 2 après le premier envoi rejeté ; `versionName` : 1.0.
- Android Gradle Plugin 8.13.2 et Gradle 8.13 (Java 17 minimum).
- Permissions de localisation approximative et précise déclarées. Aucune permission de localisation en arrière-plan.
- Partage de position désactivé initialement. Explication et choix explicite avant la demande système. Localisation approximative acceptée.
- Menu inférieur : hauteur et espacement adaptés à la barre système via les insets natifs ; recalcul au redimensionnement, retour au premier plan et fermeture du clavier.
- Le suivi est interrompu à la désactivation, sortie de la carte et passage en arrière-plan. Le retour sur la carte nécessite une nouvelle activation. Les callbacks tardifs sont ignorés.
- Le retour OAuth garde son schéma personnalisé ; `autoVerify` a été retiré car il est réservé aux App Links HTTPS.
- Imports directs du plugin de notifications et contrôle de `display === 'granted'`.
- Politique de confidentialité réécrite et pages HTML publiques générées depuis une source commune.

## Informations à finaliser avant un test fermé

La politique et les conditions d’utilisation sont des bases de travail, pas une validation juridique des pratiques réelles. Les règles tarifaires et d’annulation des CGU doivent également être validées par MAE Solutions.

1. Renseigner `VUE_APP_PRIVACY_CONTACT_EMAIL` dans l'environnement de production. L'adresse doit être surveillée et capable de recevoir les demandes de suppression.
2. MAE Solutions doit confirmer son identité/adresse, les bases légales, les durées de conservation par catégorie de données, les pays d'hébergement/transferts et les garanties contractuelles des prestataires. Compléter `src/services/privacyPolicy.js` avec ces informations.
3. Définir la procédure et le délai de traitement manuel/anonymisation pour les comptes à historique financier. Le serveur refuse toujours leur suppression automatique (`ACCOUNT_HAS_FINANCIAL_HISTORY`) pour protéger les registres comptables. Le lien de contact fournit une demande manuelle ; il ne réalise pas une anonymisation automatique.
4. Héberger `privacy.html` et `account-deletion.html` sur une URL HTTPS publique et stable accessible sans connexion. Les fichiers locaux ne constituent pas des URLs utilisables dans Play Console. Ajouter ces URLs à la fiche Play et au formulaire de suppression.
5. Compléter « Sécurité des données », classification du contenu, public cible et accès de l'équipe de validation. Déclarer les usages réels (profil, localisation, notifications, paiements, messages, prestataires) ; ne pas déduire les réponses uniquement des permissions Android.
6. Les risques serveur déjà listés dans `docs/security-hardening.md` restent à traiter avant une ouverture publique, notamment les règles RLS, la protection de l'API et les anciens secrets à tourner.

## Génération Android

```sh
npm run build:prod
npx cap sync android
cd android
./gradlew :app:bundleRelease :app:lintRelease
```

Le bundle est généré dans `android/app/build/outputs/bundle/release/app-release.aab`.
Sans clé d'upload configurée, le bundle est **non signé** et ne doit pas être envoyé à Google Play.

Utiliser la clé d'upload existante du projet, avec les variables d'environnement :

- `MAE_UPLOAD_STORE_FILE` : chemin absolu du keystore.
- `MAE_UPLOAD_STORE_PASSWORD` : mot de passe du keystore.
- `MAE_UPLOAD_KEY_ALIAS` : alias de la clé d'upload.
- `MAE_UPLOAD_KEY_PASSWORD` : mot de passe de la clé.

Ne jamais stocker ces secrets dans Git. Si une version a déjà été envoyée à Play, augmenter `versionCode` au-delà du code déjà utilisé. Vérifier le certificat avec `jarsigner -verify` avant l'envoi. Le `applicationId` reste `com.maecovoit.app`, indépendamment du nom commercial choisi.

## Recette sur appareils

Sur Android 12 et Android 16, avec une installation propre :

1. Ouvrir la carte : aucun accès ni partage de position automatique.
2. Choisir « Continuer sans » : carte et recherche utilisables sans localisation.
3. Activer la position et refuser la permission : aucun envoi de coordonnées ; erreur compréhensible ; pas de boucle de demande automatique.
4. Autoriser la localisation approximative : position utilisable, sans imposer la précision.
5. Autoriser la localisation précise : suivi et partage avec les participants autorisés.
6. Désactiver le partage, quitter la carte, verrouiller l'écran et changer d'application : plus de suivi/envoi ; le retour n'active pas automatiquement le partage.
7. Désactiver le GPS, retirer la permission dans les réglages : arrêt du suivi et possibilité de continuer sans.
8. Refuser puis autoriser les notifications sur Android 13+ : aucune planification après refus ; réception après autorisation.
9. Vérifier login, retour OAuth, trajets, réservation, paiement en mode test, messages et suppression d'un compte sans historique financier.
10. Vérifier le contact manuel et les deux pages publiques depuis un navigateur sans connexion.
11. Vérifier les marges et boutons sous Android 15/16 (affichage edge-to-edge), les petites tailles d'écran et le retour système.

Examiner le rapport de pré-lancement Play Console. Vérifier la compatibilité 16 Ko du bundle final et de toute bibliothèque native ajoutée ultérieurement.

## Nommage

Le nom commercial est désormais **Covia**, harmonisé dans Android, iOS, Capacitor, le titre web/PWA, les textes publics et le partage. L’identifiant Android `com.maecovoit.app`, les schémas OAuth et les URLs existantes sont conservés. La fiche Google Play devra également afficher Covia.

## Validation effectuée

- 48 tests unitaires réussis, dont refus, localisation approximative et protection contre les callbacks tardifs.
- Build web production et lint des fichiers JavaScript/Vue modifiés réussis.
- Bundle release API 36 généré ; Android lint : aucune erreur, 16 avertissements (ressources, icônes et versions), sans désactiver les contrôles.
- Manifeste release vérifié : permissions de localisation et notifications présentes, aucune permission de localisation en arrière-plan, application non débogable.
- Ressources web et pages publiques du bundle comparées au build final. Aucune bibliothèque native `.so` dans ce bundle.
- Bundle non signé : clé d’upload encore nécessaire. Aucun appareil/émulateur connecté ; recette des permissions sur appareil réel encore à faire.
