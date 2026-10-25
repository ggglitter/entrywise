import {receiptRecord,exactTime} from './core.mjs';

export const defaults = {country:'CN',age:'adult',student:'no',method:'ai'};
const choices = {
  country:['CN','US','GB','OTHER'], age:['adult','18','19plus','unknown'],
  student:['yes','no','unknown'], method:['ai','human','unknown']
};
export const emptyWorkspace = () => ({profile:{...defaults},plans:[],receipts:[]});
export const receiptKey = r => JSON.stringify([r.id,r.type,r.url]);
export function participationFor(id, receipts) {
  return {
    registered:receipts.some(r=>r.id===id && r.type==='registration'),
    submitted:receipts.some(r=>r.id===id && r.type==='submission')
  };
}
export function validateWorkspace(value, {demo = false, knownIds}) {
  if (!value || typeof value !== 'object' || !value.profile || Array.isArray(value.profile) ||
      !Array.isArray(value.plans) || !Array.isArray(value.receipts)) throw Error('This is not an Entrywise workspace.');
  if (value.plans.length > 1000 || value.receipts.length > 1000) throw Error('The backup is too large.');
  const profile = {};
  for (const [field,allowed] of Object.entries(choices)) {
    if (!allowed.includes(value.profile[field])) throw Error('Invalid profile value: '+field+'.');
    profile[field] = value.profile[field];
  }
  const checkId = id => {
    if (typeof id !== 'string' || !knownIds.has(id)) throw Error('The backup contains an opportunity missing from this data snapshot.');
    return id;
  };
  const plans = [...new Set(value.plans.map(checkId))];
  const seen = new Set(), receipts = [];
  for (const r of value.receipts) {
    if (!r || typeof r !== 'object') throw Error('An entry receipt is invalid.');
    checkId(r.id);
    if ((r.demo === true || r.source === 'demo_example') !== demo) throw Error('Demo examples and personal entries cannot be mixed.');
    if (exactTime(r.recordedAt) === null) throw Error('A receipt timestamp is invalid.');
    const normalized = receiptRecord({id:r.id,type:r.type,url:r.url,confirmed:true,demo},new Date(r.recordedAt));
    const identity = receiptKey(normalized);
    if (!seen.has(identity)) {receipts.push(normalized);seen.add(identity);}
  }
  return {profile,plans,receipts};
}
export function parseBackup(text, options) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw Error('Choose an Entrywise JSON backup smaller than 2 MB.');
  let backup;
  try {backup=JSON.parse(text);} catch {throw Error('The file is not valid JSON. No saved entries were changed.');}
  const mode = options.demo ? 'demo_examples' : 'user_recorded';
  if (!backup || backup.mode !== mode) throw Error('Open this backup in its matching personal or demo workspace.');
  if (backup.format !== undefined && (backup.format !== 'entrywise-backup' || backup.schemaVersion !== 2)) throw Error('This backup format is not supported.');
  if (backup.format === undefined && typeof backup.notice !== 'string') throw Error('This is not an Entrywise backup.');
  return validateWorkspace(backup,options);
}
export function makeBackup(workspace, {demo = false, now = new Date()} = {}) {
  const profile = Object.fromEntries(Object.keys(defaults).map(field=>[field,workspace.profile[field]]));
  return {
    format:'entrywise-backup',schemaVersion:2,exportedAt:now.toISOString(),
    mode:demo?'demo_examples':'user_recorded',
    notice:'Saved plans are not registrations. Receipts are user recorded, not independently verified.',
    profile, plans:[...workspace.plans],
    receipts:workspace.receipts.map(r=>({id:r.id,type:r.type,url:r.url,recordedAt:r.recordedAt,source:r.source,demo:r.demo===true}))
  };
}
