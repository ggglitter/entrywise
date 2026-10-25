import {assess,labels,receiptRecord,entryCounts,escapeHTML as e} from './core.mjs';
const $=s=>document.querySelector(s);
const demo=new URLSearchParams(location.search).has('demo');
const key=demo?'entrywise.demo.v1':'entrywise.local.v1';
const defaults={country:'CN',age:'adult',student:'no',method:'ai'};
let store={profile:{...defaults},plans:[],receipts:[]},storageOK=true;
const notice=message=>{$('#notice').textContent=message;$('#notice').hidden=false;};
try{const saved=localStorage.getItem(key);if(saved){const v=JSON.parse(saved);if(!v.profile||!Array.isArray(v.plans)||!Array.isArray(v.receipts))throw Error();store=v;}}
catch{storageOK=false;notice('Saved data could not be read. This workspace is temporary until browser storage is available.');}
function persist(){if(!storageOK)return false;try{localStorage.setItem(key,JSON.stringify(store));return true;}catch{storageOK=false;notice('Browser storage is unavailable. Changes are temporary; use Export my entries before leaving.');return false;}}
const now=()=>demo?new Date('2026-10-25T08:00:00Z'):new Date();
let items=[],selected=null,view='all';
for(const field of Object.keys(defaults)){$('#'+field).value=store.profile[field]||defaults[field];$('#'+field).addEventListener('change',()=>{store.profile[field]=$('#'+field).value;persist();render();});}
$('#demo-label').hidden=!demo;
$('#reset-demo').hidden=!demo;
$('#reset-demo').addEventListener('click',()=>{
  if(!demo)return;
  store={profile:{...defaults},plans:[],receipts:[]};
  for(const field of Object.keys(defaults))$('#'+field).value=defaults[field];
  $('#search').value='';$('#decision').value='all';view='all';selected=null;
  persist();render();
});
$('#search').addEventListener('input',render);
$('#decision').addEventListener('change',render);
$('#view-all').addEventListener('click',()=>{view='all';render();});
$('#view-saved').addEventListener('click',()=>{view='saved';render();});
const dateText=x=>x?new Date(x).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'}):'Check time';
const fullDate=x=>x?new Date(x).toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' UTC':'Confirm exact deadline with organizer';
function render(){
  const q=$('#search').value.trim().toLowerCase(),filter=$('#decision').value;
  const evaluated=items.map(item=>({item,fit:assess(item,store.profile,now())}));
  const rows=evaluated.filter(({item,fit})=>(view!=='saved'||store.plans.includes(item.id))&&(!q||(item.name+' '+item.category).toLowerCase().includes(q))&&(filter==='all'||fit.decision===filter));
  $('#result-count').textContent=rows.length+' of '+items.length;
  $('#view-all').classList.toggle('active',view==='all');$('#view-saved').classList.toggle('active',view==='saved');$('#plan-count').textContent=store.plans.length;
  if(!rows.some(x=>x.item.id===selected))selected=rows[0]?.item.id||null;
  $('#opportunities').innerHTML=rows.length?rows.map(({item,fit})=>
    '<button type="button" class="opportunity '+(selected===item.id?'selected':'')+'" data-id="'+e(item.id)+'" aria-label="Inspect '+e(item.name)+'"><span><span class="name">'+e(item.name)+'</span><span class="discipline">'+e(item.category)+(store.plans.includes(item.id)?' · SAVED PLAN':'')+'</span></span><span class="due">'+e(dateText(item.deadline))+'<small>'+(item.deadline?e(new Date(item.deadline).getUTCFullYear()):'TIME UNCONFIRMED')+'</small></span><span class="badge '+fit.decision+'">'+labels[fit.decision]+'</span></button>'
  ).join(''):'<div class="empty">No opportunities match these filters.<br><button id="reset-search">Clear filters</button></div>';
  for(const row of document.querySelectorAll('[data-id]'))row.addEventListener('click',()=>{selected=row.dataset.id;render();});
  $('#reset-search')?.addEventListener('click',()=>{$('#search').value='';$('#decision').value='all';view='all';render();});
  renderDetail(evaluated.find(x=>x.item.id===selected));
  const counts=entryCounts(store.plans,store.receipts);
  $('#planned-total').textContent=counts.planned;$('#registration-total').textContent=counts.registrations;$('#submission-total').textContent=counts.submissions;
}
function renderDetail(row){
  if(!row){$('#detail').innerHTML='<p>Select an opportunity to inspect its requirements.</p>';return;}
  const {item,fit}=row,receipts=store.receipts.filter(r=>r.id===item.id);
  $('#detail').innerHTML='<p class="small-label">03 / THE EVIDENCE SHEET</p><h2>'+e(item.name)+'</h2>'+
    '<div class="detail-meta"><span>'+e(item.category)+'</span><span class="badge '+fit.decision+'">'+labels[fit.decision]+'</span></div>'+
    '<div class="reward">'+e(item.reward)+'</div><p class="requirements">'+e(item.requirements)+'</p>'+
    '<p class="requirements"><strong>Submit:</strong> '+e(fullDate(item.deadline))+(item.registrationDeadline?'<br><strong>Register first:</strong> '+e(fullDate(item.registrationDeadline)):'')+'</p>'+
    '<ul class="checklist">'+fit.checks.map(c=>'<li><span class="check-icon '+c.state+'" aria-label="'+c.state+'">'+(c.state==='pass'?'✓':c.state==='fail'?'×':'?')+'</span><span>'+e(c.label)+'</span></li>').join('')+'</ul>'+
    '<div class="source"><a href="'+e(item.source)+'" target="_blank" rel="noopener noreferrer">Read official rules ↗</a><span>Checked '+e(item.reviewed)+'</span></div>'+
    '<div class="actions"><button class="primary" id="save-plan">'+(store.plans.includes(item.id)?'Remove saved plan':'Save to my entries')+'</button><a class="secondary" href="'+e(item.url)+'" target="_blank" rel="noopener noreferrer">Open official entry ↗</a></div>'+
    '<section class="receipt-area"><h3>Record a receipt</h3><p>'+(demo?'Example receipts in a separate demo workspace.':'User-recorded evidence. This app does not verify a platform action.')+'</p>'+
    '<form id="receipt-form"><label>Action<select id="receipt-type"><option value="registration">Registration</option><option value="submission">Submission</option></select></label><label>Receipt URL<input type="url" id="receipt-url" placeholder="https://…" required></label>'+
    '<label class="confirm"><input id="receipt-confirm" type="checkbox"><span>'+(demo?'This is a labelled demonstration receipt.':'This records an actual registration or submission I completed.')+'</span></label>'+
    '<div class="form-error" id="receipt-error" role="alert"></div><button class="secondary" type="submit">Save receipt</button></form>'+
    '<ul class="receipts">'+receipts.map(r=>'<li><strong>'+(r.demo?'DEMO EXAMPLE':'USER RECORDED')+' · '+e(r.type)+'</strong><a href="'+e(r.url)+'" target="_blank" rel="noopener noreferrer">'+e(r.url)+'</a><span>'+e(r.recordedAt)+'</span></li>').join('')+'</ul></section>';
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
}
$('#export').addEventListener('click',()=>{
  const payload={exportedAt:new Date().toISOString(),mode:demo?'demo_examples':'user_recorded',notice:'Saved plans are not registrations. Receipts are not independently verified.',...store};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=demo?'entrywise-demo.json':'entrywise-entries.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{
  const response=await fetch('./opportunities.json');if(!response.ok)throw Error();
  const data=await response.json();items=data.opportunities.sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'));render();
}catch{notice('Opportunity data could not load. Serve this folder over HTTP and reload; no application has been submitted.');$('#opportunities').textContent='Unable to load the opportunity file.';}
