export interface DraftDatabase {
 runAsync(sql:string,...params:(string|number|null)[]):Promise<unknown>;
 getFirstAsync<T>(sql:string,...params:(string|number|null)[]):Promise<T|null>;
}
export function draftStore(db:DraftDatabase){return {
 async save(owner:string,value:unknown){
  const encoded=JSON.stringify(value);if(encoded===undefined)throw new Error('Draft must be JSON');
  await db.runAsync('INSERT INTO profile_drafts(owner,value) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET value=excluded.value',owner,encoded);
 },
 async get(owner:string):Promise<unknown|null>{const row=await db.getFirstAsync<{value:string}>('SELECT value FROM profile_drafts WHERE owner=?',owner);return row?JSON.parse(row.value):null;},
 async clear(owner:string){await db.runAsync('DELETE FROM profile_drafts WHERE owner=?',owner);},
};}
