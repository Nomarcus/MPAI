export function parseCSV(input) {
  const text=input.replace(/^\uFEFF/,'');
  if(text.length>3_000_000) throw new Error('CSV-filen får vara högst 3 MB.');
  // Select delimiter outside quoted fields, using the first logical record.
  const counts={',':0,';':0,'\t':0}; let inside=false;
  for(let i=0;i<text.length;i++) { const c=text[i]; if(c==='"') { if(inside&&text[i+1]==='"') i++; else inside=!inside; } else if(!inside) { if(c==='\n'||c==='\r') break; if(c in counts) counts[c]++; } }
  const sep=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
  const records=[]; let row=[],value='',quoted=false,ended=false;
  const field=()=>{row.push(value);value='';ended=false;};
  const record=()=>{field(); if(row.some(x=>x.trim())) records.push(row); row=[];};
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted) { if(c==='"') { if(text[i+1]==='"') {value+='"';i++;} else {quoted=false;ended=true;} } else value+=c; }
    else if(c===sep) field();
    else if(c==='\n'||c==='\r') { if(c==='\r'&&text[i+1]==='\n') i++; record(); }
    else if(c==='"') { if(value||ended) throw new Error('Felaktiga citattecken i CSV-filen.'); quoted=true; }
    else { if(ended && !/\s/.test(c)) throw new Error('Text efter ett avslutat citat i CSV-filen.'); if(!ended) value+=c; }
  }
  if(quoted) throw new Error('CSV-filen innehåller ett citat som inte avslutats.');
  if(value||row.length) record();
  if(records.length<2) throw new Error('CSV behöver en rubrikrad och minst en textrad.');
  const headers=records.shift().map(x=>x.trim().toLocaleLowerCase('sv'));
  const ti=headers.findIndex(h=>['text','ärende','kommentar','message'].includes(h)), li=headers.findIndex(h=>['label','kategori','category'].includes(h));
  if(ti<0) throw new Error('CSV-filen behöver kolumnen text. Lägg till kategori för märkta träningsexempel.');
  if(records.length>5000) throw new Error('Högst 5 000 rader per CSV-fil.');
  return records.map((r,i)=>{
    if(r.length!==headers.length) throw new Error('Olika antal kolumner på rad '+(i+2)+'.');
    const text=r[ti].trim(), label=li>=0?r[li].trim():'';
    if(!text||text.length>12000) throw new Error('Tom eller för lång text på rad '+(i+2)+'.');
    if(label.length>60) throw new Error('För lång kategori på rad '+(i+2)+'.');
    return {text,label};
  });
}
export function exportCSV(rows) {
  const cell=v=>{
    let s=String(v??''); if(/^\s*[=+@-]/.test(s)) s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  };
  return '\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n');
}
export function download(content,name,type='application/json') {
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
}
export function openDB() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('mpai-signal',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('projects');
    request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
  });
}
export async function loadProject() {
  const db=await openDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction('projects'),r=tx.objectStore('projects').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});
}
export async function saveProject(project) {
  const db=await openDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(project,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});
}
