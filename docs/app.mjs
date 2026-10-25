import {assess,labels,receiptRecord,entryCounts,escapeHTML as e} from './core.mjs';
import {defaults,emptyWorkspace,validateWorkspace,makeBackup,parseBackup,participationFor} from './workspace.mjs';

const $=s=>document.querySelector(s);
const demo=new URLSearchParams(location.search).has('demo');
const key=demo?'entrywise.demo.v1':'entrywise.local.v1';
let store=emptyWorkspace(),storageOK=true,items=[],selected=null,view='all',pendingBackup=null;
const now=()=>demo?new Date($('#demo-time').value):new Date();
function notice(message,undo){
  const panel=$('#notice');panel.textContent=message;panel.hidden=false;
  if(undo){
    const button=document.createElement('button');button.type='button';button.textContent='Undo';
    button.addEventListener('click',undo,{once:true});panel.append(button);
  }
}
function persist(){
  if($('#notice').querySelector('button')){$('#notice').replaceChildren();$('#notice').hidden=true;}
  if(!storageOK)return false;
  try{localStorage.setItem(key,JSON.stringify(store));return true;}
  catch{storageOK=false;notice('Browser storage is unavailable. Changes are temporary; export a backup before leaving.');return false;}
}
function snapshot(){
  let raw;try{raw=localStorage.getItem(key);}catch{}
  return {store:structuredClone(store),raw,storageOK};
}
function applyProfile(){for(const field of Object.keys(defaults))$('#'+field).value=store.profile[field];}
function undoTo(previous){
  store=previous.store;storageOK=previous.storageOK;
  try{
    if(previous.raw===null)localStorage.removeItem(key);
    else if(typeof previous.raw==='string')localStorage.setItem(key,previous.raw);
  }catch{storageOK=false;}
  applyProfile();render();
  notice(storageOK?'Previous local records restored.':'Previous records restored in this tab; browser storage is unavailable.');
}
for(const field of Object.keys(defaults))$('#'+field).addEventListener('change',()=>{store.profile[field]=$('#'+field).value;persist();render();});
$('#demo-label').hidden=!demo;$('#demo-controls').hidden=!demo;$('#reset-demo').hidden=!demo;
$('#demo-time').addEventListener('change',render);
$('#reset-demo').addEventListener('click',()=>{
  if(!demo)return;
  const previous=snapshot();store=emptyWorkspace();storageOK=true;applyProfile();
  $('#search').value='';$('#decision').value='all';$('#demo-time').selectedIndex=0;view='all';selected=null;
  const saved=persist();$('#data-menu').open=false;render();
  notice(saved?'Demo examples cleared.':'Demo cleared in this tab; browser storage is unavailable.',()=>undoTo(previous));
});
$('#search').addEventListener('input',render);$('#decision').addEventListener('change',render);
$('#view-all').addEventListener('click',()=>{view='all';render();});
$('#view-saved').addEventListener('click',()=>{view='saved';render();});
const dateText=x=>x?new Date(x).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'}):'Check time';
const fullDate=x=>x?new Date(x).toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' UTC':'Confirm exact deadline with organizer';
const timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
const localDate=x=>x?new Date(x).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+timeZone:'';
function render(){
  const q=$('#search').value.trim().toLowerCase(),filter=$('#decision').value;
  const tracked=new Set([...store.plans,...store.receipts.map(r=>r.id)]);
  const evaluated=items.map(item=>{
    const participation=participationFor(item.id,store.receipts);
    return {item,participation,fit:assess(item,store.profile,now(),participation)};
  });
  const rows=evaluated.filter(({item,fit})=>(view!=='saved'||tracked.has(item.id))&&(!q||(item.name+' '+item.category).toLowerCase().includes(q))&&(filter==='all'||fit.decision===filter));
  $('#result-count').textContent=rows.length+' of '+items.length;
  $('#view-all').classList.toggle('active',view==='all');$('#view-saved').classList.toggle('active',view==='saved');
  $('#view-all').setAttribute('aria-pressed',String(view==='all'));$('#view-saved').setAttribute('aria-pressed',String(view==='saved'));
  $('#plan-count').textContent=tracked.size;
  if(!rows.some(x=>x.item.id===selected))selected=rows[0]?.item.id||null;
  $('#opportunities').innerHTML=rows.length?rows.map(({item,fit,participation})=>{
    const state=participation.submitted?(demo?' · EXAMPLE SUBMISSION':' · SUBMISSION RECORDED'):participation.registered?(demo?' · EXAMPLE REGISTRATION':' · REGISTRATION RECORDED'):store.plans.includes(item.id)?' · SAVED PLAN':'';
    return '<button type="button" class="opportunity '+(selected===item.id?'selected':'')+'" data-id="'+e(item.id)+'" aria-pressed="'+(selected===item.id)+'" aria-label="Inspect '+e(item.name)+'"><span><span class="name">'+e(item.name)+'</span><span class="discipline">'+e(item.category)+state+'</span></span><span class="due">'+e(dateText(item.deadline))+'<small>'+(item.deadline?e(new Date(item.deadline).getUTCFullYear()):'TIME UNCONFIRMED')+'</small></span><span class="badge '+fit.decision+'">'+labels[fit.decision]+'</span></button>';
  }).join(''):'<div class="empty">No opportunities match these filters.<br><button id="reset-search">Clear filters</button></div>';
  for(const row of document.querySelectorAll('[data-id]'))row.addEventListener('click',()=>{
    selected=row.dataset.id;render();
    if(matchMedia('(max-width:750px)').matches){$('#detail').scrollIntoView({block:'start'});$('#detail-heading')?.focus({preventScroll:true});}
  });
  $('#reset-search')?.addEventListener('click',()=>{$('#search').value='';$('#decision').value='all';view='all';render();});
  renderDetail(evaluated.find(x=>x.item.id===selected));
  const counts=entryCounts(store.plans,store.receipts);
  $('#planned-total').textContent=counts.planned;$('#registration-total').textContent=counts.registrations;$('#submission-total').textContent=counts.submissions;
}
function renderDetail(row){
  if(!row){$('#detail').innerHTML='<p>Select an opportunity to inspect its requirements.</p>';return;}
  const {item,fit}=row,receipts=store.receipts.filter(r=>r.id===item.id);
  $('#detail').innerHTML=
    '<a class="back-to-queue" href="#queue">← Back to opportunities</a>'+
    '<p class="small-label">03 / THE EVIDENCE SHEET</p><h2 id="detail-heading" tabindex="-1">'+e(item.name)+'</h2>'+
    '<div class="detail-meta"><span>'+e(item.category)+'</span><span class="badge '+fit.decision+'">'+labels[fit.decision]+'</span></div>'+
    '<div class="reward">'+e(item.reward)+'</div><p class="requirements">'+e(item.requirements)+'</p>'+
    '<p class="requirements"><strong>Submit:</strong> '+e(fullDate(item.deadline))+
    (item.deadline?'<span class="local-time">Your time: '+e(localDate(item.deadline))+'</span>':'')+
    (item.registrationDeadline?'<br><strong>Register first:</strong> '+e(fullDate(item.registrationDeadline))+'<span class="local-time">Your time: '+e(localDate(item.registrationDeadline))+'</span>':'')+'</p>'+
    '<ul class="checklist">'+fit.checks.map(c=>'<li><span class="check-icon '+c.state+'" aria-label="'+c.state+'">'+(c.state==='pass'?'✓':c.state==='fail'?'×':'?')+'</span><span>'+e(c.label)+'</span></li>').join('')+'</ul>'+
    '<div class="source"><a href="'+e(item.source)+'" target="_blank" rel="noopener noreferrer">Read official rules ↗</a><span>Checked '+e(item.reviewed)+'</span></div>'+
    '<div class="actions"><button class="primary" id="save-plan">'+(store.plans.includes(item.id)?'Remove saved plan':'Save to my entries')+'</button><a class="secondary" href="'+e(item.url)+'" target="_blank" rel="noopener noreferrer">Open official entry ↗</a></div>'+
    '<section class="receipt-area"><h3>Record a receipt</h3><p>'+(demo?'Example receipts in a separate demo workspace.':'User-recorded evidence. This app does not verify a platform action.')+'</p>'+
    '<form id="receipt-form"><label>Action<select id="receipt-type"><option value="registration">Registration</option><option value="submission">Submission</option></select></label><label>Receipt URL<input type="url" id="receipt-url" placeholder="https://…" required></label>'+
    '<label class="confirm"><input id="receipt-confirm" type="checkbox"><span>'+(demo?'This is a labelled demonstration receipt.':'This records an actual registration or submission I completed.')+'</span></label>'+
    '<div class="form-error" id="receipt-error" role="alert"></div><button class="secondary" type="submit">Save receipt</button></form>'+
    '<ul class="receipts">'+receipts.map((r,index)=>'<li><strong>'+(r.demo?'DEMO EXAMPLE':'USER RECORDED')+' · '+e(r.type)+'</strong><a href="'+e(r.url)+'" target="_blank" rel="noopener noreferrer">'+e(r.url)+'</a><span>'+e(r.recordedAt)+'</span><button type="button" class="remove-receipt" data-remove-receipt="'+index+'" aria-label="Remove local '+e(r.type)+' receipt">Remove local record</button></li>').join('')+'</ul></section>';
  $('#save-plan').addEventListener('click',()=>{store.plans=store.plans.includes(item.id)?store.plans.filter(id=>id!==item.id):[...store.plans,item.id];persist();render();});
  $('#receipt-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const receipt=receiptRecord({id:item.id,type:$('#receipt-type').value,url:$('#receipt-url').value,confirmed:$('#receipt-confirm').checked,demo});
      store.receipts=[...store.receipts.filter(r=>!(r.id===receipt.id&&r.type===receipt.type&&r.url===receipt.url)),receipt];
      if(!store.plans.includes(item.id))store.plans.push(item.id);
      persist();render();
    }catch(error){$('#receipt-error').textContent=error.message;}
  });
  for(const button of document.querySelectorAll('[data-remove-receipt]'))button.addEventListener('click',()=>{
    const receipt=receipts[Number(button.dataset.removeReceipt)],previous=snapshot();
    store.receipts=store.receipts.filter(r=>r!==receipt);const saved=persist();render();
    notice(saved?'Local receipt removed. The organizer entry is unchanged.':'Local receipt removed in this tab; browser storage is unavailable.',()=>undoTo(previous));
  });
}
$('#export').addEventListener('click',()=>{
  const payload=makeBackup(store,{demo});
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=demo?'entrywise-demo.json':'entrywise-entries.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$('#data-menu').open=false;
});
$('#restore-open').addEventListener('click',()=>{$('#data-menu').open=false;$('#backup-file').value='';$('#backup-file').click();});
$('#backup-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>2_000_000)throw Error('Choose an Entrywise JSON backup smaller than 2 MB.');
    pendingBackup=parseBackup(await file.text(),{demo,knownIds:new Set(items.map(item=>item.id))});
    const counts=entryCounts(pendingBackup.plans,pendingBackup.receipts);
    const plural=(n,label)=>n+' '+label+(n===1?'':'s');
    $('#restore-summary').textContent=plural(counts.planned,'saved plan')+', '+plural(counts.registrations,'registration receipt')+', '+plural(counts.submissions,'submission receipt')+'.';
    $('#restore-profile').textContent=Object.keys(defaults).map(field=>{
      const option=[...$('#'+field).options].find(option=>option.value===pendingBackup.profile[field]);return option.textContent;
    }).join(' · ');
    $('#restore-dialog').showModal();
  }catch(error){pendingBackup=null;notice(error.message);}
});
$('#restore-confirm').addEventListener('click',()=>{
  if(!pendingBackup)return;
  const previous=snapshot();store=pendingBackup;pendingBackup=null;storageOK=true;applyProfile();
  const saved=persist();$('#restore-dialog').close();view='saved';$('#search').value='';$('#decision').value='all';selected=null;render();
  notice(saved?'Backup restored. Receipts remain user recorded.':'Backup restored in this tab; browser storage is unavailable.',()=>undoTo(previous));
});
window.addEventListener('storage',event=>{
  if(event.key!==key || !items.length)return;
  try{
    const next=event.newValue===null?emptyWorkspace():validateWorkspace(JSON.parse(event.newValue),{demo,knownIds:new Set(items.map(item=>item.id))});
    store=next;storageOK=true;applyProfile();render();
    notice('Records changed in another tab and have been refreshed.');
  }catch{
    storageOK=false;
    notice('Browser data changed in another tab and could not be read. The current view is preserved; changes are temporary.');
  }
});
try{
  const response=await fetch('./opportunities.json');if(!response.ok)throw Error();
  const data=await response.json();items=data.opportunities.sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'));
  try{
    const saved=localStorage.getItem(key);
    if(saved)store=validateWorkspace(JSON.parse(saved),{demo,knownIds:new Set(items.map(item=>item.id))});
  }catch{storageOK=false;notice('Saved browser data needs attention and has been preserved. Changes are temporary; restore a valid backup to replace it.');}
  applyProfile();render();
}catch{
  notice('Opportunity data could not load. Serve this folder over HTTP and reload; no application has been submitted.');
  $('#opportunities').textContent='Unable to load the opportunity file.';
}
