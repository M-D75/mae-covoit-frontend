const DAY = 86400000;
const pad = number => String(number).padStart(2, '0');
function monday(date) {
    const result = new Date(date);
    if (!Number.isFinite(result.getTime())) throw new Error('Date invalide.');
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - (result.getDay() + 6) % 7);
    return result;
}
function isoWeek(date) {
    // Work on the local calendar day in UTC to avoid DST-length weeks.
    const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    thursday.setUTCDate(thursday.getUTCDate() + 3 - (thursday.getUTCDay() + 6) % 7);
    const year = thursday.getUTCFullYear();
    return {year, number: Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / DAY + 1) / 7)};
}
function fromISOWeek(year, number) {
    const start = monday(new Date(year, 0, 4));
    start.setDate(start.getDate() + (number - 1) * 7);
    const actual = isoWeek(start);
    if (actual.year !== year || actual.number !== number) throw new Error('Semaine invalide.');
    return start;
}
export function upcomingRecurringWeeks(now = new Date(), count = 4) {
    const start = monday(now);
    return Array.from({length: count}, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + 7 * index);
        const iso = isoWeek(date);
        return {week: `S${iso.number}`, isoYear: iso.year,
            startDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, selected: true};
    });
}
export function recurringWeekStart(week, now = new Date()) {
    if (!/^S([1-9]|[1-4][0-9]|5[0-3])$/.test(week?.week || '')) throw new Error('Semaine invalide.');
    const number = Number(week.week.slice(1));
    if (week.startDate != null) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(week.startDate);
        if (!match) throw new Error('Date de semaine invalide.');
        const [year, month, day] = match.slice(1).map(Number);
        const start = new Date(year, month - 1, day);
        const iso = isoWeek(start);
        if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day
            || start.getDay() !== 1 || iso.number !== number || (week.isoYear != null && week.isoYear !== iso.year)) {
            throw new Error('Date de semaine invalide.');
        }
        return start;
    }
    if (week.isoYear != null) {
        if (!Number.isInteger(week.isoYear) || week.isoYear < 2000 || week.isoYear > 9999) throw new Error('Année invalide.');
        return fromISOWeek(week.isoYear, number);
    }
    // A form already open before the update may carry only its week label.
    // Infer its next occurrence independently of the other checked boxes.
    const today = monday(now), iso = isoWeek(today);
    let start = fromISOWeek(iso.year, number);
    if (start < today) start = fromISOWeek(iso.year + 1, number);
    return start;
}
