import test from 'node:test';
import assert from 'node:assert/strict';
import {discover} from '../dist/discover.js';
import {DISCOVERY_DEMO} from '../dist/data.js';
test('Unsupervised grouping discovers repeated topics without any labels',()=>{
  const a=discover(DISCOVERY_DEMO,3),b=discover(DISCOVERY_DEMO,3);
  assert.deepEqual(a,b,'Clustering must be reproducible');
  assert.equal(a.length,3);assert.equal(a.flatMap(c=>c.members).length,24);
  for(const term of ['kalendern','pdf','språk'])assert.ok(a.some(c=>c.terms.includes(term)),term+' missing');
  for(const c of a)assert.ok(c.cohesion>=0&&c.cohesion<=1);
});
test('Grouping rejects insufficient data, bad limits and empty language features',()=>{
  assert.throws(()=>discover(['hej'],3));
  assert.throws(()=>discover(DISCOVERY_DEMO,50));
  assert.throws(()=>discover(['!!!','???','---','aaa','bbb','ccc'],2));
});
