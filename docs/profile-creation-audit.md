# Audit du parcours « Qui êtes vous ? » — 13 octobre 2026

## Diagnostic confirmé par les logs Android / serveur

Après application de la migration 022, le test sur téléphone a renvoyé
`PGRST204: Could not find the 'village' column of 'account' in the schema cache`.
Il s'agit d'un autre défaut : la route `/account/profile` insère `village`,
mais les migrations du dépôt ne créaient pas cette colonne. L'audit initial
n'avait pas détecté ce décalage avec le schéma de production.

La migration **023_add_account_village.sql** ajoute la colonne facultative
`public.account.village` de type `text` si elle manque et demande à PostgREST
de recharger son cache. Si elle existe déjà, son contenu est conservé et
le cache est quand même rafraîchi. Elle ne nécessite ni nouveau backend,
ni reconstruction de l'APK déjà corrigé. Le test SQL vérifie les profils
existants, la réapplication et la possibilité de ne pas renseigner de village.

## Correctif SQL

Un second extrait des logs, après correction de `village`, révèle `23505`
sur `settings_pkey` avec l'ID 3. Le serveur ne fournit pas `settings.id` :
le défaut est donc dans sa génération côté base. La migration 024 répare
le compteur serial/identity lorsqu'il est en retard, sans le faire reculer
s'il est déjà en avance. Elle échoue explicitement si aucune séquence
associée à `settings.id` n'existe, afin de ne pas masquer un défaut différent.
Le test SQL reproduit la collision et vérifie la réapplication et l'absence
de recul d'une séquence saine.

La création du profil et des préférences est actuellement en deux opérations.
Le profil peut donc exister malgré un échec des préférences ; au redémarrage,
le garde de navigation se base sur la présence du profil et laisse entrer
l'utilisateur. Cela ne prouve pas que ses préférences ont été créées.
Une reprise de `/account/profile` avec la session du même utilisateur répare
les préférences sans supprimer le profil, une fois le schéma corrigé.

Le serveur crée `account`, puis utilise un upsert de `settings` avec
`onConflict: 'account_id'` et `ignoreDuplicates: true`. L'index de la migration
010 est partiel (`where account_id is not null`) : PostgreSQL ne peut pas
l'utiliser pour cette cible de conflit sans prédicat et renvoie `42P10`, sauf
si la base dispose déjà d'un autre index unique complet compatible.

La migration **022_fix_profile_settings_upsert.sql** remplace cet index par
un index unique complet, dans une transaction. Les valeurs NULL restent
autorisées en plusieurs exemplaires. Aucune donnée n'est supprimée.
Le test SQL dans `tests/sql/profile_settings_upsert.sql` reproduit le défaut,
applique deux fois le correctif et vérifie les reprises et les préférences
existantes. Il doit être exécuté dans une base PostgreSQL jetable et vide.

## Audit et protections du formulaire

- L'identité et l'email utilisés à la création proviennent de la session
  authentifiée côté serveur. La route exige la clé de service Supabase.
- La route récupère un profil existant et répare les préférences lors d'une
  reprise. Une collision sur la création du profil est relue côté serveur.
- La création des objets Stripe reste récupérable et ne transforme pas un
  profil créé avec succès en erreur d'inscription.
- Les exceptions de vérification de session sont désormais traitées dans
  l'action Vuex ; une session expirée renvoie un message explicite.
- Le formulaire accepte Entrée, bloque les soumissions simultanées, affiche
  l'attente et permet de réessayer après un échec.
- Le nom et le prénom sont normalisés par trim et vérifiés avant l'envoi
  (obligatoires, 100 caractères maximum, comme côté serveur).
- Les apostrophes, traits d'union et caractères internationaux des noms
  sont conservés ; le filtre ancien les supprimait pendant la saisie.
- Un échec du chargement des villages ne bloque plus l'accès au formulaire.
  Le village reste facultatif, conformément au contrat serveur.

## Mise en service et limites

Validation locale effectuée : 20 tests du parcours d'authentification réussis
(dont 10 nouveaux tests de création), 19 tests serveur réussis, lint des
fichiers JavaScript/Vue modifiés et compilation de production réussis.
Le test SQL a reproduit `42P10` dans un PostgreSQL jetable, puis validé la
migration, sa réapplication, l'absence de doublons et la conservation des
préférences existantes. La compilation affiche des avertissements sur les
dépréciations Sass, l'ancienneté de Browserslist et la taille des bundles.

Appliquer les migrations 022, 023 et 024 sur Supabase après les migrations précédentes,
puis déployer la nouvelle version du frontend. Le serveur n'a pas besoin
de modification pour ce correctif.

La base de production n'a pas été consultée directement ; le diagnostic
PGRST204 repose sur l'extrait des logs serveur fourni par le propriétaire.
La migration 023 a aussi été testée deux fois dans une base jetable, avec
conservation du village existant et insertion d'un profil sans village.
Une vérification
en environnement connecté reste nécessaire : nouvelle inscription, session
expirée, double clic, reprise après réponse perdue et Stripe indisponible.
Si un profil existe déjà après l'ancien échec, rappeler `/account/profile`
avec sa session permet de créer ses préférences sans dupliquer le profil.
