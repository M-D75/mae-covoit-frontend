# Moteurs de carte

Les écrans de publication et de suivi de trajet utilisent désormais la même interface pour Google Maps et Leaflet. Le moteur ne modifie ni les itinéraires reçus, ni les alertes, ni les positions partagées, ni les événements envoyés aux écrans parents.

## Choix par environnement

Pour utiliser le rendu Leaflet :

```env
VUE_APP_MAP_PROVIDER=leaflet
VUE_APP_API_GOOGLE_ROUTE_API_KEY=your_routes_browser_key
```

Dans ce mode, le rendu utilise Leaflet/OpenStreetMap. Le calcul d’itinéraire
reste assuré par Google Routes et nécessite sa clé.

Pour afficher Google Maps :

```env
VUE_APP_MAP_PROVIDER=google
VUE_APP_API_VUE_GOOGLE_MAP=your_browser_key
VUE_APP_API_GOOGLE_ROUTE_API_KEY=your_routes_browser_key
```

Si la clé Google Maps manque, le rendu revient automatiquement à Leaflet. La
clé Google Routes reste obligatoire dans les deux modes pour calculer un
itinéraire. Les clés navigateur doivent être limitées aux domaines de
l'application et chacune aux seules API nécessaires (Maps JavaScript ou Routes).

## Choix à l'exécution

Un écran de réglages pourra appeler :

```js
import { setMapProvider } from '@/utils/mapProvider.js';

setMapProvider('leaflet');
setMapProvider('google');
```

Le choix est conservé dans `localStorage`. Une prop `map-provider="google"` ou `map-provider="leaflet"` reste prioritaire pour un écran de test précis.

Le choix `localStorage` est prioritaire sur `.env`. Avant un test gratuit,
effacez une éventuelle ancienne préférence Google puis sélectionnez Leaflet :

```js
localStorage.removeItem('mae-map-provider');
setMapProvider('leaflet');
```

Le changement à l'exécution remonte immédiatement le composant de rendu. La
géométrie Google déjà calculée reste affichée, sans perdre l'état GPS et
Socket.IO.

## Calcul d'itinéraire

Le calcul utilise toujours Google Routes. Sa réponse est normalisée sous la
même forme (`polylineDecoded`, durée, distance, alternatives et route courante),
puis la géométrie est dessinée par le composant Leaflet ou Google Maps choisi.
La publication, la sélection d'une alternative et le recalcul GPS gardent donc
exactement le même comportement dans les deux modes.

## Fichiers d’environnement et activation

`VUE_APP_MAP_PROVIDER` existe déjà et est consommée globalement par `src/utils/mapProvider.js` puis `MapSurface.vue`. Il n’y a pas de deuxième variable à ajouter. Valeurs reconnues : `google` et `leaflet`. Une valeur absente ou inconnue revient à Leaflet.

Pour le développement, définir `VUE_APP_MAP_PROVIDER=google` dans le fichier local effectivement prioritaire, puis arrêter et relancer le serveur frontend. Avec Vue CLI, l’ordre de priorité des fichiers est : `.env.development.local`, `.env.development`, `.env.local`, `.env`. Pour la production, remplacer `development` par `production`. Une variable déjà exportée dans le processus de lancement reste prioritaire sur ces fichiers. Les variables `VUE_APP_*` sont intégrées à la compilation : modifier un fichier après compilation ne change pas une application déjà construite. Pour une app Capacitor installée, reconstruire le frontend, synchroniser les ressources puis reconstruire/distribuer l’app native selon le processus habituel.

Au contrôle local du 26 octobre, `.env.development.local`, `.env.development` et `.env.production` sélectionnent explicitement `leaflet`. Une clé Google Maps est présente dans la configuration locale, sans que sa validité, ses restrictions ou ses droits aient été vérifiés. Ces fichiers n’ont pas été modifiés. Changer uniquement `.env.development` ne suffira donc pas tant que `.env.development.local` impose Leaflet.

Ordre du choix de rendu : prop explicite de l’écran → préférence navigateur `mae-map-provider` → `VUE_APP_MAP_PROVIDER` → Leaflet. Si une ancienne préférence navigateur impose Leaflet, retirer **uniquement** cette préférence puis recharger :

```js
localStorage.removeItem('mae-map-provider');
```

Ne pas vider tout le stockage : cela supprimerait aussi d’autres préférences ou la session. Le repli Google → Leaflet couvre l’absence de clé d’affichage ; ce n’est pas une reprise automatique d’une clé invalide ou d’un chargement réseau refusé.

## Structure et coût des modifications

- `src/components/maps/MapSurface.vue` est l’interface commune : centre, zoom, origine/destination, routes, zones, positions, alertes et événements `ready`, `route-select`, `alert-select`. Elle choisit l’adaptateur, charge les contours une seule fois via `villageBoundaryService.js` et prépare les zones et la légende. Les écrans de publication, de trajet et de carte d’alertes passent par cette interface.
- `mapSurfaceUtils.js` partage les conversions de coordonnées, libellés, ordre des itinéraires et définitions d’alertes. `villageZoneUtils.js` partage les couleurs, les géométries et leur conversion pour les deux rendus. `routingService.js` calcule et normalise l’itinéraire Google Routes, quel que soit le moteur d’affichage.
- `GoogleMapSurface.vue` et `LeafletMapSurface.vue` adaptent ces données aux deux bibliothèques. Ils conservent chacun leurs composants de marqueurs, polygones, polylignes, bulles, options visuelles et ajustement du cadrage.

Changer une règle métier, les données d’un trajet, le chargement des contours ou les styles partagés ne nécessite généralement qu’une modification commune. Changer un rendu propre à la bibliothèque — icône, bulle, interaction, options de polygone ou comportement de cadrage — peut demander une adaptation dans **les deux** composants. Ajouter un nouvel élément à la carte demande de l’exposer dans l’interface commune, puis de l’afficher dans chaque adaptateur. Les tests des deux rendus vérifient notamment la coexistence zones + marqueurs + itinéraire ; ils ne garantissent pas une identité visuelle parfaite entre les bibliothèques.
