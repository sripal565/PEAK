import React,{createContext,useContext,useEffect,useState} from 'react';
import {useSQLiteContext} from 'expo-sqlite';
import {profileSchema,type ProfileInput} from '../../../../packages/contracts/src/profile.ts';
import {draftStore} from './drafts.ts';
import {useAuth} from '../features/auth/session.tsx';
const initial:ProfileInput={goals:[],equipment:[],restrictions:[],availability:[],commitments:[],timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,startCue:''};
const Context=createContext<{profile:ProfileInput;ready:boolean;error:string|null;save:(value:ProfileInput)=>Promise<void>;clear:()=>Promise<void>}|null>(null);
export function ProfileProvider({children}:{children:React.ReactNode}){
 const db=useSQLiteContext();const {session,ready:authReady}=useAuth();const owner=session?.user.id??'device-draft';
 const [state,setState]=useState<{owner:string;profile:ProfileInput;ready:boolean;error:string|null}>({owner,profile:initial,ready:false,error:null});
 useEffect(()=>{if(!authReady)return;let alive=true;setState({owner,profile:initial,ready:false,error:null});draftStore(db).get(owner).then(value=>{const parsed=profileSchema.safeParse(value);if(alive)setState({owner,profile:parsed.success?parsed.data:initial,ready:true,error:value!==null&&!parsed.success?'Your saved draft could not be read. Please re-enter your goals.':null});}).catch(()=>{if(alive)setState({owner,profile:initial,ready:true,error:'We could not read your saved goals.'});});return()=>{alive=false;};},[owner,authReady,db]);
 async function save(value:ProfileInput){const parsed=profileSchema.parse(value);await draftStore(db).save(owner,parsed);setState({owner,profile:parsed,ready:true,error:null});}
 async function clear(){await draftStore(db).clear(owner);setState({owner,profile:initial,ready:true,error:null});}
 return <Context.Provider value={{profile:state.owner===owner?state.profile:initial,ready:authReady&&state.owner===owner&&state.ready,error:state.owner===owner?state.error:null,save,clear}}>{children}</Context.Provider>;
}
export function useProfile(){const value=useContext(Context);if(!value)throw new Error('ProfileProvider required');return value;}
