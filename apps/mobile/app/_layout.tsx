import React,{Suspense} from 'react';
import {Stack} from 'expo-router';
import {SQLiteProvider} from 'expo-sqlite';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from '../src/features/auth/session.tsx';
import {ProfileProvider} from '../src/local/profile.tsx';
import {Page,Copy,colors} from '../src/ui/components.tsx';
export default function Root(){return <SafeAreaProvider><AuthProvider><Suspense fallback={<Page title="Opening your planner"><Copy>Loading saved goals…</Copy></Page>}><SQLiteProvider databaseName="movement-planner.db" useSuspense onInit={async db=>{await db.execAsync('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS profile_drafts(owner TEXT PRIMARY KEY,value TEXT NOT NULL);');}}><ProfileProvider><Stack screenOptions={{headerStyle:{backgroundColor:colors.background},headerTintColor:colors.ink}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="onboarding" options={{title:'Your goals'}}/><Stack.Screen name="sign-in" options={{title:'Sign in'}}/></Stack></ProfileProvider></SQLiteProvider></Suspense></AuthProvider></SafeAreaProvider>;}
