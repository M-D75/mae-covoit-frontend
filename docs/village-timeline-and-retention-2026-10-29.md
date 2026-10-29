# Détails des villages dans le panneau inférieur — 29 octobre 2026

## 031 et échec de 032

L’utilisateur confirme l’exécution de **031** dans TEST. **032 est facultative** : elle exige `pg_cron` déjà activé par le propriétaire. L’exception « Enable pg_cron in TEST first » est prévue par le script. Elle annule la transaction de 032, pas la transaction de 031 exécutée et validée séparément auparavant. Ni l’extension ni une migration distante n’ont été activées ici.

Sans 032, le backend du dépôt appelle la purge au démarrage puis à la minute 7 de chaque heure, **hors mode simulation**. Les RPC filtrent les messages expirés même avant leur suppression physique ; la purge retire aussi les preuves expirées sans prolonger leur rétention. Pour que la suppression physique soit fiable, vérifier : backend actuel démarré sur Covia-Dev avec `.env.development.local` explicite, mode simulation désactivé pour cette tâche de maintenance, absence d’erreur de purge au démarrage et aux heures suivantes, supervision de disponibilité/redémarrage. Ne pas lancer un deuxième backend sans les gardes du simulateur pour contourner ce point pendant un essai. Si le backend ne reste pas disponible, prévoir le job 032 après activation explicite de pg_cron par le propriétaire et vérifier son exécution. La simple présence d’un processus n’est pas une preuve de purge réussie.

La vérification en lecture seule de `cron.job` est décrite dans `docs/testing/verify-trip-migrations.sql` ; ne lancer la requête commentée que si pg_cron existe. Aucun RPC `purge` distant n’a été invoqué ici. Le démarrage manuel hors simulation reste :

```sh
NODE_ENV=development node --env-file=.env.development.local server.js
```

Conserver la commande et les listes de simulation déjà autorisées si l’essai les utilise. Le `.env` backend par défaut cible la production ; ne pas l’utiliser par inadvertance.

## Modèle unique et présentation

`MapSurface` conserve les calculs des limites, de leur intersection avec l’itinéraire et de la progression. La légende et le bouton Zones du haut sont retirés. Le composant émet `route-details`, une projection légère des zones déjà utilisées par Google/Leaflet, sans géométrie dupliquée ni nouvel appel de routage.

La frise part du départ, parcourt les villages intermédiaires dans l’ordre de leur première intersection sur **l’itinéraire original sélectionné**, puis l’arrivée. Les alias géographiques sont dédupliqués par le modèle existant. Un départ et une arrivée dans la même zone gardent l’unique repère « Départ et arrivée », comme la carte. La portion de route rognée pour l’affichage de la progression n’est pas utilisée pour recalculer les villages traversés. Le changement d’itinéraire ferme les détails et réinitialise la progression via les gardes existantes.

Couleurs partagées, sans nouvelle palette : départ `#15803d`, intermédiaire `#6d28d9`, arrivée `#c2410c`. Le suivi affiche textuellement Traversé, Zone actuelle, À venir ou progression suspendue ; le passage traversé est aussi atténué. La publication reste une **prévision**, même si un ancien état de suivi lui était fourni : aucune position GPS ni progression accomplie n’est inventée. Aucune heure intermédiaire, promesse d’arrêt ou réservation à une étape n’est ajoutée. Le texte rappelle qu’un passage géométrique n’est pas un arrêt garanti.

## Intégration et priorité

Le bouton « Voir les détails » se situe dans le résumé temps/distance des deux vrais panneaux : `BottomMenuTrip` pour le suivi (conducteur et passager) et `BottomMenu` pour la publication. La liste est intégrée, défilable, avec hauteur bornée par la fenêtre visible, y compris le clavier mobile. Fermer ou Échap replie la frise et ramène le focus au bouton. Le panneau PIN passager remplace toujours le résumé ; le dialogue PIN conducteur bloque et replie les détails. Les commandes et statuts passagers restent en place.

La hauteur supplémentaire réellement mesurée est remontée au contrôleur de carte. Elle ajuste le padding inférieur utilisé par le cadrage existant, sans relancer Google Routes ni modifier la géométrie. Les changements de couleur/progression ne recadrent pas la carte. En cas de limites manquantes, les repères d’extrémités restent présents, un état d’indisponibilité est explicite et Réessayer recharge seulement les limites via le service/cache existant.

## Validation

Tests de la frise : ordre et couleurs du modèle partagé, états de progression, absence d’heures inventées, prévision sans fausse progression, fallback départ/arrivée et nouvelle tentative, fermeture sur changement d’itinéraire/Échap/priorité PIN. Les tests cartographiques existants continuent de vérifier alias, itinéraire original, découpage, progression et Google/Leaflet. Aperçu à 390 px avec les vrais panneaux et des données fictives, clair/sombre, longue liste et PIN prioritaire. Aucune action de réservation, géolocalisation, paiement ou base distante déclenchée pour cet aperçu.

Résultat local : **215 tests frontend réussis (29 fichiers)**, lint ciblé et compilation de production réussis. Le test de cadrage vérifie que la hauteur supplémentaire est transmise aux deux adaptateurs sans relecture des limites ni réinitialisation des visites. Les captures à 390 px ont confirmé une liste défilable de 340 px restant dans l’écran, l’arrivée orange accessible en bas, les phases Prévision en publication et le retrait immédiat de la frise pour le PIN. Le fond cartographique de l’aperçu est fictif ; aucun SDK distant, GPS réel ou trajet connecté n’a été sollicité pour cet essai visuel. Aucun commit, push, déploiement, changement de configuration ou écriture distante.
