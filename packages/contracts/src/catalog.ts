import {z} from 'zod';
const quantity=z.number().finite().nonnegative();
export const catalogRevisionSchema=z.strictObject({
 id:z.string().min(1),revisionId:z.string().min(1),title:z.string().min(1),approval:z.literal('curated'),approvedBy:z.string().min(1),
 sourceUrls:z.array(z.url().refine(s=>s.startsWith('https://'))).min(1),limitations:z.string().min(1),
 instructions:z.array(z.string().trim().min(1)).min(1),demonstration:z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('none')}),z.strictObject({kind:z.literal('link'),url:z.url(),provenance:z.string().min(1)})]),
 goalIds:z.array(z.string().min(1)).min(1),equipment:z.array(z.string()),restrictionTags:z.array(z.string()),prerequisiteGoalIds:z.array(z.string()),
 duration:z.strictObject({setup:quantity,work:quantity.positive(),rest:quantity,transition:quantity}),
 programming:z.strictObject({minSessionsPerWeek:z.number().int().min(1).max(14),maxSessionsPerWeek:z.number().int().min(1).max(14),minGapDays:z.number().int().min(0).max(6),demand:z.record(z.string(),quantity),weeklyDemandLimits:z.record(z.string(),quantity)}),
}).superRefine((v,ctx)=>{
 if(v.programming.minSessionsPerWeek>v.programming.maxSessionsPerWeek)ctx.addIssue({code:'custom',message:'Minimum exceeds maximum'});
 for(const [tag,demand] of Object.entries(v.programming.demand))if(v.programming.weeklyDemandLimits[tag]===undefined || demand>v.programming.weeklyDemandLimits[tag])ctx.addIssue({code:'custom',message:'Every demand needs a usable weekly limit'});
});
export type CatalogRevision=z.infer<typeof catalogRevisionSchema>;
export function isSchedulable(value:unknown):value is CatalogRevision{return catalogRevisionSchema.safeParse(value).success;}
