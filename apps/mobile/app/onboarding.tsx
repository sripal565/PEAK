import {useState} from 'react';
import {View,Pressable,Text} from 'react-native';
import {router} from 'expo-router';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useProfile} from '../src/local/profile.tsx';
import {useAuth} from '../src/features/auth/session.tsx';
import {profileSchema,type ProfileInput} from '../../../packages/contracts/src/profile.ts';
import {Page,Card,Copy,Field,Button,colors} from '../src/ui/components.tsx';
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const defaultNames=['GOATA / ankle stability','Posture','Release work','Planche'];
function Choice({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}){return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:selected}} onPress={onPress} style={{padding:12,minHeight:48,borderWidth:1,borderRadius:12,borderColor:colors.line,backgroundColor:selected?colors.accent:'white'}}><Text style={{color:selected?'white':colors.ink}}>{selected?'✓ ':''}{label}</Text></Pressable>;}
function Form(){
 const {profile,save}=useProfile();const auth=useAuth();const queries=useQueryClient();
 const [baseProfile,setBaseProfile]=useState(profile);
 const [names,setNames]=useState((profile.goals.length?profile.goals.map(g=>g.name):defaultNames).join('\n'));
 const [equipment,setEquipment]=useState(profile.equipment.join(', '));const [restrictions,setRestrictions]=useState(profile.restrictions.join('\n'));const [cue,setCue]=useState(profile.startCue);
 const [windows,setWindows]=useState<ProfileInput['availability']>(profile.goals.length?profile.availability:[1,2,3,4,5].flatMap(weekday=>[{weekday,period:'morning' as const,minutes:10},{weekday,period:'evening' as const,minutes:10}]));
 const [commitments,setCommitments]=useState(profile.commitments);const [commitmentName,setCommitmentName]=useState('');const [commitmentDay,setCommitmentDay]=useState(1);const [commitmentMinutes,setCommitmentMinutes]=useState('60');
 const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 const api=process.env.EXPO_PUBLIC_API_URL;
 const key=['profile',auth.session?.user.id];
 const remote=useQuery({queryKey:key,enabled:!!auth.session&&!!api,queryFn:async()=>{
  const response=await fetch(`${api?.replace(/\/$/,'')}/v1/profile`,{headers:{authorization:`Bearer ${auth.session?.access_token}`},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Profile unavailable');return await response.json() as {profile:{input:ProfileInput;inputRevision:number}|null};
 }});
 function toggle(weekday:number,period:'morning'|'evening') {setWindows(current=>current.some(w=>w.weekday===weekday&&w.period===period)?current.filter(w=>!(w.weekday===weekday&&w.period===period)):[...current,{weekday,period,minutes:10}]);}
 function addCommitment(){const minutes=Number(commitmentMinutes);if(!commitmentName.trim()||!Number.isInteger(minutes)||minutes<1||minutes>1440){setError('Enter a commitment name and duration from 1 to 1440 minutes.');return;}setCommitments(current=>[...current,{id:`commitment-${Date.now()}`,name:commitmentName.trim(),weekday:commitmentDay,period:'other',minutes}]);setCommitmentName('');setError(null);}
 async function submit(){setBusy(true);setError(null);try{
  const labels=names.split('\n').map(s=>s.trim()).filter(Boolean);
  const goals=labels.map((name,index)=>({id:baseProfile.goals.find(g=>g.name===name)?.id??['goata','posture','release','planche'][defaultNames.indexOf(name)]??`goal-${index}`,name,priority:index}));
  const parsed=profileSchema.safeParse({...baseProfile,goals,equipment:equipment.split(',').map(s=>s.trim()).filter(Boolean),restrictions:restrictions.split('\n').map(s=>s.trim()).filter(Boolean),availability:windows,commitments,startCue:cue});
  if(!parsed.success){setError(parsed.error.issues[0]?.message??'Please check your inputs.');return;}
  await save(parsed.data);
  if(auth.session&&api){
   if(remote.isError||remote.isFetching){setError('Draft saved on this device. Wait for your account data to load before syncing.');return;}
   const response=await fetch(`${api.replace(/\/$/,'')}/v1/profile`,{method:'PUT',headers:{authorization:`Bearer ${auth.session.access_token}`,'content-type':'application/json'},body:JSON.stringify({input:parsed.data,expectedRevision:remote.data?.profile?.inputRevision??0}),signal:AbortSignal.timeout(8000)});
   if(response.status===409){setError('Draft saved. Your account goals changed elsewhere. Reload your account data, then review before saving again.');await queries.invalidateQueries({queryKey:key});return;}
   if(!response.ok){setError('Draft saved on this device. We could not sync it; please try again.');return;}
   await queries.invalidateQueries({queryKey:key});
  }
  router.back();
 }catch{setError('We could not finish saving. Please try again; any saved draft remains on this device.');}finally{setBusy(false);}}
 return <Page title="What matters to you?" subtitle="Start with your priorities. You can change them later."><Card title="Goals, in priority order"><Field label="One goal per line" multiline value={names} onChangeText={setNames}/><Copy>Methods and outcomes can be clarified before activities are added.</Copy><Field label="Equipment available (separate with commas)" value={equipment} onChangeText={setEquipment}/><Field label="Movements or discomfort to account for (optional)" multiline value={restrictions} onChangeText={setRestrictions}/></Card><Card title="Ten-minute windows"><Copy>Choose available windows. The starting plan uses only four sessions.</Copy>{days.map((day,weekday)=><View key={day} style={{gap:8}}><Copy>{day}</Copy><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(['morning','evening'] as const).map(period=><Choice key={period} label={`${day} ${period}`} selected={windows.some(w=>w.weekday===weekday&&w.period===period)} onPress={()=>toggle(weekday,period)}/>)}</View></View>)}</Card><Card title="Gym and sports commitments">{commitments.map(c=><View key={c.id}><Copy>{days[c.weekday]} · {c.name} · {c.minutes} minutes</Copy><Button secondary label={`Remove ${c.name}`} onPress={()=>setCommitments(current=>current.filter(item=>item.id!==c.id))}/></View>)}<Field label="Commitment name" value={commitmentName} onChangeText={setCommitmentName}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{days.map((day,weekday)=><Choice key={day} label={day} selected={commitmentDay===weekday} onPress={()=>setCommitmentDay(weekday)}/>)}</View><Field label="Duration in minutes" value={commitmentMinutes} onChangeText={setCommitmentMinutes} keyboardType="number-pad"/><Button secondary label="Add commitment" onPress={addCommitment}/><Copy>Training overlap will need clarification before related work is scheduled.</Copy></Card><Card title="A start cue"><Field label="For example, after breakfast" value={cue} onChangeText={setCue}/></Card>{auth.session&&remote.data?.profile?<Card title="Account goals are available"><Copy>Load your account goals to review them before making edits.</Copy><Button secondary label="Load account goals" onPress={()=>{const parsed=profileSchema.safeParse(remote.data?.profile?.input);if(!parsed.success){setError('Your account data could not be read.');return;}const saved=parsed.data;setBaseProfile(saved);setNames(saved.goals.map(g=>g.name).join('\n'));setEquipment(saved.equipment.join(', '));setRestrictions(saved.restrictions.join('\n'));setWindows(saved.availability);setCommitments(saved.commitments);setCue(saved.startCue);}}/></Card>:null}{error?<Copy error>{error}</Copy>:null}<Button label={busy?'Saving…':auth.session&&api?'Save and sync goals':'Save draft on this device'} disabled={busy} onPress={()=>void submit()}/></Page>;
}
export default function Onboarding(){const {ready}=useProfile();const {session}=useAuth();return ready?<Form key={session?.user.id??'device-draft'}/>:<Page title="Your goals"><Copy>Loading saved draft…</Copy></Page>;}
