import {PRESETS,DISCOVERY_DEMO} from './data.js';
import {predict,cleanRows,normalize,serializeModel,validateModel,metrics} from './engine.js';
import {parseCSV,exportCSV,download,loadProject,saveProject} from './io.js';
import {discover as findThemes} from './discover.js';
import {buildSpecialistHTML} from './exporter.js';
let engineSource=null;
fetch(new URL('./engine.js',import.meta.url)).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(s=>{engineSource=s;}).catch(()=>{});

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Math.round(v*100)+'%';
let idCounter=0;
const uid=()=>crypto.randomUUID?.()||`q-${Date.now().toString(36)}-${(++idCounter).toString(36)}-${Math.random().toString(36).slice(2,10)}`;
const emptyState=()=>({format:'mpai-signal-project',version:1,name:'Min specialist',rows:[],labels:[],queue:[],model:null,report:null,blindResult:null,preset:null,threshold:.64,dirty:false,feedbackCount:0,revision:0});
let state=emptyState(), view='home',sortTab='batch',filter='all',worker=null,toastTimer,saveTimer,predictTimer,saving=Promise.resolve(),pendingImport=null,readOnly=false;
let saveFailed=false,saveRevision=0,selectedLabels=new Map(),editorRelease;
let discovery={text:'',k:3,clusters:null},drafts={};

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function modal(html){$('#modal-content').innerHTML=html; if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){$('#modal').close();}
function dialogHeader(title){return `<div class="dialog-header"><h2>${esc(title)}</h2><button data-action="close" aria-label="Stäng dialog">×</button></div>`;}
function confirmAction(title,body,action,extra='') {modal(`${dialogHeader(title)}<p>${esc(body)}</p><div class="flex-end"><button class="button subtle" data-action="close">Avbryt</button><button class="button" data-action="${action}" ${extra}>Fortsätt</button></div>`);}
function dirty(){state.dirty=!!state.model;state.blindResult=null;state.revision++;scheduleSave();}
function canEdit(){if(readOnly){toast('Projektet är öppet i en annan flik. Stäng den och ladda om här.');return false;}if(worker){toast('Vänta tills träningen är klar, eller avbryt den.');return false;}return true;}
function setStorageWarning(message){$('#storage-warning').hidden=!message;$('#storage-warning').textContent=message;}
function scheduleSave(){
  if(readOnly)return;
  clearTimeout(saveTimer);$('#save-status').textContent='Sparar…';
  const rev=++saveRevision;
  saveTimer=setTimeout(()=>{
    const snapshot=JSON.parse(JSON.stringify({...state,model:state.model?serializeModel(state.model):null}));
    saving=saving.catch(()=>{}).then(()=>saveProject(snapshot)).then(()=>{
      if(rev!==saveRevision)return;saveFailed=false;$('#save-status').textContent='Sparat på enheten';$('#save-status').classList.remove('error');if(!readOnly)setStorageWarning('');
    }).catch(()=>{saveFailed=true;$('#save-status').textContent='Inte sparat';$('#save-status').classList.add('error');setStorageWarning('Projektet kunde inte sparas på enheten. Exportera en säkerhetskopia innan du stänger sidan. Ditt arbete finns kvar i den här fliken.');});
  },250);
}
window.addEventListener('beforeunload',e=>{if(saveFailed){e.preventDefault();e.returnValue='';}});

function navigate(next){view=['home','sort','discover','teach','results','guide'].includes(next)?next:'home';history.replaceState(null,'','#'+view);render();window.scrollTo({top:0,behavior:'instant'});}
function modelWarning(){return state.dirty?'<div class="model-stale">Nya exempel väntar. Träna om AI:n för att använda dem. Förslagen just nu kommer från den tidigare modellen.</div>':'';}
function title(eyebrow,heading,text,actions=''){return `<div class="page-title"><div><div class="eyebrow">${eyebrow}</div><h1>${heading}</h1><p>${text}</p></div><div class="title-right">${actions}</div></div>`;}
function noModel(){return `<div class="panel empty"><div class="empty-icon">✳</div><h2>En specialist börjar med exempel.</h2><p>Prova ett färdigt exempel eller lär AI:n hur du vill sortera din egen text.</p><div class="actions" style="justify-content:center"><button class="button" data-action="demo" data-id="support">Prova med kundservice</button><button class="button subtle" data-nav="teach">Lär med egen text</button></div></div>`;}
function art(){
  let nodes='';const colors=['#d1fa87','#b9a7fb','#8fbfda'];
  for(let group=0;group<3;group++)for(let i=0;i<18;i++){
    const a=i*2.39996,rr=15+Math.sqrt(i/18)*57,cx=[115,290,245][group],cy=[122,110,260][group],x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;
    nodes+=`<line x1="${x}" y1="${y}" x2="205" y2="177" stroke="${colors[group]}" stroke-opacity=".13"/><circle cx="${x}" cy="${y}" r="${i%5===0?4.5:2.7}" fill="${colors[group]}" opacity="${.3+i/30}"/>`;
  }
  return `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 410 350"><defs><radialGradient id="glow"><stop stop-color="#a2d260" stop-opacity=".12"/><stop offset="1" stop-color="#171b22" stop-opacity="0"/></radialGradient></defs><circle cx="205" cy="177" r="170" fill="url(#glow)"/><circle cx="205" cy="177" r="125" stroke="#5c726b" stroke-opacity=".18" fill="none" stroke-dasharray="3 7"/>${nodes}<circle cx="205" cy="177" r="33" fill="#212c2b" stroke="#92aa70" stroke-opacity=".6"/><text x="205" y="182" text-anchor="middle" class="signal-label">AI</text><text x="62" y="44" class="art-label">EXEMPEL</text><text x="297" y="52" class="art-label">MÖNSTER</text><text x="259" y="323" class="art-label">BESLUT</text></svg><span class="floating-label">LÄRANDE GENOM EXEMPEL</span><span class="art-caption">ILLUSTRATION AV EN TEXTMODELL</span></div>`;
}
function stats(){
  const pending=state.model?state.queue.filter(q=>!q.confirmed&&predict(state.model,q.text,state.threshold).review).length:0;
  return `<div class="stats"><div class="stat"><div class="stat-top"><span class="stat-name">Träningsexempel</span><span class="stat-icon">✳</span></div><strong>${state.rows.length}</strong><small>${state.labels.length} egna kategorier</small></div><div class="stat"><div class="stat-top"><span class="stat-name">Utvecklingsresultat</span><span class="stat-icon">↗</span></div><strong>${state.report?pct(state.report.accuracy):'—'}</strong><small>${state.report?'Korsvalidering · '+state.report.n+' texter':'Mäts när du tränar'}</small></div><div class="stat"><div class="stat-top"><span class="stat-name">Behöver din blick</span><span class="stat-icon">◉</span></div><strong>${pending}</strong><small>Osäkra förslag i kön</small></div><div class="stat accent"><div class="stat-top"><span class="stat-name">Rättelser att lära av</span><span class="stat-icon">⤴</span></div><strong>${state.feedbackCount}</strong><small>Din kunskap gör skillnad</small></div></div>`;
}
function home(){return `<section class="hero"><div class="hero-copy"><div class="eyebrow">DIN KUNSKAP. DIN EGEN AI.</div><h1>${state.model?'Din specialist.<br><em>Redo att jobba.</em>':'En egen AI.<br><em>Som lär av dig.</em>'}</h1><p>${state.model?'Sortera text, fånga osäkra fall och lär AI:n något nytt. Varje rättelse blir ett nytt träningsexempel.':'Visa hur du vill sortera text. Signal hittar mönstren, lär sig av dina rättelser och blir din egen lilla specialist.'}</p><div class="actions"><button class="button primary" data-action="${state.model?'open-sort':'demo'}" data-id="support">${state.model?'Börja sortera':'Prova på 60 sekunder'} <span aria-hidden="true">↗</span></button><button class="button subtle" ${state.model?'data-nav="teach"':'data-action="new"'}>${state.model?'Fortsätt lära AI:n':'Skapa egen specialist'}</button></div></div>${art()}</section>${stats()}${modelWarning()}${state.model?`<div class="dashboard-bottom"><section class="panel"><div class="eyebrow muted">DET HÄR HAR DIN AI LÄRT SIG</div><h2 style="margin-top:14px">${esc(state.name)}</h2>${state.labels.map(l=>`<div class="activity-item"><span>${esc(l)}</span><span class="mono muted">${state.rows.filter(r=>r.label===l).length} exempel</span></div>`).join('')}<div class="actions" style="margin-top:19px"><button class="button subtle" data-nav="results">Se vad den klarar ↗</button></div></section><section class="panel"><div class="eyebrow muted">GÖR DEN TILL ETT VERKTYG</div><h2 style="margin-top:14px">Ta din AI med dig.</h2><p class="muted">Exportera en fristående webbsida med din tränade modell. Öppna den på datorn och använd din specialist även offline.</p><button class="button" data-action="standalone" ${state.dirty?'disabled':''}>Exportera AI-verktyg ↗</button><p class="hint" style="margin:14px 0 0">Modellvikter följer med. Originaltexterna följer inte med.</p></section></div>`:''}<section style="margin-top:31px"><div class="section-heading"><div><h2>${state.model?'Utforska en annan specialist':'Börja med något du känner igen'}</h2><p>Fiktiva exempel att testa, undersöka och bygga vidare på.</p></div><button class="button tiny subtle" data-action="new">Egen idé +</button></div><div class="presets">${PRESETS.map((p,i)=>`<button class="preset" data-action="demo" data-id="${p.id}"><span class="preset-icon" aria-hidden="true">${['≋','↗','♡'][i]}</span><span class="eyebrow">${p.eyebrow}</span><h3>${p.name}</h3><p>${p.description}</p><span class="preset-bottom"><span>${p.rows.length} exempel · 3 kategorier</span><span class="arrow-circle" aria-hidden="true">↗</span></span></button>`).join('')}</div><p class="demo-note">Demotexter är påhittade. Resultat på dem är inte ett löfte om resultat på din egen data.</p></section><div class="how-strip"><div><span class="step-number">01</span><div><strong>Visa några exempel</strong><p>Ge varje text en kategori. Fyra per kategori räcker för att börja.</p></div></div><div><span class="step-number">02</span><div><strong>Låt AI:n hitta mönstret</strong><p>Två modeller tränas och jämförs. Du får se hur de faktiskt presterar.</p></div></div><div><span class="step-number">03</span><div><strong>Rätta. Lär om. Använd.</strong><p>Hjälp den med svåra fall och exportera din egen specialist.</p></div></div></div>`;}

