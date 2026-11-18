'use strict';
(()=>{
const labels={name:'name',position:'role','position applied for':'role','candidate email':'email',email:'email','job id':'job','who is interviewing':'interviewer','current position / resume check':'positionResume',location:'location','work location / commute':'areaTravel','car or public transit':'transit','reason for looking / leaving':'reason','notice period':'notice','employment type wanted':'employment','preferred work setup':'setup','preferred company size':'size','preferred industry':'industry','other interviews':'otherinterviews','other interview details':'interviewdetails','salary expectations':'salary','why interested in this role':'interestReasons','why are you interested in this role':'interestReasons','additional details':'notes','interview date':'interviewDate','date of interview':'interviewDate'};
const norm=s=>String(s||'').toLowerCase().replace(/[?*:]/g,'').replace(/\s+/g,' ').trim();
const clean=s=>String(s||'').replace(/\\\s*$/,'').replace(/^\*\*|\*\*$/g,'').trim();
function pair(label,value){const key=labels[norm(label)];return key?[key,clean(value)]:null;}
function parse(input){
 const records=[];let current=null,lastKey=null;
 function assign(key,value){if(key==='name'){if(current?.name)records.push(current);current={name:value};}else if(!current)current={};if(key!=='name')current[key]=current[key]?current[key]+'\n'+value:value;lastKey=key;}
 for(let line of String(input).replace(/\r/g,'').replace(/\u00a0/g,' ').split('\n')){
  line=line.trim();if(!line||/^\|?\s*:?-{3}/.test(line))continue;
  const cells=line.startsWith('|')?line.replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(clean):line.includes('\t')?line.split('\t').map(clean):null;
  if(cells){if(cells.every(c=>/^:?-+:?$/.test(c)))continue;const header=cells.map(c=>c.match(/^(.+?):\s*(.*)$/)).filter(Boolean);if(header.length&&header.some(m=>norm(m[1])==='name')){for(const m of header){const p=pair(m[1],m[2]);if(p)assign(...p);}continue;}if(cells.length>=2){const p=pair(cells[0],cells.slice(1).join(' | '));if(p){assign(...p);continue;}}}
  const colon=line.match(/^([^:]{1,70}):\s*(.*)$/);if(colon){const p=pair(colon[1],colon[2]);if(p){assign(...p);continue;}}
  // Word tables may put a label and its value on separate lines.
  const key=labels[norm(line)];if(key){lastKey=key;if(!current)current={};if(current[key]===undefined)current[key]='';continue;}
  if(lastKey&&current){if(lastKey==='name'&&current.name){records.push(current);current={name:clean(line)};}else current[lastKey]=[current[lastKey],clean(line)].filter(Boolean).join('\n');}
 }
 if(current&&Object.values(current).some(Boolean))records.push(current);
 if(!records.length)throw Error('No interview notes found. Start each interview with Name: and Position:.');
 if(records.length>100)throw Error('Import at most 100 interviews at a time.');
 return records.map((raw,index)=>{const a={};for(const [key,value]of Object.entries(raw)){if(!['positionResume','areaTravel','interviewDate'].includes(key))a[key]=value;}
  const splits=s=>String(s||'').split(/\s*[·;]\s*/).filter(Boolean);
  for(const key of ['employment','setup','size','interestReasons'])if(a[key])a[key]=splits(a[key]);
  if(raw.positionResume){const parts=splits(raw.positionResume);const check=parts.findIndex(x=>/^(up to date|update requested|not discussed)$/i.test(x));a.resume=check>=0?parts.splice(check,1)[0]:'';a.position=parts.join(' · ');}
  if(raw.areaTravel){const parts=splits(raw.areaTravel);a.area=parts[0]||'';a.travel=parts.slice(1).join(' · ');}
  if(a.salary){const money=String(a.salary).match(/\$?([\d,]+(?:\.\d+)?)\s*[–—-]\s*\$?([\d,]+(?:\.\d+)?)/);const unit=/per\s+hour|hourly|\/hr/i.test(a.salary)?'hourly':/per\s+year|annual|\/yr/i.test(a.salary)?'annual':'';if(money&&unit){a.salaryMinimum=money[1].replace(/,/g,'');a.salaryDream=money[2].replace(/,/g,'');a.salaryUnit=unit;}}
  return {a,interviewDate:/^\d{4}-\d{2}-\d{2}$/.test(raw.interviewDate||'')?raw.interviewDate:'',sourceInterviewer:a.interviewer||'',warnings:[!a.name?'Candidate name is missing.':'',!a.role?'Position applied for is missing.':'',!a.job?'Job ID is missing.':''].filter(Boolean),index};});
}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;}
function eventDate(record){if(validDate(record.interviewDate)){const [y,m,d]=record.interviewDate.split('-').map(Number);return new Date(y,m-1,d);}return new Date(record.created);}
window.GuhuzaBacklogParser={parse,validDate,eventDate};
})();