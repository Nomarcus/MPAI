import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS} from '../dist/data.js';
import {fit,predict,trainAutoML,cleanRows,normalize,vocabulary,folds,serializeModel,validateModel,metrics} from '../dist/engine.js';

test('AutoML learns all three tasks; unseen examples evaluated separately',()=>{
  for(const preset of PRESETS){
    const {model,report}=trainAutoML(preset.rows);
    const predictions=preset.blind.map(r=>predict(model,r.text));
    const measured=metrics(preset.blind.map(r=>r.label),predictions.map(p=>p.label),model.labels);
    assert.ok(report.accuracy>=.65,preset.id+' cross-validation below useful baseline');
    assert.ok(measured.accuracy>=.85,preset.id+' failed unseen fictional test');
    assert.equal(report.candidates.length,2);
    assert.equal(report.n,preset.rows.length);
    assert.ok(model.loss.at(-1)<model.loss[0]/4,'Weights did not learn');
    assert.ok(!model.prototypes.some(a=>a.some(x=>!Number.isFinite(x))));
    for(const r of preset.blind)assert.ok(!preset.rows.some(x=>normalize(x.text)===normalize(r.text)));
  }
});
test('Empty and unrelated messages ask for review, even with a high softmax score',()=>{
  for(const p of PRESETS){
    const m=trainAutoML(p.rows).model;
    assert.equal(predict(m,'').review,true);
    assert.equal(predict(m,'xyzzy qwerty zzzzz').review,true);
    assert.equal(predict(m,p.queue.at(-1)).review,true);
  }
});
test('Labels come from learned weights, not fixed rules or category names',()=>{
  const rows=[...Array.from({length:8},(_,i)=>({text:'banan gul frukt lunch nummer '+i,label:'A'})),...Array.from({length:8},(_,i)=>({text:'motor bil däck hjul nummer '+i,label:'B'}))];
  const a=fit(rows);
  const b=fit(rows.map(r=>({...r,label:r.label==='A'?'B':'A'})));
  assert.equal(predict(a,'gul banan frukt').label,'A');
  assert.equal(predict(b,'gul banan frukt').label,'B');
});
test('Serialized models preserve exact predictions and do not include original texts',()=>{
  const model=trainAutoML(PRESETS[0].rows).model;
  const snapshot=serializeModel(model),reloaded=validateModel(JSON.parse(JSON.stringify(snapshot)));
  assert.deepEqual(predict(model,PRESETS[0].blind[0].text),predict(reloaded,PRESETS[0].blind[0].text));
  assert.ok(!JSON.stringify(snapshot).includes(PRESETS[0].rows[0].text));
  assert.ok(!('index' in snapshot.vocab));
  for(const bad of [null,{}, {...snapshot,version:999},{...snapshot,weights:[[NaN]]},{...snapshot,labels:['A','A']}])assert.throws(()=>validateModel(bad));
});
test('Duplicates are removed before splitting; contradictory labels fail',()=>{
  assert.equal(cleanRows([{text:' Hej  VÄRLD ',label:'A'},{text:'hej värld',label:'A'}]).length,1);
  assert.throws(()=>cleanRows([{text:'hej',label:'A'},{text:'HEJ',label:'B'}]),/två olika/);
  assert.throws(()=>cleanRows([{text:'',label:'A'}]));
  assert.throws(()=>cleanRows(Array.from({length:5001},()=>({text:'a',label:'b'}))));
});
test('Vocabulary is fitted only to each training partition',()=>{
  const rows=[...Array.from({length:6},(_,i)=>({text:'alpha unikmarkör'+String.fromCharCode(97+i),label:'A'})),...Array.from({length:6},(_,i)=>({text:'beta hemligmarkör'+String.fromCharCode(97+i),label:'B'}))];
  const fs=folds(rows);
  assert.equal(new Set(fs.flat()).size,rows.length);
  for(const indices of fs){
    const indexSet=new Set(indices),train=rows.filter((_,i)=>!indexSet.has(i));
    const v=vocabulary(train,'word');
    for(const i of indices)assert.ok(!v.names.includes('w:'+rows[i].text.split(' ')[1]));
  }
});
test('Training guards insufficient or invalid class data',()=>{
  assert.throws(()=>trainAutoML([{text:'hej',label:'A'}]));
  assert.throws(()=>trainAutoML([{text:'hej',label:'A'},{text:'värld',label:'B'}]),/fyra/);
});
test('Raising review threshold never reduces review count',()=>{
  const p=PRESETS[0],m=trainAutoML(p.rows).model;
  const low=p.queue.filter(t=>predict(m,t,.4).review).length;
  const high=p.queue.filter(t=>predict(m,t,.95).review).length;
  assert.ok(high>=low);
});
