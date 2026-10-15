import {isSchedulable,type CatalogRevision} from '../../../contracts/src/catalog.ts';
import {profileSchema} from '../../../contracts/src/profile.ts';
import type {PlannerInput,PlanDraft,PlannedSession,ConstraintViolation} from '../../../contracts/src/plan.ts';
import {checkSessions,durationSeconds} from './validatePlan.ts';
export {validatePlan} from './validatePlan.ts';
export function buildPlan(input:PlannerInput):PlanDraft {
 const profile=profileSchema.parse(input.profile);
 if(!Number.isInteger(input.startingSessionCap)||input.startingSessionCap<0)throw new Error('Invalid session cap');
 const goals=[...profile.goals].sort((a,b)=>a.priority-b.priority);
 let sessions:PlannedSession[]=[];const reasons:ConstraintViolation[]=[];
 const candidates:CatalogRevision[]=[];
 for(const raw of input.catalog){if(isSchedulable(raw))candidates.push(raw);else reasons.push({code:'catalog_ineligible'});}
 const eligibility=checkSessions(input,[],false);
 if(eligibility.length)return {sessions:[],activeGoals:[],deferredGoals:goals.map(g=>g.id),reasons:[...reasons,...eligibility]};
 function place(entry:CatalogRevision,count:number):PlannedSession[]|null {
  let draft=[...sessions];
  for(let n=0;n<count;n++){
   // Balance morning/evening use, then prefer less occupied days with stable weekday tie-breaking.
   const periodCounts={morning:draft.filter(s=>s.period==='morning').length,evening:draft.filter(s=>s.period==='evening').length};
   const windows=[...profile.availability].sort((a,b)=>(draft.filter(s=>s.weekday===a.weekday).length-draft.filter(s=>s.weekday===b.weekday).length)||(periodCounts[a.period]-periodCounts[b.period])||(a.weekday-b.weekday)||a.period.localeCompare(b.period));
   let placed=false;
   for(const window of windows){
    const next:PlannedSession={weekday:window.weekday,period:window.period,exerciseRevisionId:entry.revisionId,goalIds:goals.filter(g=>entry.goalIds.includes(g.id)).map(g=>g.id),durationSeconds:durationSeconds(entry)};
    const errors=checkSessions(input,[...draft,next],false);
    if(errors.length===0){draft.push(next);placed=true;break;}
    for(const error of errors)if(!reasons.some(r=>r.code===error.code&&r.exerciseRevisionId===error.exerciseRevisionId))reasons.push(error);
   }
   if(!placed)return null;
  }
  return draft;
 }
 // Allocate minimum valid practice for each prioritized goal before filling spare capacity.
 for(const goal of goals){
  if(sessions.some(s=>s.goalIds.includes(goal.id)))continue;
  for(const entry of candidates.filter(e=>e.goalIds.includes(goal.id))){
   const result=place(entry,entry.programming.minSessionsPerWeek);
   if(result){sessions=result;reasons.push({code:'priority_allocation',goalId:goal.id,exerciseRevisionId:entry.revisionId});break;}
  }
 }
 let changed=true;
 while(changed){changed=false;for(const goal of goals){
  const selected=sessions.find(s=>s.goalIds.includes(goal.id));if(!selected)continue;
  const entry=candidates.find(e=>e.revisionId===selected.exerciseRevisionId)!;
  const next=place(entry,1);if(next){sessions=next;changed=true;}
 }}
 const activeGoals=goals.filter(g=>sessions.some(s=>s.goalIds.includes(g.id))).map(g=>g.id);
 const deferredGoals=goals.filter(g=>!activeGoals.includes(g.id)).map(g=>g.id);
 for(const goalId of deferredGoals)reasons.push({code:candidates.some(e=>e.goalIds.includes(goalId))?'goal_deferred':'catalog_coverage_missing',goalId});
 return {sessions,activeGoals,deferredGoals,reasons};
}
