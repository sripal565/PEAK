import {it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {draftStore} from '../src/local/drafts.ts';
function setup(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE profile_drafts(owner TEXT PRIMARY KEY, value TEXT NOT NULL)');return {db,store:draftStore({async runAsync(sql,...params){return db.prepare(sql).run(...params);},async getFirstAsync<T>(sql,...params){return (db.prepare(sql).get(...params)??null) as T|null;}})};}
it('persists drafts across store instances without leaking between accounts',async()=>{
 const {db,store}=setup();await store.save('founder',{goals:['goata']});expect(await store.get('founder')).toEqual({goals:['goata']});expect(await store.get('other')).toBeNull();db.close();
});
it('clears only the signed-out account draft',async()=>{
 const {db,store}=setup();await store.save('founder',{goals:['goata']});await store.save('other',{goals:['posture']});await store.clear('founder');expect(await store.get('founder')).toBeNull();expect(await store.get('other')).toEqual({goals:['posture']});db.close();
});
it('keeps the previous value if serializing a draft fails',async()=>{
 const {db,store}=setup();await store.save('founder',{goals:['goata']});const circular:any={};circular.self=circular;await expect(store.save('founder',circular)).rejects.toThrow();expect(await store.get('founder')).toEqual({goals:['goata']});db.close();
});