function predictions(text){
  if(!text.trim())return '<p class="muted">Skriv eller klistra in en text. Din AI visar sitt förslag här.</p>';
  const p=predict(state.model,text,state.threshold);
  return `<span class="badge ${p.review?'review':''}">${p.review?'◉ Behöver granskas':'✧ Modellens förslag'}</span><h3>${esc(p.label)}</h3>${p.review?`<div class="reason">${p.reasons.map(esc).join(' · ')}</div>`:''}<div class="score-bars">${p.ranking.map(r=>`<div class="score-row"><span>${esc(r.label)}</span><span class="bar"><i style="width:${Math.round(r.score*100)}%"></i></span><span class="mono">${pct(r.score)}</span></div>`).join('')}</div><p class="score-note">Modellpoäng visar hur modellen rangordnar. Det är inte en verifierad sannolikhet att förslaget är rätt.</p>${p.evidence.length?`<p class="hint" style="margin:20px 0 9px">Ord som bidrar till förslaget jämfört med andrahandsvalet:</p><div class="evidence">${p.evidence.map(e=>`<span>${esc(e.word)}</span>`).join('')}</div>`:''}`;
}
function sort(){return title('FRÅN TEXT TILL STRUKTUR','Låt din AI ta första steget.','Du tar de viktiga besluten. Modellen föreslår, visar sina skäl och lyfter fram det den behöver hjälp med.',state.model?`<span class="badge ${state.dirty?'dirty':''}">${state.dirty?'Träna om':'Modell redo'}</span>`:'')+(!state.model?noModel():`${modelWarning()}<div class="tabs"><button data-action="sort-tab" data-tab="batch" class="${sortTab==='batch'?'active':''}">Sortera en samling</button><button data-action="sort-tab" data-tab="single" class="${sortTab==='single'?'active':''}">Prova en text</button></div>${sortTab==='single'?`<div class="split"><section class="panel"><h2>Vad säger din specialist?</h2><p class="muted">Testa en ny formulering. Prova gärna något den inte har tränats på.</p><label for="test-text">Text att undersöka</label><textarea id="test-text" rows="7" maxlength="12000" placeholder="Klistra in en förfrågan, kommentar eller ett ärende…"></textarea><div class="form-row" style="margin-top:18px"><select id="single-label" aria-label="Rätt kategori"><option value="">Välj rätt kategori…</option>${state.labels.map(l=>`<option>${esc(l)}</option>`).join('')}</select><button class="button" data-action="learn-single">Lägg till som exempel</button></div><p class="hint">Välj rätt kategori själv. Texten läggs till som ett nytt träningsexempel.</p></section><section class="panel"><div class="eyebrow muted">SÅ TÄNKER MODELLEN</div><div class="prediction" id="single-result">${predictions('')}</div></section></div>`:batch()}`);}
function batch(){
  let items=state.queue.map(q=>({...q,p:predict(state.model,q.text,state.threshold)}));
  if(filter==='review')items=items.filter(q=>q.p.review&&!q.confirmed);
  if(filter==='done')items=items.filter(q=>q.confirmed);
  items.sort((a,b)=>Number(a.confirmed)-Number(b.confirmed)||Number(b.p.review)-Number(a.p.review)||b.p.uncertainty-a.p.uncertainty);
  const reviews=state.queue.filter(q=>!q.confirmed&&predict(state.model,q.text,state.threshold).review).length;
  return `<div class="panel"><div class="section-heading"><div><h2>Lägg in det du vill sortera</h2><p>En text per rad, eller importera en CSV med kolumnen text. Högst 2 000 texter i kön.</p></div><button class="button tiny subtle" data-action="import">Importera CSV ↥</button></div><label for="batch-text">Nya texter</label><textarea id="batch-text" class="queue-input" maxlength="1000000" placeholder="En kundfråga…&#10;En kommentar…&#10;Ett nytt ärende…"></textarea><div class="queue-controls" style="margin-top:14px;margin-bottom:0"><label class="threshold" for="threshold">Granska under <span class="mono" id="threshold-value">${pct(state.threshold)}</span><input id="threshold" type="range" min="40" max="95" value="${Math.round(state.threshold*100)}" step="1"></label><button class="button" data-action="add-batch">Sortera texterna ↗</button></div><p class="hint" style="margin:12px 0 0">Även låg textlikhet eller två jämnstarka kategorier kan utlösa granskning.</p></div><div class="queue-controls"><div class="segmented">${[['all','Alla '+state.queue.length],['review','Granska '+reviews],['done','Bekräftade '+state.queue.filter(q=>q.confirmed).length]].map(([key,label])=>`<button data-action="filter" data-filter="${key}" class="${filter===key?'active':''}">${label}</button>`).join('')}</div><div class="actions"><button class="button tiny subtle" data-action="export-results" ${!state.queue.length?'disabled':''}>Exportera resultat ↓</button>${state.queue.length?'<button class="remove-link" data-action="clear-queue">Töm kön</button>':''}</div></div><div class="queue-list">${items.length?items.map(q=>`<article class="queue-item ${q.confirmed?'done':q.p.review?'needs-review':''}"><div><p>${esc(q.text)}</p><div class="queue-meta"><span class="badge ${!q.confirmed&&q.p.review?'review':''}">${q.confirmed?'✓ Bekräftad':q.p.review?'◉ Granska':'✧ Förslag'}</span><span>${esc(q.confirmed?q.label:q.p.label)} ${q.confirmed?'':'· '+pct(q.p.score)+' modellpoäng'}</span></div>${q.p.review&&!q.confirmed?`<div class="reason">${q.p.reasons.map(esc).join(' · ')}</div>`:''}</div><div class="queue-decision"><select data-queue-label="${q.id}" aria-label="Rätt kategori för texten">${state.labels.map(l=>`<option ${l===(selectedLabels.get(q.id)||q.label||q.p.label)?'selected':''}>${esc(l)}</option>`).join('')}</select><button class="button ${q.confirmed?'subtle':''} tiny" data-action="learn-queue" data-id="${q.id}">${q.confirmed?'Ändra & lär':'Bekräfta & lär'}</button></div></article>`).join(''):`<div class="panel empty"><div class="empty-icon">≋</div><h3>${filter==='review'?'Inga osäkra fall just nu.':filter==='done'?'Inga bekräftade texter ännu.':'Här hamnar dina texter.'}</h3><p>${filter==='all'?'Lägg in text ovan eller importera en CSV för att börja.':'Välj Alla för att se hela samlingen.'}</p></div>`}</div>${state.dirty?trainBar():''}`;
}

