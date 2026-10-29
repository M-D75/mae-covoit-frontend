export function validateProfilePhotoFile(file){
 if(!file||!['image/jpeg','image/png'].includes(file.type))throw new Error('Choisissez une image JPEG ou PNG.');
 if(file.size>3000000)throw new Error('Choisissez une image de moins de 3 Mo.');
}
export function readProfilePhoto(file,{Reader=FileReader}={}){
 validateProfilePhotoFile(file);
 return new Promise((resolve,reject)=>{const reader=new Reader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('La photo ne peut pas être lue. Réessayez ou choisissez une autre image.'));reader.onabort=()=>reject(new Error('Lecture annulée.'));reader.readAsDataURL(file);});
}
export function croppedProfilePhoto(canvas){
 if(!canvas||!canvas.width||!canvas.height)throw new Error('Sélectionnez une photo avant de valider.');
 const output=document.createElement('canvas');const size=Math.min(512,canvas.width,canvas.height);output.width=size;output.height=size;
 const context=output.getContext('2d');if(!context)throw new Error('Le recadrage est indisponible.');
 context.fillStyle='#ffffff';context.fillRect(0,0,size,size);context.drawImage(canvas,0,0,size,size);
 const result=output.toDataURL('image/jpeg',.85);
 if(result.length>700000)throw new Error('La photo recadrée est trop volumineuse. Choisissez une image plus simple.');
 return result;
}
export async function saveProfilePhoto(client,userId,image){
 if(!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>700000)throw new Error('Photo invalide ou trop volumineuse.');
 const {data:auth,error:authError}=await client.auth.getUser();
 if(authError||auth?.user?.id!==userId)throw new Error('Votre session a changé. Reconnectez-vous avant de modifier la photo.');
 const {data,error}=await client.from('account').update({avatar:image}).eq('user_id',userId).select('user_id,avatar').maybeSingle();
 if(error||!data||data.user_id!==userId||data.avatar!==image)throw new Error('La photo n’a pas pu être enregistrée. Votre ancienne photo est conservée.');
 return data.avatar;
}
