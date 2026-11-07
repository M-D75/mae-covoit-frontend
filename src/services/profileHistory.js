import {canRateCompletedTrip} from '@/services/tripPresentation.js';
export async function fetchProfileHistory(client,{userId,accountId,resolveVillage,now=Date.now()}){
 const cutoff=new Date(now-30*86400000).toISOString(),end=new Date(now).toISOString();
 const [passenger,driver]=await Promise.all([
  client.from('booking').select('id,trip_id,is_accepted,is_refused,in_car,passenger_no_show,trip!inner(id,departure_time,route,cancellation_pending_at,village_departure_id,village_arrival_id,price,account:public_profile(avatar))').eq('passenger_account_id',accountId).gte('trip.departure_time',cutoff).lt('trip.departure_time',end),
  client.from('trip').select('id,departure_time,route,cancellation_pending_at,village_departure_id,village_arrival_id,price').eq('driver_id',userId).gte('departure_time',cutoff).lt('departure_time',end),
 ]);
 if(passenger.error||driver.error)throw new Error('Votre historique n’a pas pu être chargé. Réessayez.');
 const rows=new Map();
 const normal=(trip,role)=>({tripId:trip.id,role,depart:resolveVillage(trip.village_departure_id),destination:resolveVillage(trip.village_arrival_id),departure_time:trip.departure_time,price:trip.price??null,avatar:(Array.isArray(trip.account)?trip.account[0]:trip.account)?.avatar||null,ratingEligible:false});
 for(const row of passenger.data||[]){const trip=Array.isArray(row.trip)?row.trip[0]:row.trip;if(!trip)continue;const id=`passenger:${trip.id}`;const item=rows.get(id)||normal(trip,'passenger');item.ratingEligible ||= Boolean(row.in_car&&row.is_accepted&&!row.is_refused&&!row.passenger_no_show&&canRateCompletedTrip(trip,now));rows.set(id,item);}
 for(const trip of driver.data||[])rows.set(`driver:${trip.id}`,normal(trip,'driver'));
 return [...rows.values()].sort((a,b)=>new Date(b.departure_time)-new Date(a.departure_time));
}
