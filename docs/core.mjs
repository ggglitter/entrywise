export function exactTime(value) {
  if (typeof value !== 'string') return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i.exec(value);
  if (!parts) return null;
  const [,year,month,day,hour,minute,second='0'] = parts;
  const calendar = new Date(0);calendar.setUTCFullYear(Number(year),Number(month),0);
  if (Number(month)<1 || Number(month)>12 || Number(day)<1 || Number(day)>calendar.getUTCDate() ||
      Number(hour)>23 || Number(minute)>59 || Number(second)>59) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
export function assess(item, profile, now = new Date(), participation = {}) {
  const checks = [];
  const add = (state, label) => checks.push({ state, label });
  const rules = item.rules || {};
  add(item.fee === 0 ? 'pass' : typeof item.fee === 'number' && item.fee > 0 ? 'fail' : 'unknown', 'No entry fee');
  add(item.remote === true ? 'pass' : item.remote === false ? 'fail' : 'unknown', 'No mandatory attendance in reviewed rules');
  if (rules.countries?.length) add(rules.countries.includes(profile.country) ? 'pass' : 'fail', 'Residence requirement');
  else if (rules.excludedCountries?.includes(profile.country)) add('fail', 'Your residence is excluded');
  else add(profile.country === 'OTHER' ? 'unknown' : 'pass', 'Residence checked against recorded exclusions');
  if (rules.studentOnly) add(profile.student === 'yes' ? 'pass' : profile.student === 'no' ? 'fail' : 'unknown', 'Current student required');
  const ages = {adult:{min:18,max:null},'18':{min:18,max:18},'19plus':{min:19,max:null}};
  const age = ages[profile.age] || {min:null,max:null};
  if (rules.minAge) add(age.min !== null && age.min >= rules.minAge ? 'pass' : age.max !== null && age.max < rules.minAge ? 'fail' : 'unknown', 'Age '+rules.minAge+'+ required');
  if (rules.maxAgeExclusive) add(age.min !== null && age.min >= rules.maxAgeExclusive ? 'fail' : age.max !== null && age.max < rules.maxAgeExclusive ? 'pass' : 'unknown', 'Must be under '+rules.maxAgeExclusive);
  if (rules.memberOnly) add(profile.member === true ? 'pass' : 'unknown', 'Existing program membership must be verified');
  if (rules.noAI) add(profile.method === 'ai' ? 'fail' : profile.method === 'human' ? 'pass' : 'unknown', 'Generative AI is prohibited');
  if (rules.realPhotography) add(profile.method === 'ai' ? 'fail' : 'unknown', 'Actual camera originals and rights required');
  for (const note of rules.review || []) add('unknown', note);
  if (!item.source) add('unknown', 'Official source missing');
  const end = exactTime(item.deadline);
  const registrationEnd = exactTime(item.registrationDeadline);
  const submissionClosed = end !== null && now.getTime() > end;
  const registrationClosed = registrationEnd !== null && now.getTime() > registrationEnd && participation.registered !== true;
  const closed = submissionClosed || registrationClosed;
  if (end !== null) add(submissionClosed ? 'fail' : 'pass', submissionClosed ? 'Submission deadline has passed' : 'Submission window is open');
  else add('unknown', 'Exact deadline or time zone needs confirmation');
  if (item.registrationDeadline) {
    if (registrationEnd === null) add('unknown', 'Registration time or time zone needs confirmation');
    else if (participation.registered === true) add('pass', 'Registration receipt recorded (user supplied)');
    else add(registrationClosed ? 'fail' : 'pass', registrationClosed ? 'Registration closed before the submission deadline' : 'Registration window is open');
  }
  const start = exactTime(item.startsAt);
  const waiting = start !== null && now.getTime() < start;
  if (item.startsAt && start === null) add('unknown', 'Build start time or time zone needs confirmation');
  if (waiting) add('unknown', 'Build window has not started; do not create early');
  const failed = checks.filter(c => c.state === 'fail').length;
  const unknown = checks.filter(c => c.state === 'unknown').length;
  const decision = closed ? 'closed' : failed ? 'unavailable' : waiting ? 'scheduled' : unknown ? 'review' : 'prepare';
  return { decision, checks, failed, unknown };
}
export const labels = {prepare:'Can prepare',review:'Check first',unavailable:'Not a fit',closed:'Entry closed',scheduled:'Wait for start'};
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
