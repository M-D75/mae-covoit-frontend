export const SLOGANS=Object.freeze([
 'À plusieurs, le quotidien va plus loin.',
 'Moins de frais, plus de liens.',
 'Karibu, prenez place avec Covia.',
 'Éwa au covoiturage, place au partage !',
 'Le trajet se partage, les liens se créent.',
 'Partagez les kilomètres, allégez les dépenses.',
 'Jéjé ! Aujourd’hui, on roule ensemble.',
 'Karibu ! D’un village à l’autre, ensemble.',
 'Karibu, le partage commence à bord.',
 'Karibu à bord, Mayotte nous rapproche.',
 'Karibu, une place vous attend.',
]);
export function chooseSlogan(random=Math.random){return SLOGANS[Math.min(SLOGANS.length-1,Math.max(0,Math.floor(random()*SLOGANS.length)))];}
const launchSlogan=chooseSlogan();
export const getLaunchSlogan=()=>launchSlogan;
