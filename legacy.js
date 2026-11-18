
'use strict';
const el=id=>document.getElementById(id);
const make=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
const prefix='guhuza.interview.v1.', recKey=prefix+'record.', emptyPrefs={dest:['Create / update NPA profile','Send thank-you / follow-up email','Update notes in Guhuza profile'],extra:[]};
let prefs=emptyPrefs, draft={a:{interviewer:''}}, current='', available=true;
function warn(t){el('notice').hidden=false;el('notice').textContent=t;}
const cache=new Map();
function load(k,alt){return cache.has(k)?structuredClone(cache.get(k)):alt;}
function persist(k,v){cache.set(k,structuredClone(v));if(k.startsWith(recKey))window.portalWrite(v);return true;}
const groups=[
['Candidate',[['name','Candidate name (first and last)'],['email','Candidate email'],['role','Position applied for'],['job','Job ID'],['interviewer','Who is interviewing?'],['position','Current position'],['resume','Resume check',['Up to date','Update requested','Not discussed']]]],
['Location and commute',[['location','Current location'],['area','Where are they willing to commute?'],['travel','Maximum commute',['30 minutes','45 minutes','60 minutes','90 minutes','Open','Other']],['transit','Transportation',['Car','Public transit','Both','Other']]]],
['Employment preferences',[['reason','Reason for looking / leaving',['Contract ending','Career growth','Career change','Layoff','Not currently working','Other']],['notice','Notice period',['Immediate','1 week','2 weeks','4 weeks','Not applicable','Other']],['employment','Employment type wanted',['Full-time','Part-time','Contract','Other'],true],['setup','Preferred work setup',['In person','Online','Hybrid','Open'],true],['size','Preferred company size',['Large','Medium','Small','Open'],true],['industry','Preferred industry'],['otherinterviews','Other interviews',['Yes','No','Not discussed']],['interviewdetails','Other interview details'],['salary','Salary expectations']]],
['Interest and next steps',[['interest','Why interested in this role?',null,'long'],['notes','Additional Details',null,'long'],['closing','Closing reminder',['Explained that the employer will reach out only if selected'],true]]]];
function allGroups(){return prefs.extra.length?[...groups,['Additional questions',prefs.extra.map(q=>[q.id,q.label,null,'long'])]]:groups;}
function put(k,v){draft.a[k]=v;if(persist(prefix+'draft',draft))el('draftStatus').textContent='Draft held in this open tab. Save the interview before closing.';}
const salaryInputs=[['salaryMinimum','Minimum'],['salaryDream','Maximum / dream job amount']];
const amountPattern=/^\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,5})?)$/;
const moneyFormat=new Intl.NumberFormat('en-CA',{minimumFractionDigits:0,maximumFractionDigits:2});
function amountValue(value){
  const match=String(value??'').trim().match(amountPattern);
  if(!match)return null;
  const amount=Number(match[1].replaceAll(',',''));
  return Number.isSafeInteger(Math.round(amount*100))?amount:null;
}
function salarySummary(a){
  const amounts=salaryInputs.map(([key])=>amountValue(a[key]));
  const dollars=amounts.map(n=>n===null?'':'$'+(Number.isInteger(n)?moneyFormat.format(n):n.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})));
  if(!dollars.some(Boolean))return String(a.salary||'');
  const unit=a.salaryUnit==='annual'?' per year':a.salaryUnit==='hourly'?' per hour':'';
  if(dollars.every(Boolean))return dollars.join('–')+unit;
  return (dollars[0]?'Minimum '+dollars[0]:'Maximum '+dollars[1])+unit;
}
function salaryFields(wrap){
  wrap.classList.add('wide');
  const heading=make('label','Salary expectations');heading.className='main';heading.htmlFor='f_salaryUnit';
  const select=make('select');select.id=heading.htmlFor;
  const hasOldAmounts=!draft.a.salaryUnit&&salaryInputs.some(([key])=>amountValue(draft.a[key])!==null);
  const options=[['annual','Annual salary'],['hourly','Hourly rate']];
  if(hasOldAmounts)options.unshift(['','Choose pay type for previously saved amounts']);
  for(const [value,text] of options){const option=make('option',text);option.value=value;select.append(option);}
  select.value=draft.a.salaryUnit||(hasOldAmounts?'':'annual');
  const hint=make('p');hint.className='muted';hint.id='salaryHint';
  const grid=make('div');grid.className='salary-fields';
  wrap.append(heading,select,hint,grid);
  function renderAmounts(){
    const unit=select.value;
    hint.textContent=unit==='annual'?'Enter 70 for $70,000 per year. You can also paste a full salary such as 85,000.':unit==='hourly'?'Enter the dollar amount per hour, such as 25.50.':'These entries were saved in dollars. Choose a pay type to label them in your notes.';
    grid.replaceChildren();
    for(const [key,title] of salaryInputs){
      const label=make('label',title),box=make('span'),symbol=make('span','$'),input=make('input');
      box.className='money-box';symbol.setAttribute('aria-hidden','true');
      input.type='text';input.inputMode='decimal';input.id='f_'+key;input.spellcheck=false;
      input.placeholder=unit==='annual'?(key==='salaryMinimum'?'70':'85'):unit==='hourly'?'0.00':'';
      input.setAttribute('aria-describedby','salaryHint');
      const draftKey=key+'Entry';
      function showAmount(){
        const n=amountValue(draft.a[key]);
        input.value=n===null?'':unit==='annual'?String(Number((n/1000).toFixed(5))):n.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2});
      }
      function parse(){
        const text=input.value.trim(),n=amountValue(text);
        if(!text)return '';
        if(n===null)return null;
        const fullSalary=unit==='annual'&&(n>=10000||/^\$?\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text));
        const amount=unit==='annual'&&!fullSalary?n*1000:n;
        const cents=Math.round(amount*100);
        if(!Number.isSafeInteger(cents)||Math.abs(amount*100-cents)>0.00001)return null;
        return String(cents/100);
      }
      function validate(){const v=parse();input.setCustomValidity(v===null?'Enter a numeric pay amount.':'');return v;}
      showAmount();
      if(draft.a[draftKey]!==undefined){input.value=draft.a[draftKey];validate();}
      input.oninput=()=>{
        draft.a.salaryUnit=unit;draft.a[draftKey]=input.value;
        const v=validate();put(key,v===null?'':v);
      };
      input.onblur=()=>{if(validate()!==null){delete draft.a[draftKey];showAmount();persist(prefix+'draft',draft);}};
      box.append(symbol,input);label.append(box);grid.append(label);
    }
  }
  select.onchange=()=>{
    const previous=draft.a.salaryUnit;
    if(previous && previous!==select.value){
      for(const [key] of salaryInputs){
        const shown=amountValue(el('f_'+key).value);
        if(shown!==null)draft.a[key]=String(select.value==='annual'&&shown<10000?Number((shown*1000).toFixed(2)):shown);
      }
    }
    for(const [key] of salaryInputs)delete draft.a[key+'Entry'];
    put('salaryUnit',select.value);renderAmounts();
  };
  renderAmounts();
  if(draft.a.salary){
    const label=make('label','Previously recorded salary');label.className='main';
    const input=make('input');input.type='text';input.value=draft.a.salary;
    input.oninput=()=>put('salary',input.value);label.append(input);wrap.append(label);
  }
}
const interestChoices=[
  'Opportunity for career growth or advancement',
  'Role matches my skills and experience',
  'Interested in the day-to-day work',
  'Want to learn new skills or take on a new challenge',
  'Want to move into this industry',
  'Interested in this specific company',
  'Looking for a permanent role as my contract ends',
  'Better pay or benefits',
  'Better schedule, work setup or work-life balance',
  'Better location or shorter commute',
  'Other'
];
function mergedDetails(a){
  return [...new Set([a.interest,a.notes].filter(Boolean))].join('\n');
}
function interestSummary(a){
  const reasons=(a.interestReasons||[]).map(reason=>reason==='Other'?(a.interestOther||'Other'):reason);
  return reasons.filter(Boolean).join(' · ');
}
function positionField(wrap){
  const label=make('label','Current position');
  label.className='main';label.htmlFor='f_position';
  const select=make('select');select.id=label.htmlFor;
  const enterTitle=make('option','Enter a job title');enterTitle.value='';
  const noWork='Not currently working';
  select.append(enterTitle,make('option',noWork));
  const previous=draft.a.position||'';
  const inactive=previous.trim().toLowerCase()===noWork.toLowerCase();
  select.value=inactive?noWork:'';
  const title=make('input');title.type='text';title.spellcheck=true;
  title.placeholder='Type the current job title';title.setAttribute('aria-label','Current job title');
  title.value=inactive?'':previous;
  title.hidden=inactive;
  title.oninput=()=>put('position',title.value);
  select.onchange=()=>{
    title.hidden=select.value===noWork;
    put('position',title.hidden?noWork:title.value);
    if(!title.hidden)title.focus();
  };
  wrap.append(label,select,title);
}
const industries=[
  'Accounting & tax services',
  'Agriculture & food production',
  'Arts, media & entertainment',
  'Automotive',
  'Banking, finance & insurance',
  'Construction & skilled trades',
  'Education & training',
  'Energy & utilities',
  'Engineering & architecture',
  'Government & public administration',
  'Health care',
  'Hospitality, tourism & food service',
  'Manufacturing',
  'Marketing, advertising & public relations',
  'Nonprofit & community services',
  'Professional services & consulting',
  'Real estate & property management',
  'Retail & wholesale',
  'Technology & telecommunications',
  'Transportation, logistics & warehousing'
];
function industryField(wrap){
  const label=make('label','Preferred industry');
  label.className='main';label.htmlFor='f_industry';
  const select=make('select');select.id=label.htmlFor;
  const placeholder=make('option','Choose an industry');placeholder.value='';
  select.append(placeholder);
  for(const name of ['No Preference',...industries,'Other'])select.append(make('option',name));

  const saved=draft.a.industry||'';
  const custom=!!saved&&saved!=='No Preference'&&saved!=='Other'&&!industries.includes(saved);
  select.value=custom?'Other':saved;
  const other=make('input');other.type='text';other.spellcheck=true;
  other.setAttribute('aria-label','Other preferred industry');other.placeholder='Type the industry';
  other.value=custom?saved:(draft.a.industry_other||'');
  other.hidden=select.value!=='Other';
  other.oninput=()=>{
    draft.a.industry='Other';
    put('industry_other',other.value);
  };
  select.onchange=()=>{
    other.hidden=select.value!=='Other';
    draft.a.industry_other=other.value;
    put('industry',select.value);
    if(!other.hidden)other.focus();
  };
  wrap.append(label,select,other);
}
function interestFields(wrap){
  wrap.classList.add('wide');
  const heading=make('span','Why are you interested in this role?');
  heading.className='label';heading.id='interest-heading';
  const menu=make('details');menu.className='interest-menu';
  const toggle=make('summary');toggle.setAttribute('aria-describedby',heading.id);
  const options=make('div');options.className='interest-options';
  const other=make('input');other.type='text';other.spellcheck=true;
  other.setAttribute('aria-label','Other reason');other.placeholder='Type the other reason';
  other.value=draft.a.interestOther||'';other.oninput=()=>put('interestOther',other.value);
  function refresh(){
    const chosen=draft.a.interestReasons||[];
    toggle.textContent=chosen.length?chosen.length+' selected · Change reasons':'Select one or more reasons';
    other.hidden=!chosen.includes('Other');
  }
  for(const reason of interestChoices){
    const lab=make('label');lab.className='chip';const box=make('input');
    box.type='checkbox';box.checked=(draft.a.interestReasons||[]).includes(reason);box.value=reason;
    box.onchange=()=>{
      put('interestReasons',[...options.querySelectorAll('input:checked')].map(input=>input.value));
      refresh();if(reason==='Other'&&box.checked)other.focus();
    };
    lab.append(box,document.createTextNode(reason));options.append(lab);
  }
  menu.append(toggle,options);wrap.append(heading,menu,other);
  refresh();
}
const deeperQuestions=[
  ['workProblem','Problem-solving','Tell me about a problem you faced at work. What did you do, and what happened as a result?'],
  ['teamExample','Teamwork','Tell me about a time you worked with others toward a shared goal. What was your part?'],
  ['communicationExample','Communication','Tell me about a time you had to explain something complicated. How did you check that the other person understood?'],
  ['disagreementExample','Handling disagreement','Tell me about a time you and a coworker disagreed about how to do something. How did you work through it?'],
  ['prioritiesExample','Managing priorities','Tell me about a time two important tasks were due at the same time. How did you decide what to do first?'],
  ['strengthExample','Strengths','What’s one strength you would bring to this role? Can you give me an example of when you used it?'],
  ['developmentExample','Area for improvement','What’s one skill you’re working to improve? What have you tried, and what progress have you noticed?'],
  ['workEnvironment','Work environment','What helped you do your best work in a previous role?'],
  ['employmentGap','Employment gap','Would you like to share any context about the time between these two roles?']
];
function askedPrompts(a){
  const selected=new Set(a.deeperSelected||[]);
  return deeperQuestions.filter(([key])=>selected.has(key)||String(a[key]||'').trim());
}
function recordingTakeaway(a,key){
  const text=String(a[key]||'').trim();
  return /^see (?:the )?(?:video |interview )?recording[.!]?$/i.test(text)?'':text;
}
function renderDeeperQuestions(root){
  const group=make('fieldset');group.append(make('legend','Deeper interview questions'));
  const hint=make('p','Choose a prompt when you ask it. It will be marked “See recording”. Add a short takeaway only if you want it considered for the review paragraphs.');
  hint.className='muted';
  const picker=make('select');picker.id='deeperPicker';picker.setAttribute('aria-label','Interview question prompts');
  picker.append(make('option','Choose a question you’re asking…'));picker.options[0].value='';
  const area=make('div');group.append(hint,picker,area);root.append(group);
  const chosen=new Set(askedPrompts(draft.a).map(([key])=>key));
  function addPrompt(key,label,prompt){
    const block=make('div');block.style.margin='12px 0';
    const title=make('strong',prompt);
    const status=make('p','Asked · See recording');status.className='muted';
    const detail=make('details'),toggle=make('summary','Add a short takeaway');
    const answer=make('textarea');answer.id='f_'+key;answer.setAttribute('aria-label',label+' takeaway');answer.spellcheck=true;
    answer.value=recordingTakeaway(draft.a,key);detail.open=!!answer.value;
    answer.oninput=()=>put(key,answer.value);
    detail.append(toggle,answer);
    const undo=make('button','Unmark question');undo.type='button';
    undo.onclick=()=>{
      if(answer.value.trim()&&!confirm('Remove this question and its takeaway?'))return;
      chosen.delete(key);delete draft.a[key];put('deeperSelected',[...chosen]);
      Array.from(picker.options).find(o=>o.value===key).disabled=false;block.remove();
    };
    block.append(title,status,detail,undo);area.append(block);
  }
  for(const [key,label,prompt] of deeperQuestions){
    const option=make('option',label+' — '+prompt);option.value=key;picker.append(option);
    if(chosen.has(key)){option.disabled=true;addPrompt(key,label,prompt);}
  }
  picker.onchange=()=>{
    const item=deeperQuestions.find(q=>q[0]===picker.value);if(!item)return;
    chosen.add(item[0]);put('deeperSelected',[...chosen]);picker.selectedOptions[0].disabled=true;picker.value='';
    addPrompt(...item);
  };
}
function renderRecordingPrompts(record){
  const panel=el('recordingPrompts'),list=el('askedList');
  const asked=askedPrompts(record?.a||{});panel.hidden=!asked.length;list.replaceChildren();
  for(const [key,label,prompt] of asked){
    const item=make('li');item.append(make('strong',label),document.createTextNode(' — '+prompt));
    item.append(make('div',recordingTakeaway(record.a,key)||'See recording'));list.append(item);
  }
}
function renderForm(){
  if(draft.a.interest){draft.a.notes=mergedDetails(draft.a);delete draft.a.interest;}
  const root=el('fields');root.replaceChildren();el('formTitle').textContent=draft.id?'Edit interview':'New interview';
for(const [title,items] of allGroups()){const fs=make('fieldset'),grid=make('div');grid.className='grid';fs.append(make('legend',title),grid);root.append(fs);
for(const [k,label,opts,mode] of items){const wrap=make('div');wrap.className='field';grid.append(wrap);
if(k==='salary'){salaryFields(wrap);continue;}
if(k==='position'){positionField(wrap);continue;}
if(k==='industry'){industryField(wrap);continue;}
if(k==='interest'){interestFields(wrap);continue;}
if(!opts){const lab=make('label',label+(k==='name'?' *':''));lab.htmlFor='f_'+k;lab.className='main';const inp=make(mode==='long'?'textarea':'input');if(mode!=='long')inp.type=k==='email'?'email':'text';inp.id=lab.htmlFor;inp.spellcheck=k!=='email';inp.required=k==='name';inp.value=draft.a[k]||'';inp.oninput=()=>put(k,inp.value);wrap.append(lab,inp);continue;}
const title=make('span',label);title.className='label';title.id='l_'+k;const chips=make('div');chips.className='choices';chips.setAttribute('role','group');chips.setAttribute('aria-labelledby',title.id);wrap.append(title,chips);
const other=make('input');other.type='text';other.placeholder='Add details';other.setAttribute('aria-label',label+' — other');other.spellcheck=true;other.value=draft.a[k+'_other']||'';other.oninput=()=>put(k+'_other',other.value);
for(const option of opts){const lab=make('label');lab.className='chip';const inp=make('input');inp.type=mode===true?'checkbox':'radio';inp.name=k;inp.value=option;const v=draft.a[k];inp.checked=Array.isArray(v)?v.includes(option):v===option;lab.append(inp,document.createTextNode(option));chips.append(lab);
inp.onchange=()=>{const chosen=[...chips.querySelectorAll('input:checked')].map(x=>x.value);put(k,mode===true?chosen:chosen[0]);other.hidden=!chosen.includes('Other');if(!other.hidden&&option==='Other')other.focus();};}
if(opts.includes('Other')){other.hidden=!(draft.a[k]||[]).includes('Other');wrap.append(other);}
}}
  renderDeeperQuestions(root);
  if(window.enhanceForm)window.enhanceForm();
 window.GuhuzaUI?.decorate();
}
let reviewScope="own";
function personalRecords(){return records().filter(r=>window.GuhuzaRecordAccess?.owns(r.id));}
function scopedRecords(){return reviewScope==="team"&&window.GuhuzaRecordAccess?.canViewAll()?records():personalRecords();}
function records(){if(!available)return [];return [...cache.keys()].filter(k=>k.startsWith(recKey)).map(k=>load(k,null)).filter(Boolean).sort((a,b)=>b.created.localeCompare(a.created));}
function getCurrent(){return current?load(recKey+current,null):null;}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);}
function display(a,k){if(k==='notes')return mergedDetails(a);if(k==='interest')return interestSummary(a);if(k==='salary')return salarySummary(a);const v=a[k];return (Array.isArray(v)?v:[v]).filter(Boolean).map(x=>x==='Other'&&a[k+'_other']?a[k+'_other']:x).join(', ');}
function rows(r){const a=r.a;const pairs=[['Job ID','job'],['Who is interviewing?','interviewer'],['Current position / resume check','position','resume'],['Location','location'],['Work location / commute','area','travel'],['Car or public transit','transit'],['Reason for looking / leaving','reason'],['Notice period','notice'],['Employment type wanted','employment'],['Preferred work setup','setup'],['Preferred company size','size'],['Preferred industry','industry'],['Other interviews','otherinterviews','interviewdetails'],['Salary expectations','salary'],['Why interested in this role?','interest'],['Additional Details','notes'],...prefs.extra.map(q=>[q.label,q.id])];return pairs.map(([l,...ks])=>[l,ks.map(k=>display(a,k)).filter(Boolean).join(' · ')]);}
function renderContact(record){
  const panel=el('candidateContact'),values=el('contactValues'),status=el('contactStatus');
  panel.hidden=!record;
  values.replaceChildren();
  status.textContent='';
  const copyAll=el('copyContact');
  copyAll.onclick=null;
  if(!record)return;
  const firstName=(record.a.name||'').trim().split(/\s+/,1)[0];
  const fields=[['First name',firstName],['Position applied for',record.a.role],['Email',record.a.email]];
  const available=[];
  async function copyValue(text,message){
    const copied=await copyString(text);
    if(current!==record.id)return;
    status.textContent=copied?message:'Select the contact text and copy it manually.';
  }
  for(const [label,raw] of fields){
    const value=(raw||'').trim();
    const line=make('div');line.className='contact-line';
    const entry=make('div');
    entry.append(make('strong',label),make('span',value||'Not entered'));
    const button=make('button','Copy');button.type='button';
    button.setAttribute('aria-label','Copy '+label.toLowerCase());button.disabled=!value;
    button.onclick=()=>copyValue(value,label+' copied.');
    line.append(entry,button);values.append(line);
    if(value)available.push(value);
  }
  copyAll.textContent=available.length===3?'Copy all three':'Copy contact details';
  copyAll.disabled=!available.length;
  copyAll.onclick=()=>copyValue(available.join('\n'),'Contact details copied.');
}
const defaultSurveyUrl=el('openSurvey').href;
function surveyAddress(value){
  try{const url=new URL(value);return url.protocol==='https:'?url.href:'';}catch{return '';}
}
function renderSurvey(record){
  const url=surveyAddress(prefs.surveyUrl)||defaultSurveyUrl;
  el('openSurvey').href=url;el('surveyUrl').value=url;
  el('surveyStatus').hidden=!record;el('surveyDone').checked=!!record?.surveyCompleted;
}
el('surveyLinkForm').onsubmit=e=>{
  e.preventDefault();const field=el('surveyUrl'),url=surveyAddress(field.value.trim());
  if(!url){field.setCustomValidity('Enter a survey link beginning with https://');field.reportValidity();return;}
  const updated={...prefs,surveyUrl:url};
  if(!persist(prefix+'prefs',updated))return;
  prefs=updated;renderSurvey(getCurrent());el('surveySettings').open=false;
};
el('surveyUrl').oninput=e=>e.target.setCustomValidity('');
el('surveyDone').onchange=e=>{
  const r=getCurrent();if(!r)return;
  r.surveyCompleted=e.target.checked;
  if(!persist(recKey+r.id,r))e.target.checked=!e.target.checked;
};
function renderReview(){if(el("reviewScopeLabel"))el("reviewScopeLabel").textContent=reviewScope==="team"?"Team interview view. Return to Saved interviews for your own records.":"Your own interviews";const list=scopedRecords(),pick=el('pick');pick.replaceChildren();if(!list.some(r=>r.id===current))current=list[0]?.id||'';
// Records are sorted newest-first by their initial save date. Keep groups in that order,
// and keep each group's interviews newest-first as well.
const grouped=new Map();
for(const r of list){
  const role=String(r.a.role||'').trim();
  const job=String(r.a.job||'').trim();
  const key=job?'job:'+job.toLocaleLowerCase():'role:'+role.toLocaleLowerCase();
  if(!grouped.has(key))grouped.set(key,{role,job,items:[]});
  grouped.get(key).items.push(r);
}
for(const group of grouped.values()){
  const heading=[group.role||'Position not specified',group.job].filter(Boolean).join(' · ');
  const section=make('optgroup');section.label=heading;
  for(const r of group.items){
    const d=window.GuhuzaBacklogParser?GuhuzaBacklogParser.eventDate(r):new Date(r.created);
    const date=Number.isNaN(d.getTime())?'Date unavailable':d.toLocaleString('en-CA',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    const o=make('option',[r.a.name||'Candidate not specified',date].join(' · '));
    o.value=r.id;section.append(o);
  }
  pick.append(section);
}
pick.value=current;pick.disabled=!current;el('deleteInterview').hidden=!current;el('empty').hidden=!!current;el('views').hidden=!current;el('tableView').hidden=!current;el('textView').hidden=!current;const r=getCurrent();renderSurvey(r);renderContact(r);renderRecordingPrompts(r);setReviewOwner(r);if(!r)return;
const table=make('table'),top=make('tr');top.append(make('th','Name: '+r.a.name),make('th','Position: '+(r.a.role||'')));table.append(top);const lines=rows(r);for(const [k,v] of lines){const tr=make('tr');tr.append(make('td',k),make('td',v));table.append(tr);}el('table').replaceChildren(table);
el('plain').value=[['Name',r.a.name],['Position',r.a.role],...lines].filter(z=>z[1]).map(z=>z[0]+': '+z[1]).join('\n');
el('checks').replaceChildren();prefs.dest.forEach((name,i)=>{const lab=make('label');lab.className='chip';const c=make('input');c.type='checkbox';c.checked=!!r.copied[i];c.onchange=()=>{const live=getCurrent();live.copied[i]=c.checked;if(!persist(recKey+live.id,live))c.checked=!c.checked;};lab.append(c,document.createTextNode(name));el('checks').append(lab);});}
function trackerState(r){
  const flags=Array.from({length:3},(_,i)=>!!r.copied?.[i]);
  const done=flags.filter(Boolean).length;
  return {flags,done,state:done===3?'complete':done===0?'notstarted':'inprogress'};
}
function renderTracker(){
  const all=personalRecords(),filter=el('trackerFilter').value,query=el('trackerSearch').value.trim().toLocaleLowerCase();
  const totals={complete:0,outstanding:0};
  for(const r of all){const state=trackerState(r).state;if(state==='complete')totals.complete++;else totals.outstanding++;}
  el('trackerTotal').textContent=String(all.length);
  el('trackerOutstanding').textContent=String(totals.outstanding);
  el('trackerComplete').textContent=String(totals.complete);
  for(let i=0;i<3;i++)el('trackerDest'+i).textContent=prefs.dest[i]||'Follow-up task '+(i+1);
  const matching=all.filter(r=>{
    const state=trackerState(r).state;
    if(filter==='outstanding'&&state==='complete')return false;
    if(['complete','inprogress','notstarted'].includes(filter)&&filter!==state)return false;
    return !query||[r.a.name,r.a.role,r.a.job].some(v=>String(v||'').toLocaleLowerCase().includes(query));
  });
  const body=el('trackerRows');body.replaceChildren();
  for(const r of matching){
    const tr=make('tr'),name=make('td'),open=make('button',r.a.name||'Candidate not specified');
    open.type='button';open.title='Open saved interview for '+(r.a.name||'candidate');
    open.onclick=()=>{current=r.id;el('result').textContent='';tab(true);};
    name.append(open);tr.append(name);
    tr.append(make('td',[r.a.role||'Position not specified',r.a.job?('Job ID '+r.a.job):''].filter(Boolean).join(' · ')));
    const date=new Date(r.created),when=Number.isNaN(date.getTime())?'Date unavailable':date.toLocaleString('en-CA',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    const dateCell=make('td',when);dateCell.className='tracker-date';tr.append(dateCell);
    for(let i=0;i<3;i++){
      const cell=make('td'),label=make('label'),check=make('input');cell.className='tracker-check';check.type='checkbox';
      check.checked=!!r.copied?.[i];check.setAttribute('aria-label',(prefs.dest[i]||'Task '+(i+1))+' for '+(r.a.name||'candidate'));
      check.onchange=()=>{
        const latest=load(recKey+r.id,null);
        if(!latest){el('trackerMessage').textContent='This interview is no longer saved. Refreshing the tracker.';renderTracker();return;}
        const copied=Array.isArray(latest.copied)?[...latest.copied]:[false,false,false];
        copied[i]=check.checked;latest.copied=copied;
        if(!persist(recKey+latest.id,latest)){check.checked=!check.checked;el('trackerMessage').textContent='Could not save that update. Download a backup and check browser storage.';return;}
        el('trackerMessage').textContent=(prefs.dest[i]||'Task')+' marked '+(check.checked?'complete':'outstanding')+' for '+(latest.a.name||'candidate')+'.';
        renderTracker();
      };
      label.append(check);cell.append(label);tr.append(cell);
    }
    const state=trackerState(r).state;
    const status=make('td'),pill=make('span',state==='complete'?'Complete':state==='inprogress'?'In progress':'Not started');
    pill.className='task-state '+(state==='complete'?'complete':state==='inprogress'?'progress':'');status.append(pill);tr.append(status);body.append(tr);
  }
  el('trackerEmpty').hidden=matching.length!==0;
  el('trackerEmpty').textContent=all.length?'No interviews match the current filter or search.':'No saved interviews yet. Save an interview or restore your backup to see it here.';
}
function tab(view){
 window.GuhuzaUI?.show(view===true?"saved":view==="tracker"?"status":"form");
 if(el("adminPanel"))el("adminPanel").hidden=true;
  const saved=view===true||view==='review',status=view==='tracker';
  if(!saved)endSpeech();
  el('capture').hidden=saved||status;el('review').hidden=!saved;el('tracker').hidden=!status;
  el('liveTab').setAttribute('aria-selected',String(!saved&&!status));
  el('savedTab').setAttribute('aria-selected',String(saved));
  el('statusTab').setAttribute('aria-selected',String(status));
  if(saved)renderReview();else if(status)renderTracker();window.scrollTo(0,0);
}
function save(view){if(!el('form').reportValidity())return;if(!draft.a.name.trim()){el('f_name').focus();return;}const old=draft.id?load(recKey+draft.id,null):null;const r={...(old||{}),id:draft.id||uid(),created:old?.created||new Date().toISOString(),a:{...draft.a,name:draft.a.name.trim()},review:old?.review||{},surveyCompleted:!!old?.surveyCompleted,copied:old?.copied||[false,false,false]};if(old?.review && JSON.stringify(old.a)!==JSON.stringify(r.a))r.review.needsUpdate=true;if(!persist(recKey+r.id,r))return;current=r.id;draft={a:{interviewer:window.portalProfile?.display_name||''}};persist(prefix+'draft',draft);renderForm();tab(view);el(view?'result':'draftStatus').textContent='Interview queued for '+r.a.name+'. Check the shared database status above.';if(!view)el('f_name').focus();}
el('form').onsubmit=e=>{e.preventDefault();save(false)};el('saveView').onclick=()=>save(true);el('liveTab').onclick=()=>tab(false);el('savedTab').onclick=()=>{reviewScope='own';tab(true);};el('statusTab').onclick=()=>{reviewScope='own';tab('tracker');};el('trackerFilter').onchange=renderTracker;el('trackerSearch').oninput=renderTracker;el('pick').onchange=e=>{current=e.target.value;el('result').textContent='';renderReview();};
el('deleteInterview').onclick=async()=>{const r=getCurrent();if(!r||!confirm('Delete this interview from shared storage?'))return;try{await window.portalDelete(r.id);cache.delete(recKey+r.id);current='';renderReview();}catch(e){warn(e.message);}};
el('edit').onclick=()=>{if(Object.entries(draft.a).some(([k,v])=>k!=='interviewer'&&String(v).trim())&&!confirm('Replace the current draft with this saved interview?'))return;const r=getCurrent();draft={id:r.id,a:{...r.a}};persist(prefix+'draft',draft);renderForm();tab(false);};
async function copy(rich){const t=el('table').firstElementChild,p=el('plain');const plain=rich?[...t.rows].map(row=>[...row.cells].map(c=>c.textContent.replace(/[\t\r\n]+/g,' ')).join('\t')).join('\n'):p.value;
const styled=t.cloneNode(true);styled.querySelectorAll('th,td').forEach(c=>c.style.cssText='border:1px solid #bccbc2;padding:5px;text-align:left;'+(c.tagName==='TH'?'background:#32ec4a;':''));const html=styled.outerHTML;
try{if(rich)await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);else await navigator.clipboard.writeText(plain);}catch{if(rich){const range=document.createRange();range.selectNodeContents(t);const s=getSelection();s.removeAllRanges();s.addRange(range);}else p.select();if(!document.execCommand('copy')){el('result').textContent='The notes are selected. Right-click and choose Copy.';return;}}el('result').textContent=rich?'Table copied.':'All notes copied.';}
el('copyTable').onclick=()=>copy(true);el('copyText').onclick=()=>copy(false);
function settings(){el('destNames').replaceChildren();prefs.dest.forEach((n,i)=>{const x=make('input');x.type='text';x.value=n;x.setAttribute('aria-label','Destination '+(i+1));x.onchange=()=>{prefs.dest[i]=x.value.trim()||'Destination '+(i+1);persist(prefix+'prefs',prefs);if(!el('review').hidden)renderReview();if(!el('tracker').hidden)renderTracker();};el('destNames').append(x);});el('customList').textContent=prefs.extra.map(q=>q.label).join(' · ');}
el('add').onclick=()=>{const name=el('custom').value.trim();if(!name)return;prefs.extra.push({id:'custom_'+uid(),label:name});persist(prefix+'prefs',prefs);el('custom').value='';settings();renderForm();if(!el('review').hidden)renderReview();};
el('backup').onclick=()=>{const data={version:1,records:records(),prefs,draft};const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=make('a');a.href=url;a.download='Guhuza-interviews-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
el('restore').onclick=()=>el('file').click();
el('file').onchange=async e=>{try{if(!window.portalProfile?.is_admin)throw Error('Admin access required');const data=JSON.parse(await e.target.files[0].text());if(data.version!==1||!Array.isArray(data.records)||!Array.isArray(data.prefs?.extra)||!Array.isArray(data.prefs?.dest)||data.prefs.dest.length!==3||!data.prefs.dest.every(x=>typeof x==='string')||!data.prefs.extra.every(x=>typeof x?.id==='string'&&typeof x.label==='string')||!data.records.every(r=>typeof r.id==='string'&&typeof r.a?.name==='string'&&typeof r.created==='string'&&Array.isArray(r.copied)))throw Error();
let added=0;for(const r of data.records){if(!load(recKey+r.id,null)){if(!persist(recKey+r.id,r))throw Error();added++;}}prefs.extra=[...new Map([...data.prefs.extra,...prefs.extra].map(q=>[q.id,q])).values()];if(prefs.dest.every((x,i)=>x==='Destination '+(i+1)))prefs.dest=data.prefs.dest;if(!prefs.surveyUrl&&surveyAddress(data.prefs.surveyUrl))prefs.surveyUrl=data.prefs.surveyUrl;persist(prefix+'prefs',prefs);
if(data.draft?.a&&!draft.id&&!Object.keys(draft.a).some(k=>k!=='interviewer')){draft=data.draft;persist(prefix+'draft',draft);}
settings();renderForm();tab(true);el('prefsStatus').textContent='Queued '+added+' imported interviews. Check the shared database status above.';}catch{el('prefsStatus').textContent='Restore failed. Choose a backup downloaded from this interview form.';}e.target.value='';};
const STOP=new Set(('a an the to on in into at from with for by as of or and is are our their your you we will would may can must should able ability required requires requirement requirements preferred desirable desired plus including include includes looking seeking proven strong excellent outstanding demonstrated demonstrable experienced experience expertise knowledge skills skill relevant related years year minimum at least working work role position successful candidate candidates job responsible responsibilities responsibility qualifications qualification duties day tasks ability proficiency proficient familiarity familiar environment team company organization opportunity join help support ensure other assigned professional prior previous industry').split(' '));
const OMIT=/\b(equal opportunity|without regard|race|ethnicity|religion|marital status|gender|national origin|sexual orientation|date of birth|disability|citizenship|age discrimination|protected veteran|compensation|salary range|apply online|send your r[eé]sum[eé]|we offer|our benefits)\b/i;
const WORK=/\b(prepare|develop|manage|coordinate|process|implement|maintain|operate|monitor|analy[sz]e|design|reconcile|schedule|deliver|handle|supervise|build|test|troubleshoot|experience|proficien\w*|certifi\w*|degree|diploma|skilled|licen[cs]e|must|knowledge|ability|familiarity|expertise|responsible|track|administer|support|assess|write|audit)\b/i;
const HEADS=/^(?:key |essential |minimum |required |preferred |core |job |main )?(?:responsibilities|requirements|qualifications|skills|duties|competencies|experience|about the role|what you.ll (?:do|bring)|what you will (?:do|bring)|what we.re looking for|who you are)(?:\s*[:：]\s*|$)/i;
const SKIPHEAD=/^(?:about (?:us|the company)|benefits|what we offer|how to apply|compensation|equal opportunity|who we are|why join us)(?:\s*[:：]|$)/i;
const aliases=[
  [/\bprocess(?:ed|es|ing)?\b/g,'process'],[/\bmaintain(?:ed|s|ing)?\b/g,'maintain'],[/\bprepar(?:e|ed|es|ing|ation)\b/g,'prepare'],[/\bimplement(?:ed|s|ing|ation)?\b/g,'implement'],
 [/\b(?:ms |microsoft )?excel\b/g,'excel'],[/\b(?:quickbooks(?: online)?|qbo)\b/g,'quickbooks'],
 [/\b(?:accounts? payable|a\/p)\b/g,'accounts-payable'],[/\b(?:accounts? receivable|a\/r)\b/g,'accounts-receivable'],
 [/\b(?:customer relationship management|crm)\b/g,'crm'],[/\b(?:electronic (?:medical|health) records?|emr|ehr)\b/g,'ehr'],
 [/\b(?:human resources|hr)\b/g,'human-resources'],[/\b(?:bookkeeping|bookkeeper)\b/g,'bookkeeping'],
 [/\b(?:scheduling|scheduled|schedules)\b/g,'schedule'],[/\b(?:bank )?reconciliations?\b|\breconcil(?:e|ed|ing)\b/g,'reconcile'],
 [/\b(?:analyses|analysis|analy[sz](?:e|ed|ing))\b/g,'analysis'],[/\b(?:administration|administrative|administrator)\b/g,'administration'],
 [/\b(?:manager|managing|managed|management)\b/g,'manage'],[/\b(?:coordinating|coordinated|coordination|coordinator)\b/g,'coordinate'],
 [/\b(?:supervising|supervised|supervision|supervisor)\b/g,'supervise'],[/\b(?:invoicing|invoiced|invoices)\b/g,'invoice'],
 [/\b(?:microsoft |ms )?office(?: suite)?\b/g,'office'],[/\b(?:first aid|first-aid)\b/g,'first-aid']
];
function terms(line){
  let s=line.toLowerCase().normalize('NFKC');
  for(const [pattern,term] of aliases)s=s.replace(pattern,term);
  return new Set((s.match(/[a-z][a-z0-9+#./-]*/g)||[]).map(v=>v.replace(/[./-]+$/,'')).filter(v=>!STOP.has(v)&&v.length>1).map(v=>v.length>4?v.replace(/ies$/,'y').replace(/(?<!s)s$/,''):v));
}
function splitDocument(text){return text.replace(/\r/g,'').split(/[\n•▪●]+|\s+[–—]\s+|[;]+|(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.replace(/^\s*[-*]+\s*/,'').trim()).filter(Boolean);}
function postingCriteria(text){
  let group='intro';const found=[],seen=new Set();
  for(let line of splitDocument(text)){
    if(SKIPHEAD.test(line)){group='skip';continue;}
    const h=line.match(HEADS);if(h){group='requirements';line=line.slice(h[0].length).trim();if(!line)continue;}
    if(group==='skip'||OMIT.test(line)||line.length<2||line.length>700||seen.has(line.toLowerCase()))continue;
    if(group==='requirements'||WORK.test(line)||/^[-*•]/.test(line)){if(terms(line).size){seen.add(line.toLowerCase());found.push(line);}}
  }
  return found;
}
function compareDocuments(resume,job){
  const requirements=postingCriteria(job);
  if(!requirements.length)throw Error('No clear requirements were found. Under “Paste or check document text”, enter the posting’s responsibilities or requirements, one per line below a Requirements heading.');
  const evidence=splitDocument(resume).filter(s=>s.length>=2&&!OMIT.test(s)&&!/@|https?:\/\//i.test(s)).map(text=>({text,tokens:terms(text)}));
  const findings=requirements.map(requirement=>{
    const tokens=terms(requirement);
    let best=null,coverage=0;
    for(const e of evidence){
      const shared=[...tokens].filter(t=>e.tokens.has(t)).length;
      const ratio=shared/tokens.size;
      if(ratio>coverage || (ratio===coverage&&shared&&best&&e.text.length<best.text.length)){best=e;coverage=ratio;}
    }
    const exact=coverage>=0.72;
    const verify=/\d|\blicen[cs]|\bcertif|\bdegree|\bdiploma|\bfluen|\bclearance/i.test(requirement)||/\b(no|not|never|lack(?:s|ing)?|without|unfamiliar|limited)\b/i.test(best?.text||'');
    const status=exact&&!verify?'Related evidence':coverage>=0.32?'Check details':'No close wording found';
    return {requirement,status,excerpt:coverage>=0.32?best.text:''};
  });
  const supported=findings.filter(f=>f.status==='Related evidence').length;
  const headline=findings.length<2?'Limited basis for comparison':supported/findings.length>=.75?'Strong documented overlap':supported?'Partial documented overlap':'Little directly matching wording';
  return {findings,headline,supported};
}
function sentence(value){return value.trim().replace(/[.!?;:,\s]+$/,'')+'.';}
function excerpt(value){return value.trim().replace(/[.!?;:,\s]+$/,'');}
function safeEvidenceFragment(value, max=145){
  let t=String(value||'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').replace(/^[•\-:;,\s]+/,'').trim();
  t=t.replace(/\b(?:I|my|me)\b/gi,match=>match).replace(/[.!?;:,\s]+$/,'');
  if(t.length>max)t=t.slice(0,max).replace(/\s+\S*$/,'').trim();
  return t;
}
// Role Fit drafts are written as complete recruiter sentences, not as quoted
// form answers or raw résumé excerpts. NPA drafting remains unchanged.
function fitCleanPhrase(value,limit=245){
  const t=String(value||'').replace(/[“”"‘’]/g,'').replace(/^[\s*•\-–:;]+/,'')
    .replace(/\s+/g,' ').replace(/[.!?;:,\s]+$/,'').trim();
  // Do not cut someone’s words in the middle of a thought.
  if(!t||t.length>limit||/@|https?:\/\/|\b\d{3}[- )]+\d{3}[- ]\d{4}\b/i.test(t))return '';
  return t;
}
function fitSentence(value){
  const t=String(value||'').trim().replace(/[.!?;:,\s]+$/,'');
  return t?t+'.':'';
}
function fitObservationSentence(value){
  const source=String(value||'').split(/(?<=[.!?])\s+|[\r\n]+/)
    .map(v=>fitCleanPhrase(v,240))
    .find(v=>v&&!/\b(?:salary|pay rate|compensation|notice period|phone number|email address|date of birth|disability)\b/i.test(v));
  if(!source)return '';
  const v=source.replace(/^candidate\b/i,'the candidate');
  if(/^(?:I|we|my|the candidate|they|she|he)\b/i.test(v))return fitSentence(v[0].toUpperCase()+v.slice(1));
  if(/^(?:demonstrated|showed|communicated|discussed|highlighted|explained|provided|displayed)\b/i.test(v))
    return fitSentence('During the interview, the candidate '+v[0].toLowerCase()+v.slice(1));
  if(/^(?:friendly|approachable|professional|engaged|thoughtful|confident|enthusiastic|positive|collaborative|organized|motivated|reliable|adaptable)(?:\b|,)/i.test(v))
    return fitSentence('During the interview, the candidate came across as '+v.toLowerCase());
  if(/^(?:good|strong|clear|excellent|limited|little|no)\b/i.test(v))
    return fitSentence('During the interview, I noted '+v.toLowerCase());
  if(/^(?:has|had|was|were|is|are|can|could|would|needs|lacks?)\b/i.test(v))
    return fitSentence('The candidate '+v[0].toLowerCase()+v.slice(1));
  // For shorthand, describe it explicitly as an observation, not as a quoted answer.
  return fitSentence('My interview notes highlight '+v[0].toLowerCase()+v.slice(1));
}
function fitResumeSentence(value){
  const v=fitCleanPhrase(value,215);
  if(!v||/\b(?:salary|phone|email|address|date of birth|marital status)\b/i.test(v))return '';
  const lower=v[0].toLowerCase()+v.slice(1);
  if(/^experience\s+(?:in|with|using|across|of)\b/i.test(v))
    return fitSentence('The résumé documents '+lower);
  if(/^\d+\+?\s+years?\b/i.test(v))
    return fitSentence('The résumé records '+lower+'');
  if(/^proficient\s+(?:in|with)\b/i.test(v))
    return fitSentence('The résumé indicates proficiency '+v.replace(/^proficient\s+/i,''));
  if(/^skilled\s+(?:in|with|at)\b/i.test(v))
    return fitSentence('The résumé identifies skills '+v.replace(/^skilled\s+/i,''));
  if(/^responsible for\b/i.test(v))
    return fitSentence('The résumé describes responsibilities involving '+v.replace(/^responsible for\s+/i,'').replace(/^the\s+/i,''));
  if(/^(?:managed|led|developed|built|coordinated|created|maintained|oversaw|organized|supported|implemented|provided|delivered|handled|assisted|trained|prepared|conducted|designed|analyzed|processed|operated|worked|supervised|collaborated|administered|resolved|improved)\b/i.test(v))
    return fitSentence('The résumé indicates that the candidate has '+lower);
  if(/^(?:worked as|worked in)\b/i.test(v))
    return fitSentence('The résumé describes experience that includes '+lower.replace(/^worked\s+/i,'work '));
  if(/^(?:the candidate|they|she|he)\s+(?:has|have|managed|worked|developed|led|handled|supported|performed)\b/i.test(v))
    return fitSentence('According to the résumé, '+lower);
  // Preserve the evidence but avoid turning an unknown résumé fragment into a claim.
  if(v.length<95 && !/[,:;]$/.test(v) && !/\b(?:and|or|with|for|to|the|a|an|of|in)\s*$/i.test(v))
    return fitSentence('The résumé also references '+lower);
  return '';
}
function fitInterestSentences(answers){
  const relevant=answers.filter(x=>x.key==='interest'||x.key==='industry');
  if(!relevant.length)return [];
  const rendered=npaInterests(relevant);
  if(rendered)return rendered.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,2);
  const industry=relevant.find(x=>x.key==='industry');
  const v=fitCleanPhrase(industry?.value,85);
  if(v&&/^(?:open|any|no preference)$/i.test(v))return ['They are open to opportunities across different industries.'];
  return [];
}
// Decide the recommendation from documented job requirements, not from a
// generic optimistic default. 'Not documented' is NOT the same as 'unqualified'.
function fitIsPreferred(requirement){
  return /\b(?:preferred|desirable|nice[ -]to[ -]have|bonus|an asset|would be (?:an? )?asset|would be a plus|advantageous)\b/i.test(requirement)
    && !/\b(?:required|essential|mandatory|must|required to)\b/i.test(requirement);
}
function fitRequirementExample(value){
  const text=fitCleanPhrase(value,195).replace(/^(?:requirements?|qualifications?|preferred|essential|minimum|mandatory)\s*:\s*/i,'');
  if(!text)return '';
  const cleaned=text.replace(/^(?:must (?:have|possess)|need(?:s)? to have|required to have|should have)\s+/i,'')
    .replace(/^must be able to\s+/i,'the ability to ');
  if(!cleaned)return '';
  return /^(?:QuickBooks|Excel|Microsoft|AZ|CDL|SQL|CPA|CPR|AWS)\b/.test(cleaned)?cleaned:cleaned[0].toLowerCase()+cleaned.slice(1);
}
function fitRequirementGap(findings){
  const gaps=findings.filter(f=>f.status!=='Related evidence')
    .map(f=>fitRequirementExample(f.requirement)).filter(Boolean).slice(0,2);
  if(!gaps.length)return '';
  return gaps.length===1
    ? 'The résumé does not clearly document a stated requirement: '+gaps[0]+'.'
    : 'The résumé does not clearly document some stated requirements, including '+gaps.join(' and ')+'.';
}
function draftParagraph(review){
  const {analysis,view,notes,roleNotes,answers=[]}=review;
  const all=analysis?.findings||[];
  const essential=all.filter(f=>!fitIsPreferred(f.requirement));
  const examined=essential.length?essential:all;
  const documented=examined.filter(f=>f.status==='Related evidence');
  const partial=examined.filter(f=>f.status==='Check details');
  const gaps=examined.filter(f=>f.status!=='Related evidence');
  const close=(documented.length+partial.length)/Math.max(examined.length,1);
  const clear=documented.length/Math.max(examined.length,1);
  const haveDocs=all.length>0;
  // A word match is only preliminary evidence. It cannot prove a qualification.
  const apparentAlignment=haveDocs&&clear>=0.7&&close>=0.8;
  const limitedAlignment=haveDocs&&(close<0.5||(!documented.length&&close<0.75));
  const criticalGap=gaps.some(f=>/\b(?:must|required|mandatory|essential|minimum|at least|licen[cs]e|certif(?:ication|icate|ied)|degree|diploma|clearance|fluen(?:t|cy))\b|\b\d+\s*\+?\s*years?\b/i.test(f.requirement));
  const explicitNegative=view==='weak'||view==='concerns';
  const lines=[];

  if(haveDocs){
    if(explicitNegative){
      lines.push(view==='weak'
        ?'Based on the résumé, job description and interview assessment, I would not recommend advancing this candidate for this particular position at this stage.'
        :'Based on the résumé, job description and interview assessment, I have concerns about recommending this candidate for this particular position.');
    }else if(limitedAlignment||criticalGap){
      lines.push('Based on the résumé and job description, I would not currently recommend advancing this candidate for this particular position because the key requirements are not sufficiently demonstrated in the available documentation.');
    }else if(apparentAlignment){
      lines.push('The résumé provides evidence of experience relevant to several of the position’s main requirements, making the candidate worth considering for further review.');
    }else{
      lines.push('The résumé shows some relevant experience, but does not yet establish sufficient alignment with the position’s main requirements for a positive recommendation.');
    }
  }else if(view==='weak'){
    lines.push('Based on the interview assessment, I would not currently recommend this candidate for the specific position.');
  }else if(view==='concerns'){
    lines.push('My interview assessment raises concerns about the candidate’s alignment with this specific position.');
  }else if(view==='strong'||view==='possible'){
    lines.push('The interview suggests potential for this role, but a comparison of the résumé with the job requirements is needed before making a position recommendation.');
  }else{
    lines.push('There is not enough role-specific evidence available yet to recommend the candidate for this particular position.');
  }

  const relevantExample=all.filter(f=>f.status==='Related evidence'&&f.excerpt)
    .map(f=>fitResumeSentence(f.excerpt)).find(Boolean);
  if(relevantExample)lines.push(relevantExample);
  else if(haveDocs&&partial.length)
    lines.push('Some wording in the résumé appears related to the posting, but the available details do not establish the required depth of experience or qualifications.');

  // State concrete missing documentation without claiming the person lacks a skill.
  if(haveDocs&&gaps.length){
    const gapText=fitRequirementGap(gaps);
    if(gapText)lines.push(gapText);
  }

  // Both kinds of observation can contribute; the role-specific note takes priority.
  const roleObservation=fitObservationSentence(roleNotes);
  const overallObservation=fitObservationSentence(notes);
  if(roleObservation)lines.push(roleObservation);
  if(overallObservation&&overallObservation!==roleObservation&&lines.length<5)lines.push(overallObservation);

  if(lines.length<3&&haveDocs){
    if(gaps.length)lines.push('The missing evidence should be clarified before reconsidering the recommendation; the absence of documentation does not by itself establish that the candidate lacks those skills.');
    else lines.push('A recruiter should still confirm the precise scope of the candidate’s experience against the position’s requirements.');
  }else if(lines.length<3&&!haveDocs){
    const interests=fitInterestSentences(answers);
    if(interests.length)lines.push(interests[0]);
    lines.push('The résumé and job description would be needed to confirm whether the candidate meets the role’s essential requirements.');
  }
  // Avoid a generic positive conclusion when documentation of essentials is absent.
  return lines.slice(0,5).join(' ').replace(/\s+/g,' ').trim();
}
const resumeHeading=/^(professional summary|profile|summary|objective|skills(?: and tools)?|technical skills|core competencies|qualifications|education(?: and certifications)?|training|certifications?|professional experience|employment(?: history)?|work experience|experience|projects|references|contact(?: information)?)\b\s*:?\s*/i;
function profileEvidence(text){
  const groups={summary:[],skills:[],education:[],work:[]};let section='';
  for(let line of splitDocument(text)){
    if(line.length>700||OMIT.test(line)||/@|https?:\/\/|\b\d{3}[- )]+\d{3}[- ]\d{4}\b/i.test(line))continue;
    const h=line.match(resumeHeading);
    if(h){const heading=h[1].toLowerCase();section=/reference|contact|objective/.test(heading)?'skip':/skill|competenc/.test(heading)?'skills':/education|training|certif|qualifications/.test(heading)?'education':/summary|profile/.test(heading)?'summary':'work';line=line.slice(h[0].length).trim();}
    if(!line||section==='skip')continue;
    const bucket=section||(/\b(bachelor|master|diploma|certificate|degree)\b/i.test(line)?'education':/\b\w+(?:ed|ing)\b|years? of experience/i.test(line)?'work':'');
    if(bucket && line.length>=3 && !groups[bucket].includes(line))groups[bucket].push(line);
  }
  return groups;
}
const NPA_EXCLUDE=/\b(?:salary|compensation|pay rate|per hour|notice period|available immediately|employment status|laid off|layoff|unemployed|not working|not currently working|terminated|fired|visa|citizenship|marital|children|age|birth|health|disability|commute|transportation|relocation|not a fit|weakness|concern|struggle|lacks?|unable|poor|negative|did not|does not|cannot|can.t|unsure|uncertain|not interested|not)\b/i;
function safeNPAItem(value){
  // Preserve complete résumé statements. Cutting at an arbitrary character count
  // previously produced fragments such as "transforming organizational".
  const t=String(value||'').replace(/[\r\n]+/,' ').replace(/\s+/g,' ').replace(/^[•*\-:;,\s]+/,'').replace(/[.;,\s]+$/,'').trim();
  if(!t||t.length>290||NPA_EXCLUDE.test(t)||/@|https?:\/\/|\b\d{3}[- )]+\d{3}[- ]\d{4}\b/i.test(t))return '';
  return t;
}
function npaComplete(value){
  const t=safeNPAItem(value);
  if(!t||/^\d{4}(?:\s*[-–]\s*\d{4})?$/.test(t)||/^(?:summary|education|work experience|professional experience|skills|projects)$/i.test(t))return '';
  // Do not turn an incomplete résumé bullet into a confident claim.
  if(/\b(?:and|or|of|in|for|with|at|on|to|the|a|an|including|such as|organizational|professional|technical|strategic|operational|different|various|multiple|across|transforming)\s*$/i.test(t))return '';
  if(/[,:;–—-]\s*$/.test(t)||/\b(?:etc|other)\s*$/i.test(t))return '';
  return t;
}
function npaJoin(items){
  const a=items.filter(Boolean);
  return a.length<2?(a[0]||''):a.length===2?a.join(' and '):a.slice(0,-1).join(', ')+', and '+a[a.length-1];
}
function npaEducation(group){
  const education=group.education.map(npaComplete).filter(Boolean);
  const school=education.find(x=>/\b(?:university|college|institute|school)\b/i.test(x));
  const qualification=education.find(x=>/\b(?:master(?:'s)?|bachelor(?:'s)?|diploma|degree|certificate|phd|doctorate)\b/i.test(x));
  const cleanSchool=school?.replace(/\s*(?:\||[,–—-])?\s*\b(?:19|20)\d{2}\b.*$/,'').trim();
  if(qualification){
    const q=qualification.replace(/\b(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}\b/g,'').trim();
    if(q===school)return 'Their educational background includes '+q+'.';
    if(cleanSchool && !/\b(?:university|college|institute|school)\b/i.test(q)){
      const kind=/^master(?:'s)?\s+of\s+/i.test(q)?'a master’s program in '+q.replace(/^master(?:'s)?\s+of\s+/i,''):
        /^bachelor(?:'s)?\s+of\s+/i.test(q)?'a bachelor’s program in '+q.replace(/^bachelor(?:'s)?\s+of\s+/i,''):
        /^(?:master|bachelor)(?:'s)?\b/i.test(q)?'a '+q+' program':q;
      return 'Their educational background includes '+kind+' at '+cleanSchool+'.';
    }
    return 'Their educational background includes '+q+'.';
  }
  if(cleanSchool)return 'Their educational background includes studies at '+cleanSchool+'.';
  const other=education.find(x=>/\b(?:training|course|program|certification)\b/i.test(x));
  return other?'Their education includes '+other[0].toLowerCase()+other.slice(1)+'.':'';
}
function npaExperience(group,answers){
  const entries=[...group.work,...group.summary].map(npaComplete).filter(Boolean);
  for(const text of entries){
    if(/\b(?:master(?:'s)?|bachelor(?:'s)?|degree|university|college)\b/i.test(text))continue;
    const experience=text.match(/^(?:professional\s+)?(?:experience|experienced|background|proficient|skilled)\s+(?:in|with)\s+(.+)$/i);
    if(experience&&npaComplete(experience[1]))return 'Their professional experience includes '+experience[1].replace(/[.!?]+$/,'')+'.';
    if(/^worked\s+(?:as|in)\s+/i.test(text))return 'They have '+text[0].toLowerCase()+text.slice(1).replace(/[.!?]+$/,'')+'.';
    if(/^(?:data analysis|business analysis|project management|customer service|software development|administrative support|sales|marketing|recruitment)(?:\s|$)/i.test(text) && text.length<90){
      return 'Their professional background includes '+text[0].toLowerCase()+text.slice(1)+'.';
    }
  }
  const position=answers.find(a=>a.key==='position');
  const job=npaComplete(position?.value);
  if(job && job.length<100 && !/\b(?:other|select|choose|current position)\b/i.test(job)){
    const named=job.replace(/^(?:a|an)\s+/i,'');
    const article=/^[aeiou]/i.test(named)?'an':'a';
    return 'Their professional background includes work as '+article+' '+named+'.';
  }
  return '';
}
function npaSkills(group){
  const skills=[];
  for(const line of group.skills){
    for(const item of line.split(/[,|•·;]+/)){
      const skill=npaComplete(item);
      if(!skill||skill.length>55||/\b(?:education|experience|responsibilities|contact|objective|reference)\b/i.test(skill))continue;
      if(!skills.some(x=>x.toLowerCase()===skill.toLowerCase()))skills.push(skill);
      if(skills.length===3)break;
    }
    if(skills.length===3)break;
  }
  return skills.length?'Their résumé highlights skills in '+npaJoin(skills)+'.':'';
}
function npaInterests(answers){
  const industry=answers.find(a=>a.key==='industry');
  const interest=answers.find(a=>a.key==='interest');
  const rawIndustry=String(industry?.value||'').trim();
  let industrySentence='';
  if(/^no\s+preference$/i.test(rawIndustry))industrySentence='They are open to opportunities across different industries.';
  else if(npaComplete(rawIndustry) && rawIndustry.length<80 && !/^other$/i.test(rawIndustry)){
    industrySentence='They have expressed interest in opportunities within '+rawIndustry.toLowerCase()+'.';
  }
  const choices=String(interest?.value||'').split(/\s*[·;\n]\s*/).map(x=>x.trim()).filter(Boolean);
  const selected=new Set();
  for(const item of choices){
    if(/\b(?:growth|advancement|career development)\b/i.test(item))selected.add('offer opportunities for professional growth and career advancement');
    else if(/\b(?:matches? my skills|aligns? with my|skills and experience)\b/i.test(item))selected.add('align with their skills and experience');
    else if(/\b(?:learn new skills|new challenge|take on new)\b/i.test(item))selected.add('allow them to learn and take on new challenges');
    else if(/day.to.day work/i.test(item))selected.add('involve work that interests them');
  }
  if(selected.size){
    const clauses=[...selected].slice(0,3);
    const motivation='They are interested in roles that '+npaJoin(clauses);
    if(industrySentence && /^no\s+preference$/i.test(rawIndustry))return motivation+'. They are also open to opportunities across different industries.';
    return motivation+'.'+(industrySentence?' '+industrySentence:'');
  }
  return industrySentence;
}
function npaObservation(notes){
  const entries=String(notes||'').split(/(?<=[.!?])\s+|[\r\n]+/).map(npaComplete).filter(Boolean);
  for(const raw of entries){
    const t=raw.replace(/[.!?]+$/,'');
    if(/^(?:the candidate|they|she|he)\s+\S/i.test(t))return t[0].toUpperCase()+t.slice(1)+'.';
    if(/^(?:demonstrated|showed|communicated|presented|expressed|displayed|highlighted)\b/i.test(t))return 'During the interview, they '+t[0].toLowerCase()+t.slice(1)+'.';
    if(/^(?:friendly|approachable|professional|engaged|thoughtful|confident|enthusiastic|positive|collaborative|organized|motivated|reliable|adaptable)(?:\b|,)/i.test(t)){
      const mixed=t.match(/^(.+?)\s+and\s+((?:communicated|demonstrated|showed|expressed|answered|contributed)\b.+)$/i);
      if(mixed){
        const adjectives=mixed[1].split(/,\s*|\s+and\s+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
        if(adjectives.every(x=>/^(?:friendly|approachable|professional|engaged|thoughtful|confident|enthusiastic|positive|collaborative|organized|motivated|reliable|adaptable)$/.test(x))){
          return 'During the interview, the candidate came across as '+npaJoin(adjectives)+', and '+mixed[2][0].toLowerCase()+mixed[2].slice(1)+'.';
        }
      }
      return 'During the interview, the candidate came across as '+t[0].toLowerCase()+t.slice(1)+'.';
    }
    if(/^(?:strong|clear|excellent|good)\s+(?:communication|interpersonal|organizational|analytical|problem.solving|leadership|teamwork)\b/i.test(t))return 'The interviewer noted '+t[0].toLowerCase()+t.slice(1)+'.';
    if(/^(?:communication|teamwork|attention to detail|problem.solving)\b/i.test(t) && t.length<95)return 'The interviewer highlighted '+t[0].toLowerCase()+t.slice(1)+'.';
  }
  return '';
}
function overviewParagraph(resume,notes,answers=[]){
  const group=profileEvidence(resume||'');
  const education=npaEducation(group),experience=npaExperience(group,answers),skills=npaSkills(group);
  const interest=npaInterests(answers),observation=npaObservation(notes);
  const parts=[];
  if(education)parts.push(education);
  // When supported, bring experience and skills together rather than listing facts.
  const experienceDetail=experience.match(/^Their professional experience includes (.+)\.$/);
  const skillDetail=skills.match(/^Their résumé highlights skills in (.+)\.$/);
  if(experienceDetail&&skillDetail){
    parts.push('Their professional experience includes '+experienceDetail[1]+', alongside skills in '+skillDetail[1]+'.');
  }else{
    if(experience)parts.push(experience);
    if(skills)parts.push(skills);
  }
  if(interest)parts.push(interest);
  if(observation)parts.push(observation);
  // Short on evidence? Stay concise rather than padding or inventing strengths.
  return parts.join(' ').replace(/\s+/g,' ').trim();
}
function firstStatement(value){
  const text=String(value||'').trim();
  if(!text)return '';
  const segment=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)][0]?.segment:text.split(/(?<=[.!?])\s+/)[0];
  return excerpt(segment||text);
}
function answerEvidence(a,kind){
  const shortlist=kind==='fit'?
    [['interest','Reason for interest'],['notes','Additional details'],['position','Current role'],['setup','Preferred work setup'],['employment','Employment type'],['notice','Notice period'],['salary','Salary expectations'],['industry','Preferred industry']]:
    [['position','Professional background'],['industry','Career interests'],['interest','Professional interests'],['notes','Professional qualities']];
  const custom=(prefs.extra||[]).map(q=>[q.id,q.label]);
  const examples=askedPrompts(a).filter(([key])=>key!=='employmentGap'&&recordingTakeaway(a,key)).map(([key,label])=>[key,label]);
  const pool=[shortlist[0],...examples,shortlist[1],...custom,...shortlist.slice(2)];
  return pool.map(([key,label])=>({key,label,value:display(a,key)})).filter(x=>x.value&&!/^(?:not discussed|unknown|n\/a)$/i.test(x.value)).filter(x=>kind==='fit'? !['salary','notice','employmentGap','otherinterviews','interviewdetails'].includes(x.key):(!['employment','notice','salary','reason','setup','employmentGap','otherinterviews','interviewdetails'].includes(x.key)&&!NPA_EXCLUDE.test(x.value))).slice(0,kind==='fit'?12:3);
}
function interviewSentence(entries){
  if(!entries.length)return '';
  const clauses={
    interest:v=>'gave “'+v+'” as a reason for their interest',
    position:v=>'described their current role as '+v,
    industry:v=>'expressed interest in '+v,
    employment:v=>'said they are looking for '+v.toLowerCase()+' work',
    setup:v=>'reported a work setup preference of '+v.toLowerCase(),
    notice:v=>'gave their notice period as '+v,
    salary:v=>'gave a salary expectation of '+v,
    reason:v=>'gave “'+v+'” as their reason for looking',
    notes:v=>'added “'+v+'”'
  };
  const phrases=entries.map(x=>{
    const value=firstStatement(x.value);
    return clauses[x.key]?clauses[x.key](value):'answered “'+value+'” when asked about '+x.label;
  });
  return 'In the interview, the candidate '+phrases.join(' and ')+'.';
}
function interviewSources(record){
  const summary=el('fitAnswers');summary.replaceChildren();
  for(const [kind,title] of [['fit','Role fit'],['overall','Candidate overview']]){
    const entries=answerEvidence(record?.a||{},kind);summary.append(make('strong',title));
    const ul=make('ul');for(const e of entries)ul.append(make('li',e.label+' — '+e.value));
    if(entries.length)summary.append(ul);else summary.append(make('p','No relevant answers recorded yet.'));
  }
}

const MAX_CHARS=120000;
function ensureText(text){
  if(typeof text!=='string'||text.trim().length<12)throw Error('No readable document text was found. For a scan, paste the text under “Paste or check document text”.');
  if(text.length>MAX_CHARS)throw Error('This document is too long. Paste the relevant sections under “Paste or check document text”.');
  return text.trim();
}
let pdfModule;
async function embeddedModuleUrl(id){
  const data=atob(el(id).textContent.trim());
  const bytes=Uint8Array.from(data,c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return URL.createObjectURL(new Blob([await new Response(stream).arrayBuffer()],{type:'text/javascript'}));
}
async function getPdfModule(){
  if(!pdfModule)pdfModule=(async()=>{
    const url=await embeddedModuleUrl('fitPdfModule');
    try{
      const api=await import(url);
      api.GlobalWorkerOptions.workerSrc=await embeddedModuleUrl('fitPdfWorker');
      return api;
    }finally{URL.revokeObjectURL(url);}
  })().catch(error=>{pdfModule=null;throw error;});
  return pdfModule;
}
async function pdfText(bytes){
  const api=await getPdfModule();
  const task=api.getDocument({data:bytes,isEvalSupported:false,useSystemFonts:true,useWorkerFetch:false,isOffscreenCanvasSupported:false,disableFontFace:true});
  try{
    const pdf=await task.promise;if(pdf.numPages>60)throw Error('Use a document with 60 pages or fewer, or paste the relevant sections.');
    let text='';
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);const data=await page.getTextContent();
      text+=data.items.filter(v=>typeof v.str==='string').map(v=>v.str+(v.hasEOL?'\n':' ')).join('')+'\n';
      page.cleanup();if(text.length>MAX_CHARS)throw Error('This PDF is too long. Paste the relevant sections.');
    }return text;
  }finally{await task.destroy();}
}
async function fileText(file){
  if(file.size>12*1024*1024)throw Error('Choose a file under 12 MB or paste the relevant text.');
  const ext=file.name.toLowerCase().split('.').pop();
  if(ext==='txt')return ensureText(await file.text());
  if(ext==='pdf')return ensureText(await pdfText(new Uint8Array(await file.arrayBuffer())));
  if(ext==='docx'){
    const zip=await JSZip.loadAsync(await file.arrayBuffer()),part=zip.file('word/document.xml');
    if(!part)throw Error('This file does not contain a Word document.');
    if(part._data?.uncompressedSize>8*1024*1024)throw Error('The Word file is too large to read. Paste the relevant sections.');
    const doc=new DOMParser().parseFromString(await part.async('string'),'application/xml');
    if(doc.querySelector('parsererror'))throw Error('The Word document is unreadable.');
    return ensureText([...doc.getElementsByTagNameNS('*','p')].map(p=>[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')).join('\n'));
  }
  throw Error('Choose a text-based PDF, DOCX or TXT file, or paste the text.');
}

let reviewOwner='',speech=null,session=0;
const reads={resume:0,job:0},pending=new Set();
const fields={fitResumeText:'resume',fitJobText:'job',overallNotes:'observations',fitNotes:'roleNotes',fitView:'view',fitParagraph:'fitParagraph',overallParagraph:'overallParagraph'};
function updateRemoveButtons(){
  for(const [key,label] of [['resume','Resume'],['job','Job']]){
    const exists=!!(pending.has(key)||el('fit'+label).value||el('fit'+label+'Text').value.trim()||el('fit'+label+'Name').textContent.trim());
    el('removeFit'+label).disabled=!exists;
  }
}
function writeReview(patch){
  const record=getCurrent();if(!record||record.id!==reviewOwner)return false;
  record.review={...record.review,...patch};return persist(recKey+record.id,record);
}
function endSpeech(){if(speech){const old=speech;speech=null;old.onresult=null;old.onend=null;old.onerror=null;try{old.abort();}catch{}}document.querySelectorAll('[data-mic]').forEach(b=>{b.textContent=b.dataset.mic==='fitNotes'?'Dictate role-specific notes':'Dictate overall observations';});}
function evidenceView(analysis){
  const list=el('fitList');list.replaceChildren();
  el('fitEvidence').hidden=!analysis;if(!analysis)return;
  el('fitCoverage').textContent=analysis.headline+' · '+analysis.supported+' of '+analysis.findings.length+' items show closely related wording. Missing wording is not proof a candidate lacks a skill; confirm essential requirements against the résumé and interview evidence.';
  for(const f of analysis.findings){
    const line=make('div');line.className='fit-evidence-line';line.append(make('strong',f.requirement),make('span',f.status));
    if(f.excerpt)line.append(make('blockquote',f.excerpt));list.append(line);
  }
}
function setReviewOwner(record){
  interviewSources(record);
  if((record?.id||'')===reviewOwner){if(record?.review?.needsUpdate)el('fitStatus').textContent='Inputs have changed. Draft again to use the latest details.';return;}
  endSpeech();session++;reviewOwner=record?.id||'';pending.clear();reads.resume++;reads.job++;
  for(const b of document.querySelectorAll('[data-undo-note]'))b.hidden=true;for(const k of Object.keys(noteUndo))delete noteUndo[k];
  if(el('observationDialog').open)closeObservation();
  const data=record?.review||{};
  for(const [id,key] of Object.entries(fields))el(id).value=data[key]||'';
  for(const type of ['Resume','Job']){el('fit'+type).value='';el('fit'+type+'Name').textContent=data[type.toLowerCase()+'Name']||'';}
  updateRemoveButtons();
  for(const kind of ['fit','overall']){el(kind+'Output').hidden=!data[kind+'Paragraph'];el(kind+'Fallback').hidden=true;el(kind+'Suggestion').hidden=true;el(kind+'AIStatus').textContent='';}
  evidenceView(data.analysis);el('fitEvidence').open=false;el('fitTextOptions').open=false;el('fitStatus').textContent=data.needsUpdate?'Inputs have changed. Draft again to update the review.':'';
  el('fitSpeech').textContent='Browser dictation may use an online speech service. You can also click a notes box and press Windows + H.';
}
function changeInput(id){
  const key=fields[id],patch={[key]:el(id).value};
  if(key==='resume'||key==='job'){
    reads[key]++;pending.delete(key);
    patch[key+'Name']=patch[key].trim()?'Pasted or edited text':'';
    el(key==='resume'?'fitResumeName':'fitJobName').textContent=patch[key+'Name'];
    patch.analysis=null;
    evidenceView(null);
    updateRemoveButtons();
  }
  const paragraph=key.endsWith('Paragraph');
  if(!paragraph)patch.needsUpdate=true;
  if(writeReview(patch)&&!paragraph)el('fitStatus').textContent='Inputs saved. Draft again to use the latest details.';
  if(paragraph){const kind=key==='fitParagraph'?'fit':'overall';el(kind+'Suggestion').hidden=true;}
}
for(const id of Object.keys(fields))el(id).addEventListener(id==='fitView'?'change':'input',()=>changeInput(id));
for(const [key,label] of [['resume','Resume'],['job','Job']]){
  const input=el('fit'+label);
  input.onchange=async()=>{
    const file=input.files[0];if(!file)return;const owner=reviewOwner,token=++reads[key];pending.add(key);updateRemoveButtons();
    const active=()=>owner===reviewOwner&&token===reads[key];el('fitStatus').textContent='Reading '+file.name+'…';
    try{
      const text=await fileText(file);if(!active())return;
      if(writeReview({[key]:text,[key+'Name']:file.name,needsUpdate:true})){
        el('fit'+label+'Text').value=text;el('fit'+label+'Name').textContent=file.name;
        evidenceView(null);updateRemoveButtons();
        el('fitStatus').textContent=file.name+' is ready. You can check the extracted text below the uploads.';
      }
    }catch(error){if(active()){
      const msg=error.name==='PasswordException'?'This PDF requires a password. Paste the document text instead.':error.message||'Paste the text instead.';
      el('fitStatus').textContent='Could not use '+file.name+'. '+msg+(el('fit'+label+'Text').value?' The previous document is still selected.':'');
      el('fitTextOptions').open=true;
    }}finally{if(active()){pending.delete(key);input.value='';updateRemoveButtons();}}
  };
}
for(const [key,label] of [['resume','Resume'],['job','Job']]){
  el('removeFit'+label).onclick=()=>{
    const input=el('fit'+label),field=el('fit'+label+'Text'),name=el('fit'+label+'Name');
    if(!input.value&&!field.value&&!name.textContent&&!pending.has(key))return;
    // Invalidate any asynchronous PDF/DOCX extraction still in progress.
    reads[key]++;pending.delete(key);
    input.value='';field.value='';name.textContent='';
    const patch={[key]:'',[key+'Name']:'',analysis:null,needsUpdate:true};
    const saved=writeReview(patch);
    evidenceView(null);el('fitEvidence').open=false;updateRemoveButtons();
    if(saved)el('fitStatus').textContent=(key==='resume'?'Résumé':'Job description')+' removed from this saved interview. Earlier drafts may refer to that document; draft again before using them.';
    else el('fitStatus').textContent=(key==='resume'?'Résumé':'Job description')+' removed from the page.';
  };
}
function draftReviews(both){
  const r=getCurrent();if(!r||r.id!==reviewOwner)return;
  if(pending.size){el('fitStatus').textContent='Wait for the selected document to finish loading.';return;}
  if(speech){el('fitStatus').textContent='Stop dictation and wait for your words to appear before drafting.';return;}
  try{
    const resume=el('fitResumeText').value.trim(),obs=el('overallNotes').value.trim(),job=el('fitJobText').value.trim();
    const npaAnswers=['position','industry','interest'].map(key=>({key,value:display(r.a,key)})).filter(item=>item.value);
    const newOverall=overviewParagraph(resume,obs,npaAnswers);
    const patch={overallParagraph:newOverall,needsUpdate:!both&&!!r.review?.fitParagraph};
    if(both){
      // An interview assessment is always possible using dictated observations and saved answers.
      // Résumé and posting comparisons are optional supporting evidence.
      const requirements=job?postingCriteria(job):[];
      if(requirements.length>90||splitDocument(resume).length>1400)throw Error('Paste just the role requirements and relevant résumé sections to make this comparison manageable.');
      patch.analysis=job&&resume&&requirements.length?compareDocuments(resume,job):null;
      patch.fitParagraph=draftParagraph({analysis:patch.analysis,view:el('fitView').value,notes:obs,roleNotes:el('fitNotes').value,answers:answerEvidence(r.a,'fit')});
    }
    const existing=both?(r.review?.fitParagraph||r.review?.overallParagraph):r.review?.overallParagraph;
    if(existing&&!confirm('Replace the existing '+(both?'paragraphs':'candidate overview')+' with a new draft?'))return;
    if(!writeReview(patch))return;
    for(const kind of both?['fit','overall']:['overall']){
      el(kind+'Paragraph').value=patch[kind+'Paragraph'];el(kind+'Output').hidden=false;
      el(kind+'Suggestion').hidden=true;el(kind+'Fallback').hidden=true;el(kind+'AIStatus').textContent='';
    }
    if(both)evidenceView(patch.analysis);
    el('fitStatus').textContent=(both?'Both drafts saved. The role fit compares résumé evidence against job requirements and includes any available observations. ':'NPA draft saved. ')+(!newOverall?'Add positive education, experience or observations to complete the NPA introduction. ':'')+'Review and edit before copying.';
  }catch(error){el('fitStatus').textContent=error.message;}
}
el('draftBoth').onclick=()=>draftReviews(true);el('draftOverview').onclick=()=>draftReviews(false);
for(const b of document.querySelectorAll('[data-mic]'))b.onclick=()=>{
  const id=b.dataset.mic,field=el(id),owner=reviewOwner;
  if(speech){speech.stop();return;}
  const Recognizer=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognizer){field.focus();el('fitSpeech').textContent='Click here in your notes and press Windows + H to dictate, or type your observations.';return;}
  const engine=new Recognizer();engine.lang='en-CA';engine.continuous=true;engine.interimResults=false;
  engine.onresult=event=>{
    if(owner!==reviewOwner||speech!==engine)return;
    for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal){
      const text=event.results[i][0].transcript.trim();if(text)field.value=[field.value.trim(),text].filter(Boolean).join(' ');
    }
    changeInput(id);
  };
  let failed=false;
  engine.onerror=e=>{if(speech!==engine)return;failed=true;el('fitSpeech').textContent='Dictation stopped ('+e.error+'). Click the notes box and press Windows + H, or type here.';};
  engine.onend=()=>{if(speech!==engine)return;endSpeech();if(!failed)el('fitSpeech').textContent='Dictation stopped. Check the wording before drafting.';};
  try{engine.start();speech=engine;b.textContent='Stop dictation';field.focus();el('fitSpeech').textContent='Listening for your observations…';}
  catch{endSpeech();el('fitSpeech').textContent='Microphone unavailable. Click the notes box and press Windows + H or type here.';}
};
const polishGuides={
  fit:'Write one natural, objective, professional Role Fit (Position Recommendation) paragraph in three to five connected sentences. FIRST compare the actual résumé with essential requirements of the job description. Make a recommendation only when the documented evidence justifies it; NEVER automatically say the candidate can be considered subject to meeting requirements. When essential qualifications are not documented, say the résumé does not establish them and do not recommend advancing on the present evidence. Distinguish missing information from confirmed lack of a qualification; do not assume the candidate is unqualified merely because something is omitted. Include the role-specific observations and relevant overall observations if supplied, but do not invent evidence or treat preferences as technical qualifications. Express actual strengths, mismatches, and remaining uncertainties naturally, without quotation marks around input answers or raw form labels. Exclude salary, phone numbers, sensitive details and negative assumptions about unemployment. Do not invent a final hiring decision. Return only the paragraph.',
  overall:'Write one warm, natural, professional third-person Candidate Overview (NPA), ideally three to five complete sentences, as if an interviewer introduced this candidate to a recruiter. Integrate only verified education, experience, transferable skills, career interests and positive interview observations. Convert dropdown shorthand into full prose: no industry preference means open to opportunities across different industries, not to every job; growth and learning selections should read as natural motivation, never as quoted form answers. Do not repeat labels or quote fragments. Remove incomplete or awkward résumé fragments rather than guessing the missing words. Exclude negative judgments, role-specific fit, salary, employment status, notice period and personal information. Do not invent credentials, abilities or achievements. Return only the finished paragraph.'
};
async function copyString(value){
  try{await navigator.clipboard.writeText(value);return true;}catch{
    const input=make('textarea');input.value=value;document.body.append(input);input.select();let copied=false;
    try{copied=document.execCommand('copy');}finally{input.remove();}return copied;
  }
}
for(const b of document.querySelectorAll('[data-copy]'))b.onclick=async()=>{
  const k=b.dataset.copy,owner=reviewOwner;const copied=await copyString(el(k+'Paragraph').value);
  if(reviewOwner!==owner)return;el(k+'AIStatus').textContent=copied?'Paragraph copied.':'Use the selected paragraph to copy manually.';
  if(!copied)el(k+'Paragraph').select();
};
for(const b of document.querySelectorAll('[data-ai]'))b.onclick=async()=>{
  const k=b.dataset.ai,owner=reviewOwner,version=session,source=el(k+'Paragraph').value.trim();
  if(!source)return;
  const active=()=>owner===reviewOwner&&version===session&&source===el(k+'Paragraph').value.trim();
  let rewriter;
  try{
    b.disabled=true;el(k+'AIStatus').textContent='Checking browser AI…';
    if(!window.Rewriter)throw Error();
    const options={tone:'more-formal',length:'as-is',format:'plain-text',expectedInputLanguages:['en'],expectedContextLanguages:['en'],outputLanguage:'en',sharedContext:polishGuides[k]};
    if(await Rewriter.availability(options)!=='available')throw Error();
    rewriter=await Rewriter.create(options);if(!active())return;
    el(k+'AIStatus').textContent='Polishing the paragraph…';
    const suggestion=await rewriter.rewrite(source,{context:polishGuides[k]});if(!active())return;
    if(!suggestion.trim())throw Error();
    el(k+'Proposed').value=suggestion;el(k+'Suggestion').hidden=false;el(k+'Fallback').hidden=true;el(k+'AIStatus').textContent='Review the suggestion before applying it.';
  }catch{if(active()){el(k+'Fallback').hidden=false;el(k+'AIStatus').textContent='On-device AI is unavailable here. You can use the ChatGPT option above.';}}
  finally{rewriter?.destroy();b.disabled=false;}
};
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=async()=>{
  const k=b.dataset.prompt;const val=polishGuides[k]+'\n\nDraft:\n'+el(k+'Paragraph').value;
  const ok=await copyString(val);if(ok)el(k+'AIStatus').textContent='Editing prompt copied. Paste it in ChatGPT when ready.';
  else window.prompt('Copy this prompt, then paste it in ChatGPT.',val);
};
for(const b of document.querySelectorAll('[data-accept]'))b.onclick=()=>{
  const k=b.dataset.accept,v=el(k+'Proposed').value.trim();if(!v)return;
  if(writeReview({[k+'Paragraph']:v})){el(k+'Paragraph').value=v;el(k+'Suggestion').hidden=true;el(k+'AIStatus').textContent='Revised paragraph saved.';}
};
for(const b of document.querySelectorAll('[data-discard]'))b.onclick=()=>{
  const k=b.dataset.discard;el(k+'Suggestion').hidden=true;el(k+'AIStatus').textContent='Original wording kept.';
};


// Observation editor: no permanent rough-dictation history; one-level undo in memory only.
let observationEdit=null;
const noteUndo={};
function closeObservation(){
  const dialog=el('observationDialog');if(dialog.open)dialog.close();else dialog.hidden=true;
  observationEdit=null;
}
function cleanupDictation(text){
  let s=String(text||'').replace(/\s+/g,' ').trim();
  s=s.replace(/\b(um+|uh+|erm|ah+)\b\s*[,;:]?\s*/gi,' ').replace(/\s+([,.;!?])/g,'$1').replace(/([,.!?])(?=[^\s\d])/g,'$1 ');
  s=s.replace(/\s+/g,' ').replace(/\b(\w+)(?:\s+\1){2,}\b/gi,'$1').trim();
  if(s)s=s[0].toLocaleUpperCase('en-CA')+s.slice(1);
  if(s&&!/[.!?]$/.test(s))s+='.';
  return s;
}
function noteInstructions(id,kind){
  const topic=id==='overallNotes'?'overall candidate observations':'role-specific interview observations';
  return kind==='grammar'
   ?'Correct spelling, punctuation and grammar in these '+topic+'. Remove spoken fillers and accidental repetition, joining fragmented dictation into coherent sentences. Keep all intended facts, doubts, nuances, quotations and the interviewer’s own judgment. Do not add new information, evaluation or credentials. Return only the cleaned-up notes.'
   :'Rewrite these '+topic+' into clear, concise, naturally flowing first-person recruiter notes. Preserve exactly what was observed and what remains uncertain. Clean up verbal pauses and incomplete dictation without changing the interviewer’s meaning, making a recommendation stronger or weaker, or inventing facts. Do not introduce sensitive or unrelated personal information. Return only the improved notes.';
}
function openObservationDialog(id,kind){
  const source=el(id).value.trim();if(!source){el('fitSpeech').textContent='Add or dictate your observations first.';el(id).focus();return;}
  if(speech){el('fitSpeech').textContent='Stop dictation before editing your observations.';return;}
  observationEdit={id,kind,source,owner:reviewOwner,token:session};
  el('observationDialogTitle').textContent=kind==='grammar'?'Correct Spelling and Grammar':'Ask AI to Help Write';
  el('observationDialogHint').textContent='Review the improved wording below. Applying it replaces the rough dictation, with a temporary Undo option.';
  el('observationDialogStatus').textContent='';
  el('observationFallback').hidden=true;
  el('observationProposed').value=kind==='grammar'?cleanupDictation(source):source;
  const dialog=el('observationDialog');dialog.hidden=false;
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.scrollIntoView({behavior:'smooth',block:'center'});
  (async()=>{
    let rewriter;
    try{
      if(!window.Rewriter)throw Error('Browser AI unavailable');
      const options={tone:'as-is',length:'as-is',format:'plain-text',expectedInputLanguages:['en'],expectedContextLanguages:['en'],outputLanguage:'en',sharedContext:noteInstructions(id,kind)};
      if(await Rewriter.availability(options)!=='available')throw Error('Browser AI unavailable');
      rewriter=await Rewriter.create(options);
      if(!observationEdit||observationEdit.owner!==reviewOwner||observationEdit.id!==id||observationEdit.source!==source)return;
      const result=await rewriter.rewrite(source,{context:noteInstructions(id,kind)});
      if(!observationEdit||observationEdit.owner!==reviewOwner||observationEdit.id!==id||observationEdit.source!==source)return;
      if(!result.trim())throw Error('No suggestion');
      if(el('observationProposed').value!== (kind==='grammar'?cleanupDictation(source):source))return;
      el('observationProposed').value=result.trim();
      el('observationDialogStatus').textContent='AI suggestion available. Review it before applying.';
    }catch{
      if(!observationEdit||observationEdit.owner!==reviewOwner||observationEdit.id!==id||observationEdit.source!==source)return;
      el('observationFallback').hidden=false;
      el('observationDialogStatus').textContent=kind==='grammar'?'Basic local cleanup is shown. For full grammar editing, use the ChatGPT option below.':'Browser AI is unavailable. You can copy a prompt to ChatGPT and paste the improved version above.';
    }finally{rewriter?.destroy();}
  })();
}
for(const button of document.querySelectorAll('[data-edit-note]'))button.onclick=()=>openObservationDialog(button.dataset.editNote,button.dataset.editKind);
el('observationUse').onclick=()=>{
  const o=observationEdit;if(!o||o.owner!==reviewOwner||o.token!==session){closeObservation();return;}
  const next=el('observationProposed').value.trim(),field=el(o.id);
  if(!next){el('observationDialogStatus').textContent='The improved wording is empty.';return;}
  if(field.value.trim()!==o.source){el('observationDialogStatus').textContent='Your notes have changed since this edit started. Close and edit again to avoid overwriting new dictation.';return;}
  noteUndo[o.id]={owner:o.owner,before:field.value,after:next};
  field.value=next;changeInput(o.id);
  const undo=document.querySelector('[data-undo-note="'+o.id+'"]');undo.hidden=false;
  el('fitSpeech').textContent='Improved observations saved. The rough dictation was replaced; Undo is available until further editing.';
  closeObservation();
};
el('observationCancel').onclick=closeObservation;
el('observationDialog').addEventListener('close',()=>observationEdit=null);
el('observationPromptCopy').onclick=async()=>{
  if(!observationEdit)return;
  const o=observationEdit;
  const prompt=noteInstructions(o.id,o.kind)+'\n\nOriginal observations:\n'+o.source;
  const ok=await copyString(prompt);
  el('observationDialogStatus').textContent=ok?'Prompt copied. Paste into ChatGPT, then paste the result into the box above.':'Select the prompt and copy it manually.';
  if(!ok)window.prompt('Copy editing prompt',prompt);
};
for(const b of document.querySelectorAll('[data-undo-note]'))b.onclick=()=>{
  const id=b.dataset.undoNote,entry=noteUndo[id];
  if(!entry||entry.owner!==reviewOwner||el(id).value!==entry.after){b.hidden=true;return;}
  el(id).value=entry.before;changeInput(id);delete noteUndo[id];b.hidden=true;
  el('fitSpeech').textContent='Previous observation wording restored.';
};

settings();renderForm();tab(false);

window.legacy={cache,prefix,recKey,records,updateName:name=>{draft.a.interviewer=name;renderForm();},refresh:()=>{settings();renderForm();renderReview();renderTracker();},setUser:name=>{draft={a:{interviewer:name}};current='';renderForm();},open:id=>{reviewScope="own";current=id;tab(true);},openTeam:id=>{if(!window.GuhuzaRecordAccess?.canViewAll())return;reviewScope="team";current=id;tab(true);},showTeam:()=>{if(!window.GuhuzaRecordAccess?.canViewAll())return;reviewScope="team";tab(true);},reset:()=>{reviewScope="own";cache.clear();draft={a:{}};current='';}};
