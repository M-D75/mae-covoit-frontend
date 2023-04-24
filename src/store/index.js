import { createStore } from 'vuex'

export default createStore({
  state: {
    communes: ['Tsingoni', 'Mamoudzou', 'Chiconi', 'Sada', 'Texas', 'Wyoming'],
    trajets: [
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "04:50",
        "hour_end": "06:55",
        "price": 4,
        "name": "Ledou",
        "passenger_number": 2
      },
      {
        "depart": "Bandraboua",
        "destination": "Chirongui",
        "hour_start": "07:30",
        "hour_end": "09:15",
        "price": 8,
        "name": "Madi",
        "passenger_number": 1
      },
      {
        "depart": "Kani-Kéli",
        "destination": "Ouangani",
        "hour_start": "10:20",
        "hour_end": "12:10",
        "price": 6,
        "name": "Halima",
        "passenger_number": 3
      },
      {
        "depart": "Bouéni",
        "destination": "Dzaoudzi",
        "hour_start": "14:45",
        "hour_end": "16:30",
        "price": 5,
        "name": "Nassim",
        "passenger_number": 1
      },
      {
        "depart": "Sada",
        "destination": "Pamandzi",
        "hour_start": "17:05",
        "hour_end": "18:55",
        "price": 10,
        "name": "Zainab",
        "passenger_number": 4
      },
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "08:30",
        "hour_end": "10:20",
        "price": 7,
        "name": "Fatima",
        "passenger_number": 2
      },
      {
        "depart": "Bandraboua",
        "destination": "Chirongui",
        "hour_start": "11:45",
        "hour_end": "13:30",
        "price": 9,
        "name": "Ahmed",
        "passenger_number": 1
      },
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "08:30",
        "hour_end": "10:20",
        "price": 7,
        "name": "Fatima",
        "passenger_number": 2
      },
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "08:30",
        "hour_end": "10:20",
        "price": 7,
        "name": "Fatima",
        "passenger_number": 2
      },
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "08:30",
        "hour_end": "10:20",
        "price": 7,
        "name": "Fatima",
        "passenger_number": 2
      },
      {
        "depart": "Kani-Kéli",
        "destination": "Ouangani",
        "hour_start": "14:15",
        "hour_end": "16:00",
        "price": 5,
        "name": "Amina",
        "passenger_number": 3
      },
      {
        "depart": "Bouéni",
        "destination": "Dzaoudzi",
        "hour_start": "18:10",
        "hour_end": "19:50",
        "price": 6,
        "name": "Issa",
        "passenger_number": 1
      },
      {
        "depart": "Sada",
        "destination": "Pamandzi",
        "hour_start": "20:25",
        "hour_end": "22:10",
        "price": 8,
        "name": "Leila",
        "passenger_number": 4
      },
      {
        "depart": "Tsingoni",
        "destination": "Mamoudzou",
        "hour_start": "23:15",
        "hour_end": "01:05",
        "price": 10,
        "name": "Karim",
        "passenger_number": 2
      },
    ],
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
