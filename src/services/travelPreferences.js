export const preferenceKinds = ['discution', 'smoke', 'music', 'animal'];
export const defaultPreferenceIndices = [1, 2, 1, 1];
const labels = [
    ['Bavard enthousiaste !', 'Papotage occasionnel.', 'Plutôt silencieux.'],
    ['Fumeur en voiture.', 'Fumeur hors voiture.', 'Voiture sans fumée.'],
    ['Musique non-stop !', 'Musique selon l’humeur.', 'Le silence est d’or.'],
    ['Ami des animaux.', 'Selon les animaux.', 'Pas d’animaux en voiture.'],
];
const icons = ['mdi-forum', 'mdi-smoking-off', 'mdi-music', 'mdi-paw'];
export function normalizedPreferenceIndices(values) {
    return preferenceKinds.map((_, i) => Number.isInteger(values?.[i]) && values[i] >= 0 && values[i] <= 2 ? values[i] : defaultPreferenceIndices[i]);
}
export function preferencesFromIndices(values) {
    return normalizedPreferenceIndices(values).map((index, i) => ({
        about: preferenceKinds[i], index, text: labels[i][index], prependIcon: icons[i], prependIconColor: 'var(--blue-color)',
        chip: false, chipIcon: null, chipText: '', switchBtn: false,
    }));
}
export function preferenceIndices(preferences) {
    return normalizedPreferenceIndices(preferenceKinds.map(kind => preferences?.find(p => p.about === kind)?.index));
}
