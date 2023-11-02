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
        dateString = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return dateString;
}