function teach(){return title('DIN KUNSKAP BLIR TRÄNINGSDATA','Visa vad du menar.','Ge AI:n tydliga och varierade exempel. Fler formuleringar är bättre än samma text flera gånger.',`<button class="button subtle" data-action="import">Importera exempel ↥</button>`)+`<div class="split"><section class="panel"><h2>Ett nytt exempel</h2><p class="muted">Bestäm kategorierna, lägg till texter och träna din specialist.</p><form id="example-form" class="add-form"><div><label for="example-label">Rätt kategori</label><select id="example-label" ${!state.labels.length?'disabled':''}>${state.labels.length?state.labels.map(l=>`<option>${esc(l)}</option>`).join(''):'<option>Skapa en kategori först</option>'}</select></div><div><label for="example-text">Exempeltext</label><textarea id="example-text" rows="5" maxlength="12000" placeholder="En typisk text som hör till den här kategorin…" required></textarea></div><button class="button wide" ${!state.labels.length?'disabled':''}>Lägg till exempel +</button></form><div style="border-top:1px solid var(--line);margin-top:24px;padding-top:21px"><form id="category-form"><label for="new-category">Ny kategori</label><div class="form-row"><input id="new-category" maxlength="60" placeholder="Till exempel: Bokningsfråga" required><button class="button subtle" ${state.labels.length>=12?'disabled':''}>Lägg till</button></div></form><p class="hint">2–12 kategorier. Minst 4 olika exempel per kategori för att träna. Sikta gärna på 15–30.</p></div></section><section class="panel"><div class="section-heading"><div><h2>Det här lär du AI:n</h2><p>${state.rows.length} unika exempel i ${state.labels.length} kategorier.</p></div></div>${state.labels.length?`<div class="category-list">${state.labels.map(l=>`<details class="category"><summary>${esc(l)}<span class="category-count">${state.rows.filter(r=>r.label===l).length} exempel</span></summary>${state.rows.map((r,i)=>r.label===l?`<div class="sample"><span>${esc(r.text)}</span><button data-action="delete-example" data-index="${i}" aria-label="Radera exempel">×</button></div>`:'').join('')}<div style="padding:8px 12px"><button class="remove-link" data-action="delete-category" data-label="${esc(l)}">Radera kategorin och dess exempel</button></div></details>`).join('')}</div>`:'<div class="empty"><div class="empty-icon">✳</div><h3>Börja med två kategorier.</h3><p>Vad vill du skilja på? Till exempel ”Bokning” och ”Fråga”.</p></div>'}</section></div><div class="callout"><span aria-hidden="true">↳</span><p><strong>Smarta exempel ger smartare förslag.</strong> Ta med svåra gränsfall och texter från flera situationer. Undvik att en kategori alltid innehåller samma hälsning eller namn. Modellen kan lära sig fel mönster.</p></div>${trainBar()}`;}
function trainBar(){const ready=state.labels.length>=2&&state.labels.every(l=>state.rows.filter(r=>r.label===l).length>=4);return `<div class="training-action"><div><strong>${state.dirty?'Nya exempel. Ny kunskap.':'Redo att hitta mönstret?'}</strong><p>${ready?'Två modeller jämförs med korsvalidering.':'Minst 2 kategorier och 4 olika exempel i varje.'}</p></div><button class="button primary" data-action="train" ${!ready||worker?'disabled':''}>${state.model?'Träna om AI:n':'Träna min AI'} <span aria-hidden="true">✳</span></button></div>`;}

