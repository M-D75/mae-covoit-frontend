export function dateConverter(date){
    let dateString = "";

    const tmpCurrentDate = new Date();
    var day   = tmpCurrentDate.getDate();
    var month = tmpCurrentDate.getMonth() + 1;
    var year  = tmpCurrentDate.getFullYear();

    const currentDate = new Date(`${month}/${day}/${year}`);
    const tomorrowsDate = new Date(currentDate);
    tomorrowsDate.setDate(currentDate.getDate() + 1);

    if (currentDate.getTime() == date.getTime()) {
        dateString = "Aujourd'hui";
    }
    else if (tomorrowsDate.getTime() == date.getTime()) {
        dateString = "Demain";
    }
    else {
        dateString = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    }

    return dateString;
}

function getMonthOrder(month) {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months.indexOf(month.toLowerCase());
}

export function groupByDate(data) {
    let grouped = new Map();

    data.forEach(item => {
        let date = new Date(item.departure_time);
        let year = date.getFullYear();
        let month = date.toLocaleString('fr', { month: 'long' });

        if (!grouped.has(year)) {
            grouped.set(year, new Map());
        }
        if (!grouped.get(year).has(month)) {
            grouped.get(year).set(month, []);
        }

        grouped.get(year).get(month).push({
            depart: item.depart,
            destination: item.destination,
            price: item.price,
            avatar: item.avatar
        });
    });

    // Trier les années
    let sortedYears = new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]));

    // Trier les mois pour chaque année
    for (let [year, monthsMap] of sortedYears) {
        let sortedMonths = new Map([...monthsMap.entries()].sort((a, b) => {
            return getMonthOrder(b[0]) - getMonthOrder(a[0]);
        }));
        sortedYears.set(year, sortedMonths);
    }

    return sortedYears;
}

export function mapToObject(map) {
    let obj = Object.create(null);
    for (let [k, v] of map) {
        obj[k] = v instanceof Map ? mapToObject(v) : v;
    }
    return obj;
}

export function findKeyOfNullOrUndefined(obj) {
    for (let key in obj) {
        if (obj[key] === null || obj[key] === undefined) {
            return key;
        }
    }
    return null;
}


//convertion de date en numéro de semaine
export function getISOWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);

    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

    const week1 = new Date(date.getFullYear(), 0, 4);

    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}


// function getNextFourWeeks() {
//     const today = new Date();
//     const weeks = [];

//     for (let i = 0; i < 5; i++) {
//         let weekNumber = getISOWeekNumber(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7 * i));
//         weeks.push(`S${weekNumber}`);
//     }

//     return weeks;
// }

// 
function getStartOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajuster si la semaine commence le dimanche
    return new Date(date.getFullYear(), date.getMonth(), diff);
}

export function getNextFourWeeks() {
    let currentDate = new Date();
    let weeks = [];

    for (let i = 0; i < 4; i++) {
        // Obtenir le début de la semaine
        let startOfWeek = getStartOfWeek(new Date(currentDate));
        weeks.push(startOfWeek);

        // la semaine suivante
        currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks.map(date => date.toISOString().substring(0, 10)); // format YYYY-MM-DD
}

export function getFirstDayOfWeek(weekStr, year = new Date().getFullYear()) {
    //ex: weekStr = "S1"
    const weekNumber = parseInt(weekStr.replace("S", "")); 

    // Trouver le premier jeudi de l'année ISO 8601
    const firstThursday = new Date(year, 0, 1 + (11 - new Date(year, 0, 1).getDay()) % 7);

    // Calculer la date de début de la semaine donnée
    const startDate = new Date(firstThursday);
    startDate.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);

    return startDate;
}

export function getDayOfWeek(date) {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    
    return days[date.getDay()].toLocaleLowerCase();
}


export function formaterDateUTC(date) {
    const pad = (num) => (num < 10 ? '0' + num : num);

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1); // Les mois commencent à 0
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00`;
}

export function arrondirSpecial(nombre) {
    const partieEntiere = Math.floor(nombre);
    const partieDecimale = nombre - partieEntiere;
  
    if (partieDecimale >= 0.5) {
      return partieEntiere + 1;
    } 
    else {
      return partieEntiere;
    }
}

export function keepLetter(word) {
    word = word.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, '');
    return word;
}

export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'k';
    }
    return num;
}


// For test
export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function getRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function getFutureTime(hours) {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toISOString();
}

//tomorow
export function tomorowDate(date) {
    // Créer un nouvel objet Date basé sur la date fournie
    let dateDemain = new Date(date);
  
    // Ajouter 1 jour
    dateDemain.setDate(dateDemain.getDate() + 1);
  
    // Réinitialiser les heures, minutes, secondes, et millisecondes à 0
    dateDemain.setHours(0, 0, 0, 0);
  
    return dateDemain;
}
  