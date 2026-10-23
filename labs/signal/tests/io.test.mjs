import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,exportCSV} from '../dist/io.js';

test('CSV supports Swedish Excel semicolons, BOM, multiline quoted cells and doubled quotes',()=>{
  const text='\uFEFFtext;kategori\r\n"Hej; världen\nandra raden ""citat""";Konto\r\n"Vanlig text";Teknik';
  assert.deepEqual(parseCSV(text),[{text:'Hej; världen\nandra raden "citat"',label:'Konto'},{text:'Vanlig text',label:'Teknik'}]);
  assert.deepEqual(parseCSV('text,label\n"a,b",C'),[{text:'a,b',label:'C'}]);
  assert.deepEqual(parseCSV('text\tkategori\nhej\tA'),[{text:'hej',label:'A'}]);
  assert.deepEqual(parseCSV('text\n"Utan kategori"'),[{text:'Utan kategori',label:''}]);
});
test('CSV rejects corrupt records instead of silently mislabelling data',()=>{
  for(const csv of ['text,label\n"ej avslutad,A','text,label\na,b,c','text,label\n"a"garbage,b','fel,label\na,b','text,label\n,A','text,label\n"ord""fel,B'])assert.throws(()=>parseCSV(csv));
});
test('CSV roundtrip preserves text, quotes, newlines and Swedish letters',()=>{
  const rows=[['text','kategori'],['En text med "citat"; och åäö','Konto'],['Två\nrader','Teknik']];
  assert.deepEqual(parseCSV(exportCSV(rows)),rows.slice(1).map(([text,label])=>({text,label})));
});
test('CSV formula injection is neutralized in every exported column',()=>{
  const csv=exportCSV([['text','kategori'],['=HYPERLINK("x")','+SUM(A1)'],['  @formula','-12']]);
  const result=parseCSV(csv);
  assert.ok(result[0].text.startsWith("'="));
  assert.ok(result[0].label.startsWith("'+"));
  assert.ok(result[1].text.startsWith("'  @"));
  assert.ok(result[1].label.startsWith("'-"));
});