function lossChart(loss){if(!loss?.length)return ''; const w=600,h=110,max=Math.max(...loss)*1.1,min=0;const points=loss.map((v,i)=>`${i/(loss.length-1)*w},${h-(v-min)/(max-min)*h}`).join(' ');return `<svg class="chart" viewBox="0 0 600 120" role="img" aria-label="Träningsförlust från ${loss[0].toFixed(3)} till ${loss.at(-1).toFixed(3)}"><line x1="0" y1="112" x2="600" y2="112" stroke="#dee5d8"/><polyline points="${points}" fill="none" stroke="#7c9b55" stroke-width="3"/></svg><div class="chart-labels"><span>Första träningsvarvet</span><span>Sista träningsvarvet</span></div>`;}
function results(){if(!state.model)return title('MÄT. FÖRSTÅ. FÖRBÄTTRA.','Vad klarar din specialist?','Här ser du modellens resultat efter träning.')+noModel();const r=state.report;return title('ÄRLIGA RESULTAT','Förstå vad din AI kan.','Träningsdata säger inte allt. Här mäts modellen på texter som hölls utanför träningen i varje testomgång.',`<button class="button subtle" data-action="model-json" ${state.dirty?'disabled':''}>Exportera modellen ↓</button>`)+modelWarning()+(r?`<div class="result-grid"><section class="panel"><div class="eyebrow muted">KORSVALIDERING · ${r.n} EXEMPEL</div><div class="metric-big">${pct(r.accuracy)}<small>rätt kategori</small></div><p class="muted">Varje exempel testades en gång efter att modellen tränats på de andra delarna. Samma test användes för att välja modell; resultatet kan därför vara optimistiskt.</p><div class="info-grid"><div class="info-block"><strong>Macro-F1: ${r.macroF1.toFixed(2)}</strong><p>Väger kategorierna lika, även när de har olika många exempel. 1,00 är högst.</p></div><div class="info-block"><strong>${r.mode==='hybrid'?'Ord + ordfragment':'Ord + ordpar'} valdes</strong><p>Högst macro-F1 av två varianter. Slutmodellen tränades sedan på alla ${r.rows} exempel.</p></div></div></section><section class="panel"><h2>Modelljämförelsen</h2><div class="table-wrap"><table><thead><tr><th>Variant</th><th>Rätt</th><th>Macro-F1</th></tr></thead><tbody>${r.candidates.map(c=>`<tr class="${c.mode===r.mode?'chosen':''}"><td>${c.mode==='hybrid'?'Ord + ordfragment':'Ord + ordpar'} ${c.mode===r.mode?'✓':''}</td><td>${pct(c.accuracy)}</td><td>${c.macroF1.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><h3 style="margin-top:24px">Inlärningens kurva</h3><p class="hint">Träningsförlust för slutmodellen. Lägre betyder bättre anpassning till träningsdata, inte säkert bättre resultat på nya texter.</p>${lossChart(state.model.loss)}</section></div><section class="panel"><div class="section-heading"><div><h2>Var blir det fel?</h2><p>Rader = rätt kategori. Kolumner = modellens förslag i korsvalideringen.</p></div></div><div class="table-wrap"><table class="confusion"><thead><tr><th>Rätt ↓ / Förslag →</th>${r.labels.map(l=>`<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${r.matrix.map((row,i)=>`<tr><th>${esc(r.labels[i])}</th>${row.map((n,j)=>`<td style="background:${i===j?'#eaf2df':n?'#fae8d6':'transparent'}">${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint" style="margin-bottom:0;margin-top:17px">Exakta textdubbletter tas bort före uppdelning. Nästan likadana texter kan fortfarande göra resultatet för bra. Använd nya, representativa verkliga texter för ditt eget sluttest.</p></section>`:'<div class="callout warning">Modellen är importerad utan utvärderingsrapport. Lägg till egna exempel och träna för att mäta den.</div>')+`<section class="panel"><div class="section-heading"><div><h2>Ett separat prov</h2><p>${state.preset?'Demots reservtexter ingår inte i den ursprungliga träningen. Resultatet är ett litet, fiktivt prov.':'För ett eget oberoende test: importera en CSV med text och kategori via knappen här.'}</p></div><button class="button subtle" data-action="${state.preset?'blind-test':'test-csv'}" ${state.dirty?'disabled':''}>${state.preset?'Kör reservprovet':'Testa med egen CSV'} ↗</button></div>${state.blindResult?`<div class="blind-result"><span class="badge violet">${state.blindResult.correct} av ${state.blindResult.cases.length} rätt · ${state.blindResult.review} begär granskning</span><p class="hint">Rätt räknar modellens förstahandsförslag, även när granskning begärs. Inget facit lärs in.</p>${state.blindResult.cases.map(c=>`<div class="blind-case"><span>${esc(c.text)}</span><span class="${c.right?'ok':'bad'}">${c.right?'✓':'×'} ${esc(c.predicted)}${c.review?' · granska':''}<br><span class="muted small">Facit: ${esc(c.label)}</span></span></div>`).join('')}</div>`:''}</section><div class="callout warning"><span aria-hidden="true">◉</span><p><strong>En specialist, med begränsningar.</strong> Signal lär sig statistiska textmönster. Den förstår inte fakta, ironi eller avsikt som en språkmodell. En hög modellpoäng kan vara fel. Granska viktiga beslut och använd den inte för bedömningar om människor.</p></div>`;}

function guide(){return title('FRÅN NYFIKENHET TILL NYTTA','En liten AI. På riktigt.','Signal är en verkstad där du både kan använda maskininlärning och se hur den fungerar.')+`<div class="guide"><section class="panel"><h2>Från din kunskap till ett eget verktyg</h2><div class="number-card"><span>01</span><div><h3>Välj en tydlig uppgift</h3><p>Sortera bokningsfrågor och övriga frågor. Skilj felrapporter från förbättringsförslag. Eller skapa en egen indelning. Modellen väljer en kategori per text.</p></div></div><div class="number-card"><span>02</span><div><h3>Lär med exempel</h3><p>Skapa minst två kategorier. Lägg in minst fyra olika exempel per kategori. Lägg gärna till 15–30 varierade formuleringar i varje. En CSV med kolumnerna <code>text;kategori</code> fungerar också.</p></div></div><div class="number-card"><span>03</span><div><h3>Träna, testa och rätta</h3><p>Signal jämför två statistiska textmodeller med tre testomgångar. Vokabulären lärs från enbart träningsdelen varje gång. Sedan tränas den valda varianten på alla exempel. Dina rättelser läggs till som träningsdata; välj ”Träna om” för att lära in dem.</p></div></div><div class="number-card"><span>04</span><div><h3>Använd eller ta med din specialist</h3><p>Klistra in texter, prioritera granskningskön och exportera resultat som CSV. Du kan också exportera modellen till JSON eller hela specialistverktyget som en fristående HTML-sida. HTML-sidan kör modellen lokalt, utan originaltexterna.</p></div></div></section><section class="panel"><h2>Vad lär sig AI:n egentligen?</h2><p>Text delas upp i ord, ordpar och i en av varianterna även korta ordfragment. TF-IDF väger deras betydelse. En linjär softmax-klassificerare justerar tusentals vikter med gradientnedstigning. Kategoriernas namn är inga regler: det är dina märkta exempel som bestämmer mönstren.</p><p>Signal väljer varianten med högst macro-F1 i korsvalideringen. Det är maskininlärning från dina data, med en förhållandevis enkel modell. Det finns ingen språkmodell, ingen dold AI-tjänst och inget externt API.</p><p>Granskningskön prioriteras efter hur svårbedömd texten är: jämna modellpoäng, få kända ord eller svag likhet med kategorins träningsexempel. Det är heuristiska signaler, inte en kalibrerad riskbedömning.</p><p class="hint">Metodreferenser: <a href="https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction" target="_blank" rel="noopener">scikit-learn: text features</a> · <a href="https://scikit-learn.org/stable/common_pitfalls.html#data-leakage" target="_blank" rel="noopener">Data leakage</a> · <a href="https://scikit-learn.org/stable/modules/cross_validation.html" target="_blank" rel="noopener">Cross-validation</a>. Signal har en egen JavaScript-implementation, ingen scikit-learn-runtime.</p></section><section class="panel"><h2>Din data, din enhet</h2><p>Träning och klassificering sker i din webbläsare. Projektet sparas automatiskt i IndexedDB på just den här enheten och adressen. Ingen projekttext skickas till någon AI-tjänst. Webbhotellet får vanliga sidförfrågningar; projektinnehållet ingår inte i dem.</p><p>Webbläsardata kan rensas eller försvinna. Ta en säkerhetskopia via ”Spara & exportera”. Flytta projektet genom att exportera och importera kopian. Filen innehåller dina texter och är inte krypterad. Modellfiler och fristående AI-verktyg innehåller inlärda vikter som också bör hanteras varsamt.</p><p>Efter första besöket försöker Signal spara appfilerna för offlineanvändning. Kontrollera offlinefunktionen på din enhet innan du behöver den. Fristående HTML-export behöver inget nätverk; filöppning och nedladdning på fysisk iPhone har inte verifierats.</p></section><section class="panel"><h2>Ett 10-minuterspass för din nästa AI-workshop</h2><p><strong>Minut 0–2:</strong> Öppna Kundservice-demot och träna modellen. Låt gruppen gissa vilka mönster AI:n hittar.</p><p><strong>Minut 2–5:</strong> Prova en ny text, en med två ärenden och en helt orelaterad fråga. Titta på förslag, modellpoäng och granskningsorsaker.</p><p><strong>Minut 5–8:</strong> Rätta ett svårt fall och träna om. Diskutera varför en rättelse inte kan garantera att alla liknande fall blir rätt.</p><p><strong>Minut 8–10:</strong> Visa korsvalideringen och exportera ett eget AI-verktyg. Diskutera vad ni skulle behöva testa före verklig användning.</p><button class="button" data-action="demo" data-id="support">Starta workshop-demot ↗</button></section><section class="panel"><h2>Varför just Signal, Marcus?</h2><p>Dina Snake- och RL-experiment visar hur roligt lärande kan bli när det går att se. MPAI behöver verktyg som gör AI begripligt i en workshop. Föräldrahjälpen har samma pedagogiska kärna: hjälp i rätt ögonblick. Och dina spelprojekt visar värdet av låg tröskel och direkt respons.</p><p>Signal knyter ihop det i något du kan använda direkt: lär en specialist, se vad den faktiskt klarar och ta med den som ett eget verktyg. Färdiga exempel är fiktiva. Projektet innehåller inga kunduppgifter från dina repon.</p></section></div>`;}

function render(){
  $('#project-label').textContent=state.name;
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
  $('#queue-count').textContent=state.queue.length||'';
  $('#main').innerHTML=({home,sort,discover,teach,results,guide}[view])();
  for(const [id,value] of Object.entries(drafts)){const field=document.getElementById(id);if(field)field.value=value;}
  if($('#test-text')&&state.model)$('#single-result').innerHTML=predictions($('#test-text').value);
  // Disable mutations in read-only tabs or while a snapshot is training.
  if(readOnly||worker)document.querySelectorAll('#main button:not([data-nav]),#main input,#main textarea,#main select').forEach(x=>x.disabled=true);
}

function discover(){return title('HITTA MÖNSTRET INNAN DU KAN NAMNGE DET','Vad gömmer sig i texten?','Lägg in en samling kommentarer. AI:n grupperar liknande texter utan facit. Du namnger teman och väljer vilka exempel den ska lära sig av.')+`<section class="panel"><div class="section-heading"><div><h2>Upptäck teman i en samling</h2><p>En text per rad. 6–1 500 unika texter. Inga kategorier behövs.</p></div><button class="button tiny subtle" data-action="discover-demo">Prova fiktiv feedback</button></div><label for="discovery-text">Texter att undersöka</label><textarea id="discovery-text" rows="6" maxlength="1000000" placeholder="Klistra in kommentarer, förfrågningar eller idéer…">${esc(discovery.text)}</textarea><div class="queue-controls" style="margin:16px 0 0"><label class="threshold" for="discovery-k">Antal teman <select id="discovery-k">${[2,3,4,5,6,7,8].map(k=>`<option value="${k}" ${k===discovery.k?'selected':''}>${k}</option>`).join('')}</select></label><div class="actions">${state.queue.length>=6?'<button class="button subtle" data-action="discover-queue">Använd texter från kön</button>':''}<button class="button" data-action="find-themes">Hitta dolda teman ⠿</button></div></div><p class="hint" style="margin-bottom:0;margin-top:14px">Grupperingen bygger på liknande ordmönster, inte på en språkmodells förståelse. Ett tema kan innehålla flera olika avsikter. Granska innan du märker upp. Tema-arbetsytan är tillfällig; valda träningsexempel sparas först när du lägger till dem.</p></section>${discovery.clusters?`<div class="section-heading" style="margin-top:28px"><div><h2>${discovery.clusters.length} teman att undersöka</h2><p>Ordningen visar de största grupperna först. Överst i varje grupp ligger de mest typiska texterna.</p></div></div><div class="theme-grid">${discovery.clusters.map((c,i)=>`<section class="panel theme-card"><div class="section-heading"><div><div class="eyebrow muted">TEMA ${String(i+1).padStart(2,'0')} · ${c.members.length} TEXTER</div><h2 style="margin:12px 0 0">${c.terms.slice(0,3).map(esc).join(' · ')}</h2></div><span class="badge violet">${pct(c.cohesion)} likhet</span></div><p class="hint">Snittlikhet mot gruppens centrum. Det är inte ett kvalitetsmått.</p><label for="theme-name-${i}">Vad skulle du kalla det här temat?</label><input id="theme-name-${i}" class="wide" maxlength="60" placeholder="Ditt kategorinamn"><div class="theme-samples">${c.members.map((m,j)=>`<label class="theme-sample"><input type="checkbox" data-theme="${i}" data-member="${j}"><span>${esc(m.text)}</span></label>`).join('')}</div><button class="button wide" data-action="learn-theme" data-cluster="${i}">Lär av markerade texter +</button><p class="hint" style="margin-bottom:0;margin-top:12px">Du godkänner kategorin för varje markerad text. Befintliga exempel med samma text får din nya kategori.</p></section>`).join('')}</div>${state.dirty?trainBar():''}`:`<section class="panel empty"><div class="empty-icon">⠿</div><h2>Du behöver inte veta svaret först.</h2><p>Hitta återkommande behov i feedback. Upptäck typer av förfrågningar. Gör en ostrukturerad texthög till början på en egen AI.</p></section>`}`;}

function startTraining(){
  if(!canEdit())return;
  try{
    state.rows=cleanRows(state.rows);
    if(state.labels.some(l=>state.rows.filter(r=>r.label===l).length<4))throw new Error('Varje kategori behöver minst fyra olika exempel.');
    worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
    $('#training').hidden=false;$('#training-progress').value=0;$('#training-text').textContent='Jämför två modeller på separata datadelar…';render();
    worker.onmessage=e=>{
      const data=e.data;
      if(data.type==='progress'){$('#training-progress').value=data.step;$('#training-text').textContent=`Steg ${data.step} av 7 · ${data.mode==='hybrid'?'ord + ordfragment':'ord + ordpar'}`;}
      if(data.type==='result'){
        worker.terminate();worker=null;state.model=data.model;state.report=data.report;state.dirty=false;state.blindResult=null;state.revision++;$('#training').hidden=true;scheduleSave();render();toast('Din specialist är tränad. Dags att prova något nytt.');
      }
      if(data.type==='error'){stopTraining();toast(data.message);}
    };
    worker.onerror=()=>{stopTraining();toast('Träningen avbröts. Prova igen med färre exempel.');};
    worker.postMessage({rows:state.rows});
  }catch(e){stopTraining();toast(e.message);}
}
function stopTraining(){if(worker){worker.terminate();worker=null;}$('#training').hidden=true;render();}
function useDemo(id){const p=PRESETS.find(x=>x.id===id);if(!p)return;state={...emptyState(),name:p.name+' · demo',rows:structuredClone(p.rows),labels:[...p.labels],preset:id,queue:p.queue.map(text=>({id:uid(),text,confirmed:false}))};drafts={};selectedLabels.clear();closeModal();scheduleSave();view='sort';sortTab='batch';filter='all';startTraining();history.replaceState(null,'','#sort');}
function addExample(text,label){
  const key=normalize(text);const i=state.rows.findIndex(r=>normalize(r.text)===key);
  let next=[...state.rows];if(i>=0)next[i]={text:text.trim(),label};else next.push({text:text.trim(),label});
  next=cleanRows(next);state.rows=next;if(!state.labels.includes(label))state.labels.push(label);dirty();
  return i>=0?'Exemplet är uppdaterat.':'Ett nytt exempel är tillagt.';
}
function addQueue(texts){
  if(state.queue.length+texts.length>2000)throw new Error('Högst 2 000 texter i kön. Exportera och töm kön för att fortsätta.');
  if(texts.some(t=>!t.trim()||t.length>12000))throw new Error('Varje text behöver vara 1–12 000 tecken.');
  state.queue.push(...texts.map(text=>({id:uid(),text:text.trim(),confirmed:false})));state.revision++;scheduleSave();
}
function runTest(rows){
  const trainKeys=new Set(state.rows.map(r=>normalize(r.text)));
  const duplicates=rows.filter(r=>trainKeys.has(normalize(r.text)));
  if(duplicates.length)throw new Error(`${duplicates.length} testtexter finns också bland träningsexemplen. Använd ett nytt testmaterial.`);
  if(rows.some(r=>!r.label||!state.model.labels.includes(r.label)))throw new Error('Alla testtexter behöver ett facit som finns bland modellens kategorier.');
  const cases=rows.map(r=>{const p=predict(state.model,r.text,state.threshold);return {...r,predicted:p.label,review:p.review,right:p.label===r.label};});
  state.blindResult={cases,correct:cases.filter(c=>c.right).length,review:cases.filter(c=>c.review).length};state.revision++;scheduleSave();render();toast('Provet är klart. Facit har inte lärts in.');
}

function filesDialog(){modal(`${dialogHeader('Spara & exportera')}<p>Ditt projekt sparas lokalt. Välj vad du vill ta med dig.</p><div class="file-options"><button class="file-option" data-action="backup"><strong>↓ Säkerhetskopia av projektet</strong><span>Alla exempel, kategorier, modellen och kön. Kan importeras för att fortsätta på en annan enhet. Innehåller dina originaltexter.</span></button><button class="file-option" data-action="standalone" ${!state.model||state.dirty?'disabled':''}><strong>↗ Mitt eget AI-verktyg</strong><span>En fristående HTML-fil med din tränade specialist. Öppnas utan nätverk. Originaltexterna följer inte med.</span></button><button class="file-option" data-action="model-json" ${!state.model||state.dirty?'disabled':''}><strong>↓ Enbart den tränade modellen</strong><span>Vikter och vokabulär i JSON-format. Kan importeras i Signal.</span></button><button class="file-option" data-action="export-training"><strong>↓ Träningsexempel som CSV</strong><span>Text och kategori för dina ${state.rows.length} exempel.</span></button><button class="file-option" data-action="import"><strong>↥ Importera projekt, modell eller CSV</strong><span>CSV med text och kategori läggs till som träningsexempel. Rader utan kategori hamnar i kön.</span></button><button class="file-option" data-action="csv-template"><strong>↓ Hämta en tom CSV-mall</strong><span>Rätt kolumner och en exempelrad att ersätta med din egen text.</span></button></div><p class="hint">CSV-export skyddar celler som kan tolkas som kalkylbladsformler genom att lägga till en apostrof.</p>`);}
function validateProject(p){
  if(p?.format!=='mpai-signal-project'||p.version!==1||typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw new Error('Ogiltigt projektformat.');
  const rows=cleanRows(p.rows);
  if(!Array.isArray(p.labels)||p.labels.length>12||p.labels.some(l=>typeof l!=='string'||!l.trim()||l.length>60)||new Set(p.labels).size!==p.labels.length||rows.some(r=>!p.labels.includes(r.label)))throw new Error('Ogiltiga kategorier.');
  if(!Array.isArray(p.queue)||p.queue.length>2000||p.queue.some(q=>typeof q.text!=='string'||!q.text.trim()||q.text.length>12000||(q.label&&!p.labels.includes(q.label))))throw new Error('Ogiltig textkö.');
  const model=p.model?validateModel(p.model):null;
  if(model&&model.labels.some(l=>!p.labels.includes(l)))throw new Error('Modellen och kategorierna hör inte ihop.');
  // Reports from files are deliberately not trusted as verified measurements.
  return {...emptyState(),name:p.name,rows,labels:[...p.labels],queue:p.queue.map(q=>({id:uid(),text:q.text,confirmed:q.confirmed===true,label:q.label||undefined})),model,dirty:!!p.dirty,preset:PRESETS.some(x=>x.id===p.preset)?p.preset:null,threshold:typeof p.threshold==='number'&&p.threshold>=.4&&p.threshold<=.95?p.threshold:.64,feedbackCount:Number.isInteger(p.feedbackCount)&&p.feedbackCount>=0?Math.min(p.feedbackCount,1000000):0};
}
let importPurpose='normal';
async function importFile(file){
  if(!canEdit())return;
  try{
    if(file.size>20_000_000)throw new Error('Importfilen får vara högst 20 MB.');
    const text=await file.text();
    if(file.name.toLowerCase().endsWith('.csv')){
      const rows=parseCSV(text);
      if(importPurpose==='test'){if(!state.model||state.dirty)throw new Error('Träna modellen före sluttest.');runTest(rows);return;}
      pendingImport={type:'csv',rows};
      modal(`${dialogHeader('Lägg till CSV-innehållet?')}<p>${rows.filter(r=>r.label).length} märkta texter läggs till som träningsexempel. ${rows.filter(r=>!r.label).length} texter utan kategori läggs i kön. Ditt befintliga innehåll behålls.</p><div class="flex-end"><button class="button subtle" data-action="close">Avbryt</button><button class="button" data-action="commit-import">Lägg till</button></div>`);
    }else{
      if(importPurpose==='test')throw new Error('Välj en CSV med text och kategori för sluttestet.');
      const data=JSON.parse(text);
      pendingImport={type:data.format==='mpai-signal-project'?'project':'model',data:data.format==='mpai-signal-project'?validateProject(data):validateModel(data)};
      confirmAction('Ersätt det öppna projektet?','Den här filen ersätter projektet i den här webbläsaren. Exportera först en säkerhetskopia om du vill behålla det nuvarande.','commit-import');
    }
  }catch(e){toast(e instanceof SyntaxError?'Filen innehåller inte giltig JSON.':e.message);}
  finally{$('#import-file').value='';importPurpose='normal';}
}
function commitImport(){
  if(!pendingImport||!canEdit())return;
  try{
    const p=pendingImport;
    if(p.type==='project')state=p.data;
    if(p.type==='model')state={...emptyState(),name:'Importerad specialist',model:p.data,labels:[...p.data.labels]};
    if(p.type==='csv'){
      const labeled=p.rows.filter(r=>r.label),unlabeled=p.rows.filter(r=>!r.label),merged=cleanRows([...state.rows,...labeled]);
      const labels=[...new Set([...state.labels,...labeled.map(r=>r.label)])];if(labels.length>12)throw new Error('Importen skulle ge fler än tolv kategorier.');
      if(state.queue.length+unlabeled.length>2000)throw new Error('Importen skulle ge fler än 2 000 texter i kön.');
      // Validate every change before mutating project state.
      state.rows=merged;state.labels=labels;state.queue.push(...unlabeled.map(r=>({id:uid(),text:r.text,confirmed:false})));if(labeled.length)dirty();
    }
    pendingImport=null;selectedLabels.clear();state.revision++;closeModal();scheduleSave();navigate(p.type==='csv'?'teach':'sort');toast('Importen är klar.');
  }catch(e){toast(e.message);}
}

function exportStandalone(){
  if(!state.model||state.dirty){toast('Träna modellen först.');return;}
  try{
    if(!engineSource)throw new Error('Exportmotorn laddas fortfarande. Försök igen om en stund.');
    const html=buildSpecialistHTML(engineSource,serializeModel(state.model),state.name,state.threshold);
    download(html,'min-signal-specialist.html','text/html');closeModal();toast('Ditt fristående AI-verktyg är exporterat.');
  }catch(e){toast(e.message);}
}

document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action;
  try{
    if(a==='close'){closeModal();return;}
    if(a==='files'){filesDialog();return;}
    if(a==='cancel-train'){stopTraining();toast('Träningen avbröts. Projektet är kvar.');return;}
    if(a==='open-sort'){navigate('sort');return;}
    if(a==='sort-tab'){sortTab=b.dataset.tab;render();return;}
    if(a==='filter'){filter=b.dataset.filter;render();return;}
    if(a==='standalone'){await exportStandalone();return;}
    if(a==='backup'){download(JSON.stringify({...state,model:state.model?serializeModel(state.model):null},null,2),'signal-projekt.json');toast('Säkerhetskopian är exporterad.');return;}
    if(a==='model-json'){if(state.model&&!state.dirty)download(JSON.stringify(serializeModel(state.model)),'signal-modell.json');return;}
    if(a==='export-training'){download(exportCSV([['text','kategori'],...state.rows.map(r=>[r.text,r.label])]),'signal-exempel.csv','text/csv;charset=utf-8');return;}
    if(a==='csv-template'){download(exportCSV([['text','kategori'],['Ersätt den här texten med ett eget exempel','Min kategori']]),'signal-mall.csv','text/csv;charset=utf-8');return;}
    if(a==='export-results'){
      const rows=state.queue.map(q=>{const p=predict(state.model,q.text,state.threshold);return [q.text,q.confirmed?q.label:p.label,q.confirmed?'Bekräftad':p.review?'Granska':'Förslag',p.score.toFixed(4),q.confirmed?'Mänskligt beslut':p.reasons.join(', '),state.dirty?'Tidigare modell':'Aktuell modell'];});
      download(exportCSV([['text','kategori','status','modellpoäng','orsak','modellstatus'],...rows]),'signal-resultat.csv','text/csv;charset=utf-8');return;
    }
    if(!canEdit())return;
    if(a==='rename'){modal(`${dialogHeader('Ge din specialist ett namn')}<form id="rename-form"><label for="project-name">Projektnamn</label><input id="project-name" class="wide" maxlength="80" value="${esc(state.name)}" required><div class="flex-end"><button class="button">Spara namnet</button></div></form>`);return;}
    if(a==='demo'){if(state.rows.length||state.model||state.queue.length)confirmAction('Öppna ett nytt demo?','Demot ersätter ditt öppna projekt. Exportera en säkerhetskopia först om du vill behålla ditt arbete.','confirm-demo',`data-id="${b.dataset.id}"`);else useDemo(b.dataset.id);return;}
    if(a==='confirm-demo'){useDemo(b.dataset.id);return;}
    if(a==='new'){if(state.rows.length||state.model||state.queue.length)confirmAction('Skapa en ny specialist?','Det öppna projektet ersätts. Ta en säkerhetskopia först om du vill behålla det.','confirm-new');else{navigate('teach');}return;}
    if(a==='confirm-new'){state=emptyState();drafts={};discovery={text:'',k:3,clusters:null};closeModal();scheduleSave();navigate('teach');return;}
    if(a==='train'){startTraining();return;}
    if(a==='discover-demo'){discovery.text=DISCOVERY_DEMO.join('\n');drafts['discovery-text']=discovery.text;discovery.clusters=null;navigate('discover');return;}
    if(a==='discover-queue'){discovery.text=state.queue.map(q=>q.text.replace(/\s+/g,' ')).join('\n');drafts['discovery-text']=discovery.text;discovery.clusters=null;render();return;}
    if(a==='find-themes'){
      discovery.text=$('#discovery-text').value;discovery.k=Number($('#discovery-k').value);
      const texts=discovery.text.split(/\r?\n/).map(t=>t.trim()).filter(Boolean);
      b.disabled=true;b.textContent='Letar efter mönster…';
      await new Promise(resolve=>setTimeout(resolve,30));discovery.clusters=findThemes(texts,discovery.k);render();toast('Grupperna är klara. Du bestämmer vad de betyder.');return;
    }
    if(a==='learn-theme'){
      const i=Number(b.dataset.cluster),c=discovery.clusters[i],label=$(`#theme-name-${i}`).value.trim();
      if(!label)throw new Error('Ge temat ett kategorinamn först.');
      const indices=[...document.querySelectorAll(`input[data-theme="${i}"]:checked`)].map(x=>Number(x.dataset.member));
      if(!indices.length)throw new Error('Markera först de texter som hör till din kategori.');
      const labels=[...new Set([...state.labels,label])];if(labels.length>12)throw new Error('Högst tolv kategorier per specialist.');
      const merged=[...state.rows];for(const j of indices){const r={text:c.members[j].text,label},at=merged.findIndex(x=>normalize(x.text)===normalize(r.text));if(at<0)merged.push(r);else merged[at]=r;}
      state.rows=cleanRows(merged);state.labels=labels;dirty();toast(indices.length+' granskade exempel är tillagda. Fortsätt i Lär AI:n.');navigate('teach');return;
    }
    if(a==='add-batch'){const texts=$('#batch-text').value.split(/\r?\n/).map(t=>t.trim()).filter(Boolean);if(!texts.length)throw new Error('Skriv minst en text först.');addQueue(texts);drafts['batch-text']='';filter='all';render();toast(texts.length+' texter är sorterade.');return;}
    if(a==='learn-single'){const text=$('#test-text').value.trim();if(!text)throw new Error('Skriv en text först.');const label=$('#single-label').value;if(!label)throw new Error('Välj den rätta kategorin först.');toast(addExample(text,label)+' Träna om när du är redo.');render();return;}
    if(a==='learn-queue'){const q=state.queue.find(q=>q.id===b.dataset.id),label=selectedLabels.get(q.id)||q.label||predict(state.model,q.text,state.threshold).label;addExample(q.text,label);if(!q.confirmed)state.feedbackCount++;q.confirmed=true;q.label=label;scheduleSave();render();toast('Beslutet är sparat som exempel. Träna om för att lära in det.');return;}
    if(a==='clear-queue'){confirmAction('Töm sorteringskön?','Alla texter i kön tas bort. Träningsexempel och modell behålls. Exportera resultaten först om du behöver dem.','confirm-clear-queue');return;}
    if(a==='confirm-clear-queue'){state.queue=[];selectedLabels.clear();closeModal();scheduleSave();render();return;}
    if(a==='delete-example'){state.rows.splice(Number(b.dataset.index),1);dirty();render();return;}
    if(a==='delete-category'){confirmAction('Radera kategorin?','Alla träningsexempel i kategorin raderas. Den tidigare modellen och dess rapport tas bort eftersom kategorierna ändras.','confirm-delete-category',`data-label="${esc(b.dataset.label)}"`);return;}
    if(a==='confirm-delete-category'){state.rows=state.rows.filter(r=>r.label!==b.dataset.label);state.labels=state.labels.filter(l=>l!==b.dataset.label);state.model=null;state.report=null;state.blindResult=null;state.dirty=false;state.queue.forEach(q=>{if(q.label===b.dataset.label){q.confirmed=false;delete q.label;}});closeModal();scheduleSave();render();return;}
    if(a==='import'||a==='test-csv'){importPurpose=a==='test-csv'?'test':'normal';closeModal();$('#import-file').click();return;}
    if(a==='commit-import'){commitImport();return;}
    if(a==='blind-test'){const p=PRESETS.find(p=>p.id===state.preset);if(p&&!state.dirty)runTest(p.blind);return;}
  }catch(error){toast(error.message);if(a==='find-themes')render();}
});
document.addEventListener('submit',e=>{
  if(!['example-form','category-form','rename-form'].includes(e.target.id))return;e.preventDefault();if(!canEdit())return;
  try{
    if(e.target.id==='category-form'){
      const label=$('#new-category').value.trim();if(!label)throw new Error('Skriv ett kategorinamn.');
      if(state.labels.includes(label))throw new Error('Kategorin finns redan.');if(state.labels.length>=12)throw new Error('Högst tolv kategorier.');
      state.labels.push(label);drafts['new-category']='';dirty();render();toast('Kategorin är tillagd. Lägg in några exempel.');
    }
    if(e.target.id==='example-form'){const text=$('#example-text').value.trim(),label=$('#example-label').value;if(!text)throw new Error('Skriv en exempeltext.');toast(addExample(text,label));drafts['example-text']='';render();$('#example-text').focus();}
    if(e.target.id==='rename-form'){const name=$('#project-name').value.trim();if(!name)return;state.name=name;state.revision++;scheduleSave();closeModal();render();}
  }catch(error){toast(error.message);}
});
document.addEventListener('input',e=>{
  if(['test-text','batch-text','example-text','new-category','discovery-text'].includes(e.target.id))drafts[e.target.id]=e.target.value;
  if(e.target.id==='test-text'){clearTimeout(predictTimer);const text=e.target.value;predictTimer=setTimeout(()=>{if($('#single-result')&&state.model)$('#single-result').innerHTML=predictions(text);},130);}
  if(e.target.id==='threshold'){$('#threshold-value').textContent=e.target.value+'%';}
});
document.addEventListener('change',e=>{
  if(e.target.dataset.queueLabel)selectedLabels.set(e.target.dataset.queueLabel,e.target.value);
  if(e.target.id==='threshold'&&canEdit()){state.threshold=Number(e.target.value)/100;scheduleSave();render();}
  if(e.target.id==='import-file'&&e.target.files[0])importFile(e.target.files[0]);
});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});

async function boot(){
  if(navigator.locks){
    // One writable tab avoids silently overwriting a different tab's project.
    const acquired=new Promise(resolve=>{navigator.locks.request('mpai-signal-editor',{ifAvailable:true},async lock=>{
      if(!lock){readOnly=true;resolve();return;}
      resolve();await new Promise(release=>{editorRelease=release;});
    }).catch(()=>resolve());});await acquired;
  }
  try{const saved=await loadProject();if(saved){state=validateProject(saved);if(saved.report&&saved.model){
    // Only locally generated reports are rendered after basic shape validation.
    const r=saved.report,k=state.model.labels.length;
    if(Array.isArray(r.labels)&&r.labels.length===k&&r.labels.every((l,i)=>l===state.model.labels[i])&&Array.isArray(r.matrix)&&r.matrix.length===k&&r.matrix.every(a=>Array.isArray(a)&&a.length===k&&a.every(Number.isFinite))&&Array.isArray(r.candidates)&&r.candidates.length===2&&r.candidates.every(c=>['word','hybrid'].includes(c.mode)&&Number.isFinite(c.accuracy)&&Number.isFinite(c.macroF1))&&Number.isFinite(r.accuracy)&&Number.isFinite(r.macroF1))state.report=r;
  }}}catch{saveFailed=true;setStorageWarning('Sparat projekt kunde inte öppnas. Importera en säkerhetskopia eller börja ett nytt projekt.');}
  if(readOnly)setStorageWarning('En annan flik redigerar projektet. Här kan du titta och exportera. Stäng den andra fliken och ladda om för att redigera här.');
  view=['home','sort','discover','teach','results','guide'].includes(location.hash.slice(1))?location.hash.slice(1):'home';render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
await boot();
