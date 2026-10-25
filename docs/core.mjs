export function assess(item, profile, now = new Date()) {
  const checks = [];
  const add = (state, label) => checks.push({ state, label });
  const rules = item.rules || {};
  add(item.fee === 0 ? 'pass' : 'unknown', 'No entry fee');
  add(item.remote === true ? 'pass' : 'unknown', 'No mandatory attendance in reviewed rules');
  if (rules.countries?.length) add(rules.countries.includes(profile.country) ? 'pass' : 'fail', 'Residence requirement');
  else if (rules.excludedCountries?.includes(profile.country)) add('fail', 'Your residence is excluded');
  else add(profile.country === 'OTHER' ? 'unknown' : 'pass', 'Residence checked against recorded exclusions');
  if (rules.studentOnly) add(profile.student === 'yes' ? 'pass' : profile.student === 'no' ? 'fail' : 'unknown', 'Current student required');
  if (rules.minAge) {
    const minimum = profile.age === '19plus' ? 19 : ['18','adult'].includes(profile.age) ? 18 : null;
    add(minimum !== null && minimum >= rules.minAge ? 'pass' : 'unknown', 'Age '+rules.minAge+'+ required');
  }
  if (rules.maxAgeExclusive) add(profile.age === '18' && rules.maxAgeExclusive === 19 ? 'pass' : profile.age === '19plus' ? 'fail' : 'unknown', 'Must be under '+rules.maxAgeExclusive);
  if (rules.memberOnly) add(profile.member === true ? 'pass' : 'unknown', 'Existing program membership must be verified');
  if (rules.noAI) add(profile.method === 'ai' ? 'fail' : profile.method === 'human' ? 'pass' : 'unknown', 'Generative AI is prohibited');
  if (rules.realPhotography) add(profile.method === 'ai' ? 'fail' : 'unknown', 'Actual camera originals and rights required');
  for (const note of rules.review || []) add('unknown', note);
  if (!item.source) add('unknown', 'Official source missing');
  const end = item.deadline ? Date.parse(item.deadline) : NaN;
  const registrationEnd = item.registrationDeadline ? Date.parse(item.registrationDeadline) : null;
  const cutoff = registrationEnd === null ? end : Math.min(end, registrationEnd);
  const closed = Number.isFinite(cutoff) && now.getTime() > cutoff;
  if (Number.isFinite(end)) add(closed ? 'fail' : 'pass', 'Registration and submission windows');
  else add('unknown', 'Exact deadline or time zone needs confirmation');
  const waiting = item.startsAt && now.getTime() < Date.parse(item.startsAt);
  if (waiting) add('unknown', 'Build window has not started; do not create early');
  const failed = checks.filter(c => c.state === 'fail').length;
  const unknown = checks.filter(c => c.state === 'unknown').length;
  const decision = closed ? 'closed' : failed ? 'unavailable' : waiting ? 'scheduled' : unknown ? 'review' : 'prepare';
  return { decision, checks, failed, unknown };
}
export const labels = {prepare:'Can prepare',review:'Check first',unavailable:'Not a fit',closed:'Closed',scheduled:'Wait for start'};
export function receiptRecord({ id, type, url, confirmed, demo = false }, now = new Date()) {
  if (!id) throw new Error('Choose an opportunity first.');
  if (!['registration', 'submission'].includes(type)) throw new Error('Choose a receipt type.');
  if (!confirmed) throw new Error(demo ? 'Confirm that this is a labelled demonstration receipt.' : 'Confirm that this records an actual platform action.');
  let parsed;
  try { parsed = new URL(url.trim()); } catch { throw new Error('Enter a complete HTTP(S) receipt URL.'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Use a normal HTTP(S) URL without credentials.');
  return { id, type, url:parsed.href, recordedAt:now.toISOString(), source:demo?'demo_example':'user_recorded', demo };
}
export function entryCounts(plans, receipts) {
  return {planned:new Set(plans).size,registrations:new Set(receipts.filter(r=>r.type==='registration').map(r=>r.id)).size,submissions:new Set(receipts.filter(r=>r.type==='submission').map(r=>r.id)).size};
}
export function escapeHTML(s) {return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
