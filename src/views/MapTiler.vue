<template>
    <div id="map"></div>
  </template>


  <script>
  import L from 'leaflet';
  
  export default {
    name: 'MyMap',
    mounted() {
      // Initialise la carte
      const map = L.map('map').setView([-12.7243245, 45.0589372], 11); // Coordonnées de Paris
  
    //   // Ajoutez le calque MapTiler
      L.tileLayer('https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=faY6afh2tnFprZqdoyZP', {
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
        maxZoom: 19,
      }).addTo(map);

    //     const key = 'faY6afh2tnFprZqdoyZP';
    //   const map = L.map('map').setView([0, 0], 1);
    //   const mtLayer = L.maptilerLayer({
    //     apiKey: key,
    //     style: "winter-v2", //optional
    //   }).addTo(map);
    //   console.log(mtLayer);
    },
  }
  </script>
  
  <style scoped>
  #map {
    height: 100vh;
    width: 100%;
  }
  </style>
  