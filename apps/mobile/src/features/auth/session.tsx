import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {createClient,type Session} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:{getItem:SecureStore.getItemAsync,setItem:SecureStore.setItemAsync,removeItem:SecureStore.deleteItemAsync}}}):null;
type Auth={session:Session|null;ready:boolean;client:typeof client;error:string|null;signOut:()=>Promise<void>};
const Context=createContext<Auth|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session|null>(null);const [ready,setReady]=useState(!client);const [error,setError]=useState<string|null>(null);
 const queries=useMemo(()=>new QueryClient({defaultOptions:{queries:{retry:1}}}),[]);
 useEffect(()=>{
  if(!client)return;let alive=true;
  client.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);setReady(true);if(error)setError('We could not restore your sign-in. Please sign in again.');}}).catch(()=>{if(alive){setError('We could not restore your sign-in.');setReady(true);}});
  const {data}=client.auth.onAuthStateChange((_event,next)=>{queries.clear();if(alive)setSession(next);});
  return()=>{alive=false;data.subscription.unsubscribe();};
 },[queries]);
 async function signOut(){if(!client)return;const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;queries.clear();setSession(null);}
 return <QueryClientProvider client={queries}><Context.Provider value={{session,ready,client,error,signOut}}>{children}</Context.Provider></QueryClientProvider>;
}
export function useAuth(){const value=useContext(Context);if(!value)throw new Error('AuthProvider required');return value;}
