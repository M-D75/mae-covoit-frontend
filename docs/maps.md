# Moteurs de carte

Les écrans de publication et de suivi de trajet utilisent désormais la même interface pour Google Maps et Leaflet. Le moteur ne modifie ni les itinéraires reçus, ni les alertes, ni les positions partagées, ni les événements envoyés aux écrans parents.

## Choix par environnement

Pour les tests locaux gratuits :

```env
VUE_APP_MAP_PROVIDER=leaflet
VUE_APP_API_GOOGLE_ROUTE_API_KEY=your_routes_browser_key
```

Dans ce mode, le rendu utilise Leaflet/OpenStreetMap. Le fond de carte est donc
gratuit, mais le calcul d'itinéraire reste assuré par Google Routes et nécessite
sa clé.

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
