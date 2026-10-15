import type { Pool } from 'pg';
import { profileSchema, type ProfileInput, type ProfileRecord } from '../../../../../packages/contracts/src/profile.ts';
export interface ProfileStore {
 get(userId:string):Promise<ProfileRecord|null>;
 save(userId:string,input:ProfileInput,expectedRevision:number):Promise<ProfileRecord|null>;
}
export function postgresProfiles(pool:Pool):ProfileStore {
 const decode = (row:any):ProfileRecord => ({userId:row.user_id,input:profileSchema.parse(row.input),inputRevision:row.input_revision});
 return {
  async get(userId) {const result=await pool.query('SELECT user_id,input,input_revision FROM public.profiles WHERE user_id=$1',[userId]); return result.rows[0]?decode(result.rows[0]):null;},
  async save(userId,input,expectedRevision) {
   const result = await pool.query(`INSERT INTO public.profiles (user_id,input,input_revision)
    SELECT $1,$2::jsonb,1 WHERE $3::integer=0
    ON CONFLICT (user_id) DO UPDATE SET input=$2::jsonb,input_revision=profiles.input_revision+1,updated_at=now()
    WHERE profiles.input_revision=$3::integer
    RETURNING user_id,input,input_revision`,[userId,JSON.stringify(input),expectedRevision]);
   if(result.rows[0])return decode(result.rows[0]);
   // An existing row with revision >0 requires UPDATE rather than insert-select.
   if(expectedRevision===0)return null;
   const update=await pool.query(`UPDATE public.profiles SET input=$2::jsonb,input_revision=input_revision+1,updated_at=now()
     WHERE user_id=$1 AND input_revision=$3 RETURNING user_id,input,input_revision`,[userId,JSON.stringify(input),expectedRevision]);
   return update.rows[0]?decode(update.rows[0]):null;
  },
 };
}
