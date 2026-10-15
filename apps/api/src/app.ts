import Fastify from 'fastify';
import { profileUpdateSchema } from '../../../packages/contracts/src/profile.ts';
import type { ProfileStore } from './features/profile/repository.ts';
export type AppOptions = {founderId:string;authenticate:(token:string)=>Promise<string|null>;profiles:ProfileStore};
export function buildApp(options:AppOptions) {
 const app=Fastify({logger:false,bodyLimit:64*1024});
 app.get('/health',async()=>({status:'ok'}));
 app.register(async privateApi => {
  privateApi.addHook('preHandler',async(request,reply)=>{
   const authorization=request.headers.authorization;
   if(!authorization?.startsWith('Bearer ')||authorization.length>8192)return reply.code(401).send({code:'unauthenticated'});
   let userId:string|null;
   try {userId=await options.authenticate(authorization.slice(7));}catch {return reply.code(503).send({code:'auth_unavailable'});}
   if(!userId)return reply.code(401).send({code:'unauthenticated'});
   if(userId!==options.founderId)return reply.code(403).send({code:'private_pilot'});
  });
  privateApi.get('/v1/profile',async()=>({profile:await options.profiles.get(options.founderId)}));
  privateApi.put('/v1/profile',async(request,reply)=>{
   const parsed=profileUpdateSchema.safeParse(request.body);
   if(!parsed.success)return reply.code(422).send({code:'invalid_profile',issues:parsed.error.issues.map(i=>({path:i.path,message:i.message}))});
   const result=await options.profiles.save(options.founderId,parsed.data.input,parsed.data.expectedRevision);
   return result ?? reply.code(409).send({code:'stale_profile'});
  });
 });
 app.setErrorHandler((error,_request,reply)=>{
  if(typeof error==='object' && error!==null && 'statusCode' in error && error.statusCode===400)return reply.code(400).send({code:'invalid_request'});
  if(typeof error==='object' && error!==null && 'statusCode' in error && error.statusCode===413)return reply.code(413).send({code:'request_too_large'});
  reply.code(500).send({code:'request_failed'});
 });
 return app;
}
