import {trainAutoML} from './engine.js';
self.onmessage=e=>{
  try { const result=trainAutoML(e.data.rows,p=>self.postMessage({type:'progress',...p})); self.postMessage({type:'result',...result}); }
  catch(error) { self.postMessage({type:'error',message:error.message}); }
};
