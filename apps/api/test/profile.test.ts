import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.ts';

const profile = {
  goals: [{id:'goata', name:'GOATA / ankle stability', priority:0}, {id:'posture',name:'Posture',priority:1}],
  equipment: ['mat'], restrictions: ['avoid-discomfort'],
  availability: [{weekday:1, period:'morning', minutes:10}, {weekday:1,period:'evening',minutes:10}],
  commitments: [], timezone:'America/Chicago', startCue:'After breakfast',
};
function setup() {
  let saved: any = null;
  const store = {
    async get(userId: string) { return saved?.userId === userId ? saved : null; },
    async save(userId: string, input: unknown, expectedRevision: number) {
      if ((saved?.inputRevision ?? 0) !== expectedRevision) return null;
      saved = {userId, input, inputRevision:expectedRevision+1}; return saved;
    },
  };
  const app = buildApp({
    founderId:'founder',
    authenticate: async (token: string) => token === 'founder-token' ? 'founder' : token === 'other-token' ? 'other' : null,
    profiles:store,
  });
  const put = (body:unknown, token='founder-token') => app.inject({method:'PUT',url:'/v1/profile',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},payload:JSON.stringify(body)});
  return {app,put,store};
}
describe('private profile boundary', () => {
  it('rejects unauthenticated access', async () => {
    const {app} = setup(); expect((await app.inject({method:'GET',url:'/v1/profile'})).statusCode).toBe(401); await app.close();
  });
  it('prevents another authenticated account from reading founder data', async () => {
    const {app,put} = setup(); await put({input:profile,expectedRevision:0});
    expect((await app.inject({method:'GET',url:'/v1/profile',headers:{authorization:'Bearer other-token'}})).statusCode).toBe(403); await app.close();
  });
  it('saves a profile and rejects a stale edit without losing the saved input', async () => {
    const {app,put,store} = setup();
    const first = await put({input:profile,expectedRevision:0});
    expect(first.statusCode).toBe(200); expect(first.json().inputRevision).toBe(1);
    expect((await put({input:{...profile,startCue:'Changed'},expectedRevision:0})).statusCode).toBe(409);
    expect((await store.get('founder')).input.startCue).toBe('After breakfast'); await app.close();
  });
  it.each([0, -5, 2000])('rejects invalid availability minutes %s', async (minutes) => {
    const {app,put,store} = setup();
    expect((await put({input:{...profile,availability:[{weekday:1,period:'morning',minutes}]},expectedRevision:0})).statusCode).toBe(422);
    expect(await store.get('founder')).toBeNull(); await app.close();
  });
  it('rejects unrecognized timezone and duplicate windows', async () => {
    const {app,put} = setup();
    expect((await put({input:{...profile,timezone:'invented'},expectedRevision:0})).statusCode).toBe(422);
    expect((await put({input:{...profile,availability:[profile.availability[0],profile.availability[0]]},expectedRevision:0})).statusCode).toBe(422); await app.close();
  });
  it('rejects unexpected account ownership in the request', async () => {
    const {app,put} = setup(); expect((await put({input:profile,expectedRevision:0,userId:'other'})).statusCode).toBe(422); await app.close();
  });
});
