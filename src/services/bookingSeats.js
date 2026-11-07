export function bookingSeats(value){
    if(typeof value!=='number'&&typeof value!=='string')return null;
    const seats=Number(value);
    return Number.isInteger(seats)&&seats>=1&&seats<=8?seats:null;
}
export function occupiedSeats(trip){
    const seats=Number(trip?.reserved_seats??trip?.passenger_number??0);
    return Number.isInteger(seats)&&seats>=0?seats:0;
}
