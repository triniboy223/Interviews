import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
const allowedOrigin='https://triniboy223.github.io';
const opts={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const claims=(jwt:string)=>JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
const accessAllowed=(record:string)=>{const p=JSON.parse(record);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const day=['year','month','day'].map(k=>parts.find(v=>v.type===k)?.value).join('-');return !!p.is_active&&(p.is_full_time||((!p.placement_start||p.placement_start<=day)&&(!p.placement_end||p.placement_end>=day)));};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&origin!==allowedOrigin)return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 try{
  const bearer=req.headers.get('Authorization')||'';if(!bearer.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
  const url=Deno.env.get('SUPABASE_URL')!,admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,opts);
  const {data:identity,error:identityError}=await admin.auth.getUser(bearer.slice(7));
  if(identityError||!identity.user)return reply(401,{error:'Sign in required'});
  const text=await req.text();if(text.length>8192)return reply(413,{error:'Request too large'});const input=JSON.parse(text);
  if(input.action==='end'){
   if(typeof input.id!=='string')return reply(400,{error:'Session required'});
   const {data:record}=await admin.from('admin_act_as_sessions').select('*').eq('id',input.id).eq('actor_id',identity.user.id).single();
   if(!record)return reply(403,{error:'This session does not belong to you'});
   if(typeof input.access_token==='string'){
    const {data:target}=await admin.auth.getUser(input.access_token);
    if(target.user?.id!==record.target_id||claims(input.access_token).session_id!==record.auth_session_id)return reply(403,{error:'Session does not match'});
    const {error}=await admin.auth.admin.signOut(input.access_token,'local');if(error&&error.status!==404)return reply(400,{error:'Could not end the target sign-in. Try again.'});
   }
   const {error}=await admin.from('admin_act_as_sessions').update({ended_at:new Date().toISOString()}).eq('id',record.id);if(error)throw error;
   return reply(200,{ended:true});
  }
  if(input.action!=='start'||typeof input.target!=='string')return reply(400,{error:'Target account required'});
  const {data:actor}=await admin.from('profiles').select('id,display_name,is_active,is_admin,is_full_time,placement_start,placement_end').eq('id',identity.user.id).single();
  if(!actor||!accessAllowed(JSON.stringify(actor))||!actor.is_admin)return reply(403,{error:'Active administrator access required'});
  const sourceSession=claims(bearer.slice(7)).session_id;
  const {data:nested}=await admin.from('admin_act_as_sessions').select('id').eq('auth_session_id',sourceSession).maybeSingle();
  if(nested)return reply(403,{error:'Exit the current impersonation session first'});
  const {data:person}=await admin.from('profiles').select('id,display_name,is_active,is_full_time,placement_start,placement_end').eq('id',input.target).single();
  if(!person||!accessAllowed(JSON.stringify(person)))return reply(403,{error:'This person does not have active workspace access'});
  const {data:account,error:accountError}=await admin.auth.admin.getUserById(person.id);
  if(accountError||!account.user?.email||!account.user.email_confirmed_at)return reply(400,{error:'A confirmed email account is required'});
  const {data:link,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email:account.user.email});
  if(linkError||!link.properties?.hashed_token)return reply(400,{error:'Could not create an impersonation session'});
  const verifier=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,opts);
  const {data:signed,error:signError}=await verifier.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'email'});
  const session=signed.session;
  if(signError||!session||signed.user?.id!==person.id)return reply(400,{error:'Could not sign in to the selected workspace'});
  const sessionId=claims(session.access_token).session_id;
  const {data:audit,error:auditError}=await admin.from('admin_act_as_sessions').insert({auth_session_id:sessionId,actor_id:actor.id,target_id:person.id,actor_name:actor.display_name,target_name:person.display_name}).select('id,expires_at').single();
  if(auditError){await admin.auth.admin.signOut(session.access_token,'local');return reply(500,{error:'Could not record the impersonation audit. No access was opened.'});}
  return reply(200,{id:audit.id,expires_at:audit.expires_at,target_name:person.display_name,session:{access_token:session.access_token,refresh_token:session.refresh_token}});
 }catch{ return reply(500,{error:'Could not complete the admin session request. Please try again.'}); }
});
