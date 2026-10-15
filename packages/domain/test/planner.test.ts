import {it,expect} from 'vitest';
import type {ProfileInput} from '../../contracts/src/profile.ts';
import type {PlannerInput} from '../../contracts/src/plan.ts';
import {buildPlan,validatePlan} from '../src/planner/buildPlan.ts';
const exercise = (patch={}) => ({
 id:'sample',revisionId:'sample-v1',title:'Synthetic test movement',approval:'curated',approvedBy:'test-founder',
 instructions:['Synthetic step for software testing only'],demonstration:{kind:'none'},sourceUrls:['https://example.org/synthetic'],limitations:'Synthetic record: never production guidance',
 goalIds:['goata'],equipment:['mat'],restrictionTags:['discomfort'],prerequisiteGoalIds:[],
 duration:{setup:60,work:240,rest:120,transition:60},
 programming:{minSessionsPerWeek:1,maxSessionsPerWeek:4,minGapDays:1,demand:{ankle:1},weeklyDemandLimits:{ankle:4}},
 ...patch,
});
const profile = (patch:Partial<ProfileInput>={}):ProfileInput=>({goals:[{id:'goata',name:'GOATA',priority:0},{id:'posture',name:'Posture',priority:1},{id:'release',name:'Release',priority:2},{id:'planche',name:'Planche',priority:3}],equipment:['mat'],restrictions:[],availability:[1,2,3,4,5].flatMap(weekday=>[{weekday,period:'morning',minutes:10},{weekday,period:'evening',minutes:10}]),commitments:[],timezone:'America/Chicago',startCue:'After breakfast',...patch});
const input=(patch:Partial<PlannerInput>={}):PlannerInput=>({profile:profile(),catalog:[exercise(),exercise({id:'posture',revisionId:'posture-v1',goalIds:['posture'],programming:{minSessionsPerWeek:1,maxSessionsPerWeek:2,minGapDays:1,demand:{posture:1},weeklyDemandLimits:{posture:2}}})],startingSessionCap:4,...patch});
it('allocates within four ten-minute windows including setup, rest and transitions',()=>{
 const plan=buildPlan(input()); expect(plan.sessions).toHaveLength(4);
 expect(plan.sessions.map((s:any)=>s.durationSeconds)).toEqual([480,480,480,480]);
 expect(plan.activeGoals).toEqual(['goata','posture']); expect(plan.deferredGoals).toContain('planche');
 expect(validatePlan(input(),plan)).toEqual([]);
});
it('defers unsupported and equipment-missing goals with reasons',()=>{
 const plan=buildPlan(input({profile:profile({equipment:[]})}));
 expect(plan.sessions).toEqual([]); expect(plan.deferredGoals).toContain('goata'); expect(plan.reasons.some((r:any)=>r.code==='equipment_missing')).toBe(true);
});
it('cannot schedule unapproved or missing-bound records',()=>{
 const plan=buildPlan(input({catalog:[exercise({approval:'candidate'}),exercise({programming:undefined})]}));
 expect(plan.sessions).toEqual([]); expect(plan.reasons.some((r:any)=>r.code==='catalog_ineligible')).toBe(true);
});
it('respects restriction tags and demands clarification of unknown restrictions',()=>{
 expect(buildPlan(input({profile:profile({restrictions:['discomfort']})})).sessions).toEqual([]);
 const plan=buildPlan(input({profile:profile({restrictions:['uninterpreted pain statement']})}));
 expect(plan.sessions).toEqual([]);expect(plan.reasons.some((r:any)=>r.code==='restriction_unresolved')).toBe(true);
});
it('counts a supported shared activity once while covering both goals',()=>{
 const plan=buildPlan(input({startingSessionCap:1,catalog:[exercise({goalIds:['goata','posture']})]}));
 expect(plan.sessions).toHaveLength(1);expect(plan.sessions[0].goalIds).toEqual(['goata','posture']);expect(plan.sessions[0].durationSeconds).toBe(480);
});
it('honors explicit priority changes when only one session fits',()=>{
 const plan=buildPlan(input({startingSessionCap:1,profile:profile({goals:[{id:'posture',name:'Posture',priority:0},{id:'goata',name:'GOATA',priority:1}]})}));
 expect(plan.sessions[0].goalIds).toEqual(['posture']);
});
it('does not fill a week with fewer than catalog minimum sessions',()=>{
 const plan=buildPlan(input({startingSessionCap:1,catalog:[exercise({programming:{minSessionsPerWeek:2,maxSessionsPerWeek:3,minGapDays:1,demand:{},weeklyDemandLimits:{}}})]}));
 expect(plan.sessions).toEqual([]);expect(plan.deferredGoals).toContain('goata');
});
it('validates catalog demand across existing gym commitments',()=>{
 const p=profile({commitments:[{id:'gym',name:'Gym',weekday:0,period:'other',minutes:60,load:{ankle:3}}]});
 const plan=buildPlan(input({profile:p,catalog:[exercise()]}));expect(plan.sessions).toHaveLength(1);
});
it('exposes unknown gym demand instead of assuming overlap is safe',()=>{
 const plan=buildPlan(input({profile:profile({commitments:[{id:'gym',name:'Gym',weekday:0,period:'other',minutes:60}]}),catalog:[exercise()]}));
 expect(plan.sessions).toEqual([]);expect(plan.reasons.some((r:any)=>r.code==='commitment_load_unknown')).toBe(true);
});
it('rejects tampered duration and revision even if proposed by a model',()=>{
 const args=input();const draft=buildPlan(args);
 const tampered={...draft,sessions:[{weekday:1,period:'morning' as const,exerciseRevisionId:'missing',goalIds:['goata'],durationSeconds:1}]};
 expect(validatePlan(args,tampered).some((r:any)=>r.code==='unknown_revision')).toBe(true);
 const tooShort={...draft,sessions:draft.sessions.map((s:any)=>({...s,durationSeconds:1}))};
 expect(validatePlan(args,tooShort).some((r:any)=>r.code==='duration_mismatch')).toBe(true);
});
it('handles no available capacity without manufacturing a plan',()=>{
 const plan=buildPlan(input({profile:profile({availability:[]})}));expect(plan.sessions).toEqual([]);expect(plan.deferredGoals).toEqual(['goata','posture','release','planche']);
});

it('requires usable instructions and explicit demonstration provenance',()=>{
 const plan=buildPlan(input({catalog:[exercise({instructions:[],demonstration:undefined})]}));
 expect(plan.sessions).toEqual([]);expect(plan.reasons.some(r=>r.code==='catalog_ineligible')).toBe(true);
});
it('rejects conflicting duplicate catalog revisions',()=>{
 const plan=buildPlan(input({catalog:[exercise(),exercise({duration:{setup:0,work:10,rest:0,transition:0}})]}));
 expect(plan.sessions).toEqual([]);expect(plan.reasons.some(r=>r.code==='catalog_revision_conflict')).toBe(true);
});
