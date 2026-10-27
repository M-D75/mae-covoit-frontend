# Protection de log_credit — 26 octobre 2026

## À quoi sert cette table ?

Ce qui est établi : la sauvegarde locale décrit `public.log_credit` avec `id`, `created_at`, `amount` et `account_id` lié à `account`. Sa structure est compatible avec un journal de mouvements de crédits par compte. Elle ne contient pas de type de mouvement, de référence de paiement ou de clé d’idempotence permettant de la présenter comme le registre comptable complet du produit.

Aucun accès à cette table n’a été trouvé dans le frontend, le backend, les migrations métier du dépôt, les fonctions/triggers du dump ou l’historique Git consulté sur le périmètre applicatif. L’interprétation « ancien journal de crédits abandonné » reste une hypothèse : un ancien outil externe peut encore la connaître.

Le fonctionnement actuel repose notamment sur :

- `account.credit` : solde de crédits lu par l’interface.
- `stripe_credit_topup` et `apply_stripe_credit_topup` : rechargements Stripe et application idempotente au solde.
- `booking.payment_status`, `capture_wallet_bookings` : réservation/règlement des crédits des trajets.
- `wallet_earning` et `wallet_earning_conversion` : gains chauffeur et conversion de ces gains en crédits.

`log_credit` n’est donc pas utilisée comme source du solde dans le code examiné. Aucune lecture client n’étant justifiée, on n’ajoute pas de politique « propriétaire peut lire » par simple supposition.

## Protection préparée

La migration `030_secure_log_credit.sql` :

1. active RLS ;
2. retire les droits de `PUBLIC`, `anon` et `authenticated` sur la table et sur les colonnes (ces droits peuvent être accordés séparément) ;
3. retire les anciennes politiques éventuelles ;
4. retire leurs droits sur la séquence réellement attachée à `id` ;
5. conserve un accès serveur `service_role` avec une politique explicite et l’accès à la séquence.

Aucune ligne n’est supprimée, aucun montant ni solde n’est modifié, aucune colonne n’est ajoutée. L’opération est transactionnelle et réexécutable. Si la table ou sa séquence ne correspond pas au schéma attendu, la transaction échoue au lieu d’ignorer une protection manquante. Les propriétaires SQL/administrateurs restent administrateurs : RLS ne remplace pas la protection de leurs identifiants ni celle de la clé serveur. Aucun changement des autres tables de crédit n’est fait ici.

## Application manuelle : Covia-Dev uniquement

**Non appliquée à distance par l’agent.** Aucun accès SQL/outil d’administration sécurisé utilisable n’a été trouvé dans cette session. Les clés API existantes ne permettent pas, à elles seules, d’exécuter une migration SQL arbitraire.

1. Ouvrir le tableau de bord Supabase de **Covia-Dev**, référence **`ziaqkswbsjgnmmajnfyp`**, et vérifier le projet dans l’URL et l’en-tête avant d’ouvrir SQL Editor.
2. Ne pas utiliser le projet de production **mycovoit-dev**, référence **`uowqusyfvjvxvtqbuxlx`**.
3. Exécuter le contenu de `030_secure_log_credit.sql` dans SQL Editor du projet test. La migration 029, réservée au contrôle de version inachevé, **n’est pas requise** et ne doit pas être appliquée pour cela.
4. Exécuter les requêtes de `docs/testing/verify-log-credit.sql`. Attendre RLS à `true`, tous les droits navigateur à `false`, les droits serveur à `true`, et une seule politique `Server manages log_credit` pour `service_role`.
5. Vérifier le parcours habituel de crédits en environnement test. Le code examiné ne dépend pas de `log_credit`, mais un éventuel outil externe devra désormais passer par le serveur.

Ne transmettre aucune clé dans la conversation. Le SQL n’en contient aucune.

## Validation réalisée

`scripts/test-log-credit-rls.py` démarre un PostgreSQL local jetable sans écoute TCP et l’arrête après les tests ; aucune connexion Supabase n’est faite. Le schéma de test reproduit les colonnes et droits historiques, avec en plus un ancien droit par colonne et une politique publique pour vérifier leur retrait.

Résultat : deux applications successives réussies ; données préexistantes conservées ; refus réel de lecture, écriture, suppression, troncature et `nextval` pour `anon` / `authenticated` ; droits par colonne retirés ; opérations serveur vérifiées avec un rôle de test **sans** `BYPASSRLS`, donc politique effectivement exercée.

Commande : `python3 scripts/test-log-credit-rls.py`. Adapter `POSTGRES_BIN` si les outils PostgreSQL ne sont pas dans `/opt/homebrew/bin`. Aucun serveur applicatif démarré, aucune dépendance installée, aucun commit ni push supplémentaire effectué. Les fichiers `.env*` et les modifications utilisateur de dépendances backend sont préservés.
