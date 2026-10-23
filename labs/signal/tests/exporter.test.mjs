import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {trainAutoML,serializeModel,predict} from '../dist/engine.js';
import {PRESETS} from '../dist/data.js';
import {buildSpecialistHTML} from '../dist/exporter.js';
test('Export is a self-contained executable HTML tool with identical predictions and no original examples',()=>{
  const model=serializeModel(trainAutoML(PRESETS[0].rows).model);
  const source=fs.readFileSync(new URL('../dist/engine.js',import.meta.url),'utf8');
  const html=buildSpecialistHTML(source,model,'Min specialist </script><script>alert(1)</script>');
  assert.equal((html.match(/<script>/g)||[]).length,1);
  assert.ok(!html.includes(PRESETS[0].rows[0].text));
  assert.ok(!html.includes('src="http'));
  assert.ok(!html.includes('await fetch'));
  const elements=new Map();
  const make=()=>({children:[],append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},textContent:'',value:''});
  const doc={getElementById(id){if(!elements.has(id))elements.set(id,make());return elements.get(id);},createElement:make};
  const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const context=vm.createContext({document:doc});
  vm.runInContext(script,context);
  assert.equal(doc.getElementById('name').textContent,'Min specialist </script><script>alert(1)</script>');
  for(const text of PRESETS[0].queue){
    doc.getElementById('text').value=text;doc.getElementById('run').onclick();
    assert.equal(doc.getElementById('result').children[1].textContent,predict(model,text).label);
  }
});
