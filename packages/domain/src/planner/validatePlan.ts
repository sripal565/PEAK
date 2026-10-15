import {isSchedulable,type CatalogRevision} from '../../../contracts/src/catalog.ts';
import type {PlannerInput,PlanDraft,PlannedSession,ConstraintViolation} from '../../../contracts/src/plan.ts';
export const durationSeconds=(entry:CatalogRevision)=>Object.values(entry.duration).reduce((sum,value)=>sum+value,0);
export function checkSessions(input:PlannerInput,sessions:PlannedSession[],checkMinimum=true):ConstraintViolation[]{
 const errors:ConstraintViolation[]=[];
 const catalog=input.catalog.filter(isSchedulable);
 if(new Set(catalog.map(e=>e.revisionId)).size!==catalog.length||new Set(catalog.map(e=>e.id)).size!==catalog.length)errors.push({code:'catalog_revision_conflict'});
 const cap=Math.max(0,Math.min(4,Math.floor(input.startingSessionCap)));
 if(sessions.length>cap)errors.push({code:'session_cap'});
 if(sessions.reduce((sum,s)=>sum+s.durationSeconds,0)>2400)errors.push({code:'weekly_time_budget'});
 const knownTags=new Set(catalog.flatMap(e=>e.restrictionTags));
 if(input.profile.restrictions.some(r=>!knownTags.has(r)&&!r.startsWith('exercise:')))errors.push({code:'restriction_unresolved'});
 const usedWindows=new Set<string>();
 const demands:Record<string,number>={}; const limits:Record<string,number>={};
 for(const commitment of input.profile.commitments)for(const [tag,demand] of Object.entries(commitment.load??{}))demands[tag]=(demands[tag]??0)+demand;
 const grouped=new Map<string,number[]>();
 sessions.forEach((session,index)=>{
  const error=(code:string)=>errors.push({code,sessionIndex:index,exerciseRevisionId:session.exerciseRevisionId});
  const entry=catalog.find(e=>e.revisionId===session.exerciseRevisionId);
  if(!entry){error('unknown_revision');return;}
  const window=input.profile.availability.find(w=>w.weekday===session.weekday&&w.period===session.period);
  if(!window||session.durationSeconds>Math.min(600,window.minutes*60))error('outside_availability');
  const key=`${session.weekday}:${session.period}`;
  if(usedWindows.has(key))error('window_overbooked'); usedWindows.add(key);
  if(input.profile.commitments.some(c=>c.weekday===session.weekday&&c.period===session.period))error('commitment_conflict');
  if(session.durationSeconds!==durationSeconds(entry))error('duration_mismatch');
  if(entry.equipment.some(e=>!input.profile.equipment.includes(e)))error('equipment_missing');
  if(entry.restrictionTags.some(t=>input.profile.restrictions.includes(t))||input.profile.restrictions.includes(`exercise:${entry.id}`))error('restricted');
  if(entry.prerequisiteGoalIds.length)error('prerequisites_unconfirmed');
  if(session.goalIds.length===0||session.goalIds.some(id=>!entry.goalIds.includes(id)||!input.profile.goals.some(g=>g.id===id)))error('unsupported_goal');
  if(Object.keys(entry.programming.demand).length && input.profile.commitments.some(c=>c.load===undefined))error('commitment_load_unknown');
  const days=grouped.get(entry.revisionId)??[];days.push(session.weekday);grouped.set(entry.revisionId,days);
  for(const [tag,demand] of Object.entries(entry.programming.demand)){
   demands[tag]=(demands[tag]??0)+demand;
   limits[tag]=Math.min(limits[tag]??Infinity,entry.programming.weeklyDemandLimits[tag]);
  }
 });
 for(const [tag,limit] of Object.entries(limits))if(demands[tag]>limit)errors.push({code:'weekly_demand_limit'});
 for(const [revisionId,days] of grouped){
  const entry=catalog.find(e=>e.revisionId===revisionId)!;
  if(days.length>entry.programming.maxSessionsPerWeek)errors.push({code:'frequency_max',exerciseRevisionId:revisionId});
  if(checkMinimum && days.length<entry.programming.minSessionsPerWeek)errors.push({code:'frequency_min',exerciseRevisionId:revisionId});
  for(let i=0;i<days.length;i++)for(let j=i+1;j<days.length;j++){
   const gap=Math.min(Math.abs(days[i]-days[j]),7-Math.abs(days[i]-days[j]));
   if(gap<entry.programming.minGapDays)errors.push({code:'recovery_gap',exerciseRevisionId:revisionId});
  }
 }
 return errors;
}
export function validatePlan(input:PlannerInput,draft:PlanDraft):ConstraintViolation[]{
 const errors=checkSessions(input,draft.sessions);
 const covered=new Set(draft.sessions.flatMap(s=>s.goalIds));
 const active=input.profile.goals.filter(g=>covered.has(g.id)).map(g=>g.id);
 if(active.length!==draft.activeGoals.length||active.some(g=>!draft.activeGoals.includes(g)))errors.push({code:'active_goal_mismatch'});
 return errors;
}
