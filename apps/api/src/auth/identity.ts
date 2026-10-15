import { z } from 'zod';
const identitySchema=z.object({id:z.uuid()});
export function supabaseIdentity(url:string,publicKey:string,fetcher:typeof fetch=fetch) {
 const base=new URL(url); if(base.protocol!=='https:')throw new Error('Supabase must use HTTPS');
 return async (token:string):Promise<string|null> => {
  const response=await fetcher(new URL('/auth/v1/user',base),{headers:{apikey:publicKey,authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
  if(response.status===401||response.status===403)return null;
  if(!response.ok)throw new Error('Authentication unavailable');
  return identitySchema.parse(await response.json()).id;
 };
}
