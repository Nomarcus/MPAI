import {vocabulary,vectorize,seeded,cleanRows,words} from './engine.js';
const FILLER=new Set('bra vore skulle kunna önskar gärna vill behöver hade nästa min mitt mina mig man verkligen möjlighet möjligheten jag vi ni kan den det en ett att som för och till med på i av om när inte'.split(' '));
const dot=(x,y)=>x.reduce((sum,[j,v])=>sum+v*y[j],0);
function unit(v){const norm=Math.sqrt(v.reduce((s,n)=>s+n*n,0))||1;return v.map(x=>x/norm);}
// Spherical k-means: cosine distance, k-means++ seeding, deterministic restarts.
export function discover(texts,k=3){
  if(!Array.isArray(texts)||texts.length<6||texts.length>1500)throw new Error('Använd 6–1 500 texter för att upptäcka teman.');
  if(!Number.isInteger(k)||k<2||k>8||k>texts.length/2)throw new Error('Välj 2–8 grupper och minst två texter per grupp.');
  const rows=cleanRows(texts.map(text=>({text,label:'unlabeled'})));
  if(rows.length<k*2)throw new Error('Det behövs fler unika texter.');
  // Discovery is about topics; remove common request/feedback framing first.
  const contentRows=rows.map(r=>({...r,text:words(r.text).filter(w=>!FILLER.has(w)).join(' ')}));
  const vocab=vocabulary(contentRows,'word',4000),vectors=contentRows.map(r=>vectorize(r.text,vocab).x),dim=vocab.names.length;
  if(vectors.some(v=>!v.length))throw new Error('Varje text behöver innehålla minst ett meningsbärande ord.');
  let best=null;
  for(let restart=0;restart<5;restart++){
    const rng=seeded(717+restart),centers=[],used=new Set();
    let first=Math.floor(rng()*rows.length);
    for(let c=0;c<k;c++){
      used.add(first);const a=Array(dim).fill(0);for(const [j,v]of vectors[first])a[j]=v;centers.push(a);
      if(c===k-1)break;
      const distances=vectors.map((v,i)=>used.has(i)?0:Math.max(0,1-Math.max(...centers.map(center=>dot(v,center))))**2);
      let target=rng()*distances.reduce((s,d)=>s+d,0),chosen=distances.length-1;
      for(let i=0;i<distances.length;i++){target-=distances[i];if(target<=0&&!used.has(i)){chosen=i;break;}}
      if(used.has(chosen))chosen=rows.findIndex((_,i)=>!used.has(i));first=chosen;
    }
    let assignments=Array(rows.length).fill(-1);
    for(let iter=0;iter<35;iter++){
      const next=vectors.map(v=>{const scores=centers.map(center=>dot(v,center));return scores.indexOf(Math.max(...scores));});
      if(next.every((v,i)=>v===assignments[i]))break;assignments=next;
      for(let c=0;c<k;c++){
        const center=Array(dim).fill(0),members=assignments.map((a,i)=>a===c?i:-1).filter(i=>i>=0);
        if(!members.length){const least=vectors.map((v,i)=>({i,s:dot(v,centers[assignments[i]])})).sort((a,b)=>a.s-b.s)[0].i;for(const[j,v]of vectors[least])center[j]=v;}
        else for(const i of members)for(const[j,v]of vectors[i])center[j]+=v;
        centers[c]=unit(center);
      }
    }
    const objective=vectors.reduce((s,v,i)=>s+dot(v,centers[assignments[i]]),0);
    if(!best||objective>best.objective)best={assignments,centers,objective};
  }
  return best.centers.map((center,c)=>{
    const members=rows.map((r,i)=>({...r,index:i,similarity:dot(vectors[i],center)})).filter(r=>best.assignments[r.index]===c).sort((a,b)=>b.similarity-a.similarity);
    const terms=center.map((weight,i)=>({weight,term:vocab.names[i]})).filter(t=>t.term.startsWith('w:')).sort((a,b)=>b.weight-a.weight).slice(0,5).map(t=>t.term.slice(2));
    return {terms,members,cohesion:members.length?members.reduce((s,r)=>s+r.similarity,0)/members.length:0};
  }).filter(c=>c.members.length).sort((a,b)=>b.members.length-a.members.length);
}
