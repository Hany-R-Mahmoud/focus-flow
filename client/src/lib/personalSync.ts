import { neon } from "./neon";
import {
  getTemplates, getSessions, getReviews, applyPersonalRemote, getAccountScope, selectDatabaseScope, addImportedPersonal,
  type SessionTemplate, type FocusSession, type DailyReview,
} from "./db";

type Kind = "template" | "session" | "review";
type Personal = SessionTemplate | FocusSession | DailyReview;
type Row = {kind: Kind; record_id: string; payload: Personal | null; deleted: boolean; revision: number};
type Version = {revision: number; fingerprint: string; deleted: boolean};
type Shadow = Record<string, Version>;
type State = {shadow: Shadow; pending: Record<string, Personal | null>};
type Change = {kind: Kind; record_id: string; payload: Personal | null; deleted: boolean; expected_revision: number};
export type SyncStatus = {state: "local" | "syncing" | "synced" | "offline" | "conflict" | "error"; message: string; pending: number};
const EMPTY: SyncStatus = {state:"local",message:"Only this device",pending:0};
let status: SyncStatus = EMPTY;
let activeUser: string | null = null;
let busy = false;
let generation = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(s: SyncStatus)=>void>();
const changed = () => { for(const cb of listeners) cb(status); window.dispatchEvent(new Event("focusflow-data-updated")); };
const announce = (state:SyncStatus["state"], message:string, pending=0) => { status={state,message,pending}; changed(); };
export const onSyncStatus = (cb:(s:SyncStatus)=>void) => {listeners.add(cb); cb(status); return () => {listeners.delete(cb);};};
export const getSyncStatus = () => status;
const key = (kind:Kind,id:string) => JSON.stringify([kind,id]);
const fingerprint = (p: Personal | null) => JSON.stringify(p);
const stateKey = (user:string) => "focusflow_sync_v1_" + encodeURIComponent(user);
function load(user:string): State {
  try {
    const raw = localStorage.getItem(stateKey(user));
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if(parsed.shadow && parsed.pending) return parsed;
    }
  } catch { /* Storage failure: do not discard local records. */ }
  return {shadow:{},pending:{}};
}
function save(user:string, s:State) { localStorage.setItem(stateKey(user),JSON.stringify(s)); }
async function snapshot():Promise<Record<string,{kind:Kind,id:string,payload:Personal}>>{
  const [templates,sessions,reviews]=await Promise.all([getTemplates(),getSessions(),getReviews()]);
  const out:Record<string,{kind:Kind,id:string,payload:Personal}>={};
  for(const [kind,items] of [["template",templates],["session",sessions],["review",reviews]] as const)
    for(const item of items) out[key(kind,item.id)]={kind,id:item.id,payload:item};
  return out;
}
function decode(k:string):[Kind,string] {return JSON.parse(k) as [Kind,string];}
function current():boolean {return !!activeUser && getAccountScope() === encodeURIComponent(activeUser);}
async function readAll():Promise<Row[]> {
  if(!neon) throw new Error("Neon is not configured");
  const rows:Row[]=[];
  // Keyset pagination: never silently truncate a user's history at the Data API row limit.
  let offset=0;
  for(let page=0;page<200;page++){
    const result=await neon.from("focus_personal_records").select("kind,record_id,payload,deleted,revision")
      .order("kind",{ascending:true}).order("record_id",{ascending:true}).range(offset,offset+99);
    if(result.error) throw result.error;
    const batch=(result.data ?? []) as Row[];
    rows.push(...batch);
    if(batch.length<100)return rows;
    offset+=batch.length;
  }
  throw new Error("Sync exceeds supported 20,000 records. Export data before continuing.");
}
async function apply(changes:Change[]):Promise<Array<{kind:Kind;record_id:string;revision:number|null;applied:boolean}>> {
  if(!neon) throw new Error("Neon is not configured");
  const result=await neon.rpc("focus_apply_changes",{requested_changes:changes});
  if(result.error) throw result.error;
  return result.data as Array<{kind:Kind;record_id:string;revision:number|null;applied:boolean}>;
}
export async function syncPersonal():Promise<void>{
  if(!activeUser || !current() || busy || !neon) return;
  const user=activeUser, ticket=generation;
  if(!navigator.onLine){announce("offline","Offline — changes stay on this device");return;}
  busy=true;
  try{
    announce("syncing","Syncing with Neon");
    const state=load(user), local=await snapshot();
    const cloud=await readAll();
    if(ticket!==generation || !current())return;
    const remote=new Map(cloud.map(r=>[key(r.kind,r.record_id),r]));
    // Compute local mutations relative to the last acknowledged cloud snapshot.
    // Pending mutations persist even if a different browser changes the remote row.
    const keys=new Set([...Object.keys(local),...Object.keys(state.shadow),...Object.keys(state.pending)]);
    for(const k of keys){
      if(Object.prototype.hasOwnProperty.call(state.pending,k))continue;
      const localFingerprint=local[k] ? fingerprint(local[k].payload):null;
      const before=state.shadow[k];
      if(before && before.fingerprint === localFingerprint)continue;
      if(!before && !local[k])continue;
      // No first-run automatic upload for seeded guest data; account DB is isolated.
      state.pending[k]=local[k]?.payload??null;
    }
    save(user,state);
    let conflicts=0;
    for(const [k,payload] of Object.entries({...state.pending})){
      if(ticket!==generation || !current())return;
      const [kind,id]=decode(k), server=remote.get(k), previous=state.shadow[k];
      const expected=previous?.revision ?? 0;
      if(server && server.revision!==expected){
        // Do not overwrite either divergent version; preserve local change as pending.
        conflicts++;
        continue;
      }
      const result=await apply([{kind,record_id:id,payload,deleted:payload===null,expected_revision:expected}]);
      if(ticket!==generation || !current())return;
      const response=result[0];
      if(!response?.applied || !response.revision){conflicts++;continue;}
      state.shadow[k]={revision:response.revision,fingerprint:fingerprint(payload),deleted:payload===null};
      delete state.pending[k];
      remote.set(k,{kind,record_id:id,payload,deleted:payload===null,revision:response.revision});
      save(user,state);
    }
    // Server revisions are authoritative; only apply remote rows when local is clean.
    const after=await snapshot();
    for(const [k,row] of remote){
      if(ticket!==generation || !current())return;
      if(Object.prototype.hasOwnProperty.call(state.pending,k))continue;
      const known=state.shadow[k];
      const localValue=after[k]?.payload ?? null;
      if(known && known.fingerprint!==fingerprint(localValue)){conflicts++;continue;}
      if(!known && localValue){conflicts++;continue;}
      if(!known || known.revision!==row.revision){
        await applyPersonalRemote(row.kind,row.record_id,row.deleted?null:row.payload);
        state.shadow[k]={revision:row.revision,fingerprint:fingerprint(row.deleted?null:row.payload),deleted:row.deleted};
        save(user,state);
      }
    }
    const pending=Object.keys(state.pending).length;
    if(conflicts)announce("conflict","Sync needs attention: a record changed on another device. Local copy preserved.",pending);
    else announce("synced","Synced with Neon",pending);
  } catch(e){
    if(ticket===generation)announce(navigator.onLine?"error":"offline",navigator.onLine?"Sync paused — local changes are safe":"Offline — local changes are safe",Object.keys(load(user).pending).length);
    console.warn("Personal sync was not completed",e);
  }finally{busy=false;}
}
export function stopPersonalSync(){
  generation++;activeUser=null;
  if(timer)clearInterval(timer);
  timer=null;announce("local","Only this device");
}
export function startPersonalSync(user:string){
  stopPersonalSync();
  activeUser=user;
  void syncPersonal();
  timer=setInterval(()=>void syncPersonal(),12000);
  return stopPersonalSync;
}
/** Upload local guest data into the signed-in account only on an explicit user action. */
export async function importGuestPersonal():Promise<{imported:number;skipped:number}>{
  const user=activeUser;
  if(!user || !current())throw new Error("Sign in to import guest records");
  stopPersonalSync();
  let guest:{templates:SessionTemplate[];sessions:FocusSession[];reviews:DailyReview[]};
  try {
    await selectDatabaseScope(null);
    const [templates,sessions,reviews]=await Promise.all([getTemplates(),getSessions(),getReviews()]);
    guest={templates,sessions,reviews};
  } finally {
    await selectDatabaseScope(user);
    startPersonalSync(user);
  }
  let imported=0,skipped=0;
  for(const [kind,items] of [["template",guest!.templates],["session",guest!.sessions],["review",guest!.reviews]] as const){
    for(const item of items){
      if(await addImportedPersonal(kind,item))imported++;
      else skipped++;
    }
  }
  await syncPersonal();
  return {imported,skipped};
}
