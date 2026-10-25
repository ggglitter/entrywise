import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyWorkspace,validateWorkspace,makeBackup,parseBackup,participationFor} from '../docs/workspace.mjs';
import {receiptRecord,entryCounts} from '../docs/core.mjs';
const now=new Date('2026-10-25T08:00:00Z');
const options={demo:false,knownIds:new Set(['S03','D01'])};
const receipt=()=>receiptRecord({id:'D01',type:'registration',url:'https://example.org/receipt',confirmed:true},now);
const workspace=()=>({...emptyWorkspace(),plans:['D01'],receipts:[receipt()]});
test('personal backup roundtrip preserves contents and separate counts',()=>{
  const original=workspace();
  const restored=parseBackup(JSON.stringify(makeBackup(original,{now})),options);
  assert.deepEqual(restored,original);
  assert.deepEqual(entryCounts(restored.plans,restored.receipts),{planned:1,registrations:1,submissions:0});
});
test('demo backups cannot enter the personal workspace',()=>{
  const backup=makeBackup(emptyWorkspace(),{demo:true,now});
  assert.throws(()=>parseBackup(JSON.stringify(backup),options),/matching/);
});
test('forged demo receipt in a personal export is rejected',()=>{
  const backup=makeBackup(workspace(),{now});backup.receipts[0].demo=true;
  assert.throws(()=>parseBackup(JSON.stringify(backup),options),/cannot be mixed/);
});
test('duplicate plans and receipts do not inflate restored counts',()=>{
  const value=workspace();value.plans.push('D01');value.receipts.push(receipt());
  const restored=validateWorkspace(value,options);
  assert.equal(restored.plans.length,1);assert.equal(restored.receipts.length,1);
});
test('restore preserves an intentionally removed bookmark while retaining its receipt',()=>{
  const value=workspace();value.plans=[];
  const restored=validateWorkspace(value,options);
  assert.deepEqual(restored.plans,[]);
  assert.deepEqual(entryCounts(restored.plans,restored.receipts),{planned:0,registrations:1,submissions:0});
});
test('foreign identifiers are rejected without silent data loss',()=>{
  const value=workspace();value.plans.push('unknown');
  assert.throws(()=>validateWorkspace(value,options),/missing from this data snapshot/);
});
test('credential-bearing receipt URL is rejected on restore',()=>{
  const value=workspace();value.receipts[0].url='https://user:secret@example.org/';
  assert.throws(()=>validateWorkspace(value,options),/without credentials/);
});
test('invalid timestamp cannot be restored as a valid receipt',()=>{
  for(const timestamp of ['tomorrow','2026-02-31T08:00:00Z']){
    const value=workspace();value.receipts[0].recordedAt=timestamp;
    assert.throws(()=>validateWorkspace(value,options),/timestamp/);
  }
});
test('invalid profile cannot hide an eligibility requirement',()=>{
  const value=workspace();value.profile.age='21';
  assert.throws(()=>validateWorkspace(value,options),/profile/);
});
test('legacy app export is accepted and normalized',()=>{
  const legacy={mode:'user_recorded',notice:'Saved plans are not registrations.',...workspace()};
  assert.deepEqual(parseBackup(JSON.stringify(legacy),options),workspace());
});
test('unsupported future schema and malformed JSON fail clearly',()=>{
  const future=makeBackup(workspace(),{now});future.schemaVersion=999;
  assert.throws(()=>parseBackup(JSON.stringify(future),options),/not supported/);
  assert.throws(()=>parseBackup('{bad',options),/No saved entries were changed/);
});
test('export excludes unrecognized fields such as credentials',()=>{
  const value=workspace();value.password='do-not-export';value.profile.email='private@example.org';
  const backup=makeBackup(value,{now});
  assert.equal(backup.password,undefined);assert.equal(backup.profile.email,undefined);
});
test('participation uses the correct opportunity and action',()=>{
  assert.deepEqual(participationFor('D01',[receipt()]),{registered:true,submitted:false});
  assert.deepEqual(participationFor('S03',[receipt()]),{registered:false,submitted:false});
});
