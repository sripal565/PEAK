import type {ProfileInput} from './profile.ts';
import type {CatalogRevision} from './catalog.ts';
export type PlannedSession={weekday:number;period:'morning'|'evening';exerciseRevisionId:string;goalIds:string[];durationSeconds:number};
export type ConstraintViolation={code:string;exerciseRevisionId?:string;goalId?:string;sessionIndex?:number};
export type PlanDraft={sessions:PlannedSession[];activeGoals:string[];deferredGoals:string[];reasons:ConstraintViolation[]};
export type PlannerInput={profile:ProfileInput;catalog:unknown[];startingSessionCap:number};
