const key=userId=>`covia-rating-deferred:${userId}`;
export function deferRating(userId,tripId,storage){if(!userId||!tripId)return;try{const preferences=storage||window.localStorage;const ids=JSON.parse(preferences.getItem(key(userId))||'[]');preferences.setItem(key(userId),JSON.stringify([...new Set([String(tripId),...ids])].slice(0,50)));}catch{/* No storage is required to leave rating. */}}
export function isRatingDeferred(userId,tripId,storage){try{return JSON.parse((storage||window.localStorage).getItem(key(userId))||'[]').includes(String(tripId));}catch{return false;}}
export async function loadRatingContext(client,{tripId,accountId}){
 const {data,error}=await client.from('booking').select('id,trip_id,passenger_account_id,is_accepted,is_refused,in_car,trip(id,driver_id,departure_time,account(firstname,lastname,avatar))').eq('trip_id',tripId).eq('passenger_account_id',accountId).eq('is_accepted',true).eq('is_refused',false).eq('in_car',true).eq('passenger_no_show',false).limit(1);
 if(error||!data?.length)throw new Error('Cet avis n’est pas disponible pour votre compte.');return data;
}
