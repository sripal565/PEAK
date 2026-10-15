import { z } from 'zod';
const identifier = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
export const goalSchema = z.strictObject({id:identifier,name:z.string().trim().min(1).max(200),priority:z.number().int().min(0).max(30)});
export const windowSchema = z.strictObject({weekday:z.number().int().min(0).max(6),period:z.enum(['morning','evening']),minutes:z.number().int().min(1).max(120)});
export const commitmentSchema = z.strictObject({id:identifier,name:z.string().trim().min(1).max(200),weekday:z.number().int().min(0).max(6),period:z.enum(['morning','evening','other']),minutes:z.number().int().min(1).max(1440),load:z.record(z.string(),z.number().nonnegative()).optional()});
export const profileSchema = z.strictObject({
 goals:z.array(goalSchema).max(30), equipment:z.array(z.string().trim().min(1).max(100)).max(50),
 restrictions:z.array(z.string().trim().min(1).max(300)).max(50), availability:z.array(windowSchema).max(14),
 commitments:z.array(commitmentSchema).max(30), timezone:z.string().refine(value => {try {new Intl.DateTimeFormat('en',{timeZone:value});return true;} catch {return false;}},'Choose a valid timezone'),
 startCue:z.string().trim().max(200),
}).superRefine((p,ctx) => {
 for (const [key,values] of [['goals',p.goals.map(g=>g.id)],['availability',p.availability.map(w=>`${w.weekday}:${w.period}`)],['commitments',p.commitments.map(c=>c.id)]] as const) {
  if(new Set(values).size !== values.length)ctx.addIssue({code:'custom',path:[key],message:'Duplicate entries are not allowed'});
 }
 if(new Set(p.goals.map(g=>g.priority)).size!==p.goals.length)ctx.addIssue({code:'custom',path:['goals'],message:'Give each goal a distinct priority'});
});
export const profileUpdateSchema = z.strictObject({input:profileSchema,expectedRevision:z.number().int().nonnegative()});
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileRecord = {userId:string;input:ProfileInput;inputRevision:number};
