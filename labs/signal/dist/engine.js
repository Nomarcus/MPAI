/* MPAI Signal — dependency-free supervised text learning. */
export const VERSION = 1;
const STOP = new Set('och att det den de en ett är jag vi du ni som på i till för med av om har kan ska vill från så men också the a an and is are to of in for with this that be have please hej tack mvh'.split(' '));
export function normalize(text) { return String(text).normalize('NFKC').toLocaleLowerCase('sv').replace(/\s+/g, ' ').trim(); }
export function words(text) { return normalize(text).match(/[\p{L}\p{N}]+/gu) || []; }
export function features(text, mode = 'hybrid') {
  const tokens = words(text.slice(0, 12000));
  const out = new Map();
  const add = (s, weight=1) => out.set(s, (out.get(s)||0)+weight);
  const useful = tokens.filter(w => w.length > 1 && !STOP.has(w));
  useful.forEach(w => add('w:'+w));
  for (let i=0;i<tokens.length-1;i++) if (!STOP.has(tokens[i]) || !STOP.has(tokens[i+1])) add('b:'+tokens[i]+' '+tokens[i+1], 0.7);
  if (mode === 'hybrid') for(const w of useful) {
    const s=' '+w+' ';
    for(let n=3;n<=4;n++) for(let i=0;i<=s.length-n;i++) add('c:'+s.slice(i,i+n),0.22);
  }
  return out;
}
export function vocabulary(rows, mode='hybrid', limit=6000) {
  const df = new Map();
  for(const r of rows) for(const k of features(r.text,mode).keys()) df.set(k,(df.get(k)||0)+1);
  // Word evidence gets a place even when long texts produce many character grams.
  const names = [...df.keys()].sort((a,b) => ((df.get(b)+(b.startsWith('c:')?0:1))-(df.get(a)+(a.startsWith('c:')?0:1))) || a.localeCompare(b)).slice(0,limit);
  return { names, idf: names.map(k=>Math.log((1+rows.length)/(1+df.get(k)))+1), mode };
}
function prepare(v) { if(!v.index) Object.defineProperty(v,'index',{value:new Map(v.names.map((x,i)=>[x,i])),enumerable:false}); return v.index; }
export function vectorize(text,v) {
  const index=prepare(v), f=features(text,v.mode), entries=[];
  let norm=0, known=0, total=0;
  for(const [k,count] of f) {
    if(k.startsWith('w:')) { total++; if(index.has(k)) known++; }
    const i=index.get(k); if(i===undefined) continue;
    const x = Math.log1p(count)*v.idf[i]; entries.push([i,x]); norm+=x*x;
  }
  norm=Math.sqrt(norm)||1;
  return { x:entries.map(([i,n])=>[i,n/norm]), coverage:total?known/total:0 };
}
export function seeded(seed=42) { return ()=>{ seed=(Math.imul(1664525,seed)+1013904223)>>>0; return seed/4294967296; }; }
function shuffle(a,rng) { const b=[...a]; for(let i=b.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }
export function softmax(logits) {
  const max=Math.max(...logits), p=logits.map(x=>Math.exp(x-max)), s=p.reduce((a,b)=>a+b,0);
  return p.map(x=>x/s);
}
function logits(model,x) { return model.labels.map((_,k)=>{ let s=model.bias[k]; for(const [j,v] of x) s+=model.weights[k][j]*v; return s; }); }
export function fit(rows, { mode='hybrid', epochs=110, seed=42 }={}) {
  const labels=[...new Set(rows.map(r=>r.label))].sort();
  if(labels.length<2) throw new Error('Det behövs minst två kategorier.');
  const vocab=vocabulary(rows,mode), d=vocab.names.length, k=labels.length;
  if(!d) throw new Error('Exemplen behöver innehålla text med ord.');
  const vectors=rows.map(r=>({...vectorize(r.text,vocab), y:labels.indexOf(r.label)}));
  const model={version:VERSION,kind:'signal-softmax',labels,vocab,weights:Array.from({length:k},()=>new Float64Array(d)),bias:Array(k).fill(0)};
  const rng=seeded(seed), counts=labels.map(l=>rows.filter(r=>r.label===l).length);
  const loss=[];
  for(let epoch=0;epoch<epochs;epoch++) {
    const lr=0.65/(1+epoch/80); let epochLoss=0;
    // L2 penalty per epoch; sparse gradient updates below.
    for(const w of model.weights) for(let j=0;j<d;j++) w[j]*=0.998;
    for(const row of shuffle(vectors,rng)) {
      const p=softmax(logits(model,row.x));
      epochLoss-=Math.log(Math.max(p[row.y],1e-12));
      const balance=Math.min(3,rows.length/(k*counts[row.y]));
      for(let c=0;c<k;c++) {
        const grad=(p[c]-(c===row.y?1:0))*lr*balance;
        for(const [j,v] of row.x) model.weights[c][j]-=grad*v;
        model.bias[c]-=grad*0.12;
      }
    }
    if(epoch%5===0 || epoch===epochs-1) loss.push(epochLoss/rows.length);
  }
  model.loss=loss;
  // Prototypes contain features, never the original training texts.
  model.prototypes=labels.map((_,c)=>{
    const a=new Float64Array(d); for(const r of vectors) if(r.y===c) for(const [j,v] of r.x) a[j]+=v/counts[c];
    const norm=Math.hypot(...a)||1; return [...a].map(v=>v/norm);
  });
  model.samples=rows.length;
  return model;
}
export function predict(model,text,threshold=0.64) {
  const {x,coverage}=vectorize(text,model.vocab), probabilities=softmax(logits(model,x));
  const ranking=probabilities.map((score,index)=>({label:model.labels[index],score,index})).sort((a,b)=>b.score-a.score);
  const top=ranking[0], next=ranking[1], similarity=x.reduce((s,[j,v])=>s+v*model.prototypes[top.index][j],0);
  const reasons=[];
  if(!text.trim() || !x.length || coverage===0) reasons.push('Inga kända ord');
  else if(coverage<0.3) reasons.push('För få kända ord');
  if(top.score<threshold) reasons.push('Låg modellpoäng');
  if(top.score-next.score<0.15) reasons.push('Två kategorier ligger nära');
  if(similarity<0.13) reasons.push('Olikt träningsexemplen');
  const evidence=x.filter(([j])=>model.vocab.names[j].startsWith('w:')).map(([j,v])=>({word:model.vocab.names[j].slice(2),weight:(model.weights[top.index][j]-model.weights[next.index][j])*v})).filter(e=>e.weight>0).sort((a,b)=>b.weight-a.weight).slice(0,6);
  const entropy=-probabilities.reduce((s,p)=>s+p*Math.log(Math.max(p,1e-12)),0)/Math.log(model.labels.length);
  return {label:top.label,score:top.score,ranking:ranking.map(({label,score})=>({label,score})),review:!!reasons.length,reasons,evidence,coverage,similarity,uncertainty:Math.max(entropy,1-coverage,1-similarity)};
}
export function cleanRows(rows) {
  if(!Array.isArray(rows) || rows.length>5000) throw new Error('Högst 5 000 exempel per projekt.');
  const seen=new Map(), out=[];
  for(const r of rows) {
    if(typeof r?.text!=='string' || typeof r?.label!=='string') throw new Error('Varje exempel behöver text och kategori.');
    const text=r.text.trim(), label=r.label.trim();
    if(!text || text.length>12000 || !label || label.length>60) throw new Error('Text: 1–12 000 tecken. Kategori: 1–60 tecken.');
    const key=normalize(text);
    if(seen.has(key)) { if(seen.get(key)!==label) throw new Error('Samma text har två olika kategorier. Rätta konflikten först.'); continue; }
    seen.set(key,label); out.push({text,label});
  }
  if(new Set(out.map(r=>r.label)).size>12) throw new Error('Högst 12 kategorier stöds.');
  return out;
}
export function metrics(truth, predicted, labels) {
  const matrix=labels.map(()=>labels.map(()=>0));
  truth.forEach((l,i)=>matrix[labels.indexOf(l)][labels.indexOf(predicted[i])]++);
  const correct=matrix.reduce((s,row,i)=>s+row[i],0);
  const perClass=labels.map((label,i)=>{
    const tp=matrix[i][i], support=matrix[i].reduce((a,b)=>a+b,0), guesses=matrix.reduce((s,r)=>s+r[i],0);
    const precision=guesses?tp/guesses:0, recall=support?tp/support:0;
    return {label,support,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};
  });
  return {accuracy:truth.length?correct/truth.length:0,macroF1:perClass.reduce((s,x)=>s+x.f1,0)/labels.length,n:truth.length,matrix,perClass,labels};
}
export function folds(rows,n=3,seed=313) {
  const rng=seeded(seed), result=Array.from({length:n},()=>[]);
  for(const label of [...new Set(rows.map(r=>r.label))].sort()) shuffle(rows.map((r,i)=>r.label===label?i:-1).filter(i=>i>=0),rng).forEach((i,j)=>result[j%n].push(i));
  return result;
}
export function trainAutoML(input,onProgress=()=>{}) {
  const rows=cleanRows(input), labels=[...new Set(rows.map(r=>r.label))].sort();
  if(labels.length<2) throw new Error('Lägg till minst två kategorier.');
  if(labels.some(l=>rows.filter(r=>r.label===l).length<4)) throw new Error('Lägg till minst fyra olika exempel per kategori.');
  const partitions=folds(rows), candidates=[];
  for(const mode of ['word','hybrid']) {
    const truth=[], guessed=[];
    for(let fold=0;fold<3;fold++) {
      const testIndices=new Set(partitions[fold]), train=rows.filter((_,i)=>!testIndices.has(i));
      const model=fit(train,{mode,epochs:80});
      for(const i of testIndices) { truth.push(rows[i].label); guessed.push(predict(model,rows[i].text).label); }
      onProgress({step:candidates.length*3+fold+1,total:7,mode});
    }
    candidates.push({mode,...metrics(truth,guessed,labels)});
  }
  const winner=[...candidates].sort((a,b)=>b.macroF1-a.macroF1)[0];
  const model=fit(rows,{mode:winner.mode,epochs:130});
  onProgress({step:7,total:7,mode:winner.mode});
  return {model,report:{...winner,candidates,method:'3-fold stratifierad korsvalidering. Vokabulär tränas enbart på träningsdelen i varje vikning.',warning:'Modellval och poäng använder samma korsvalidering. Poängen är en utvecklingsindikator, inte ett oberoende sluttest.',rows:rows.length,created:new Date().toISOString()}};
}
export function serializeModel(model) {
  const o={...model,weights:model.weights.map(w=>Array.from(w))};
  return JSON.parse(JSON.stringify(o));
}
export function validateModel(model) {
  const m=model;
  const okNumber=x=>typeof x==='number' && Number.isFinite(x) && Math.abs(x)<1e6;
  if(!m || m.version!==VERSION || m.kind!=='signal-softmax' || !Array.isArray(m.labels) || m.labels.length<2 || m.labels.length>12 || m.labels.some(x=>typeof x!=='string'||!x.trim()||x.length>60) || new Set(m.labels).size!==m.labels.length) throw new Error('Ogiltigt modellformat.');
  const d=m.vocab?.names?.length, k=m.labels.length;
  if(!Number.isInteger(d)||d<1||d>6000||!['word','hybrid'].includes(m.vocab.mode)||m.vocab.names.some(x=>typeof x!=='string'||x.length>150)||new Set(m.vocab.names).size!==d) throw new Error('Ogiltig vokabulär.');
  for(const a of [m.vocab.idf,m.bias]) if(!Array.isArray(a)||a.some(x=>!okNumber(x))) throw new Error('Ogiltiga modellvärden.');
  if(m.vocab.idf.length!==d||m.bias.length!==k) throw new Error('Fel dimensioner.');
  for(const matrix of [m.weights,m.prototypes]) if(!Array.isArray(matrix)||matrix.length!==k||matrix.some(a=>!Array.isArray(a)||a.length!==d||a.some(x=>!okNumber(x)))) throw new Error('Ogiltiga modellvikter.');
  if(m.loss!==undefined&&(!Array.isArray(m.loss)||m.loss.length>1000||m.loss.some(x=>!okNumber(x)||x<0)))throw new Error('Ogiltig träningshistorik.');
  return m;
}
