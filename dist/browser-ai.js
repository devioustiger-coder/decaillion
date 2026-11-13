(() => {
  'use strict';
  let worker=null,sequence=0,state='off',message='Judge new answers on your device. No API key or paid calls.',enabled=false,generation=0,backend=null;
  const pending=new Map(),cache=new Map();
  function update(s,m){state=s;message=m;window.dispatchEvent(new Event('ai-status'));}
  function stop(){generation++;worker?.terminate();worker=null;for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('AI stopped'));}pending.clear();enabled=false;}
  function fail(){stop();update('error','Browser AI stopped. Try loading again, or keep playing with the answer bank.');}
  function request(type,payload,ms){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{fail();},ms);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,payload});});}
  function createWorker(cpu){
    backend=cpu?'CPU':'GPU';
    worker=new Worker(cpu?'judge-cpu-worker.js':'judge-worker.js',{type:'module'});
    worker.onmessage=({data})=>{
      if(data.type==='progress'){update('loading',data.text||`Loading ${backend} model…`);return;}
      const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);
      data.error?p.reject(new Error(data.error)):p.resolve(data.result);
    };
    worker.onerror=()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Model worker failed'));}pending.clear();};
  }
  async function enable(){
    if(state==='loading'||state==='ready')return;
    const generationAtStart=++generation;
    update('loading','Checking your device…');
    try {
      let adapter=null;
      try{adapter=await navigator.gpu?.requestAdapter();}catch{}
      if(generationAtStart!==generation)return;
      if(adapter){
        createWorker(false);
        const model=adapter.features.has('shader-f16')?'Qwen2.5-1.5B-Instruct-q4f16_1-MLC':'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
        try{await request('load',{model},15*60*1000);}
        catch(e){
          if(generationAtStart!==generation)return;
          worker?.terminate();worker=null;
          update('loading','GPU model unavailable. Switching to CPU…');
          createWorker(true);await request('load',{},15*60*1000);
        }
      }else{
        update('loading','No compatible GPU detected. Loading CPU model instead…');
        createWorker(true);await request('load',{},15*60*1000);
      }
      if(generationAtStart!==generation)return;
      enabled=true;update('ready',`Ready · ${backend} AI · answers judged on this device${backend==='CPU'?' (slower; timer pauses)':''}`);
    } catch(e) {
      if(generationAtStart!==generation)return;
      stop();update('error','Could not load Browser AI. Check your connection and available memory, then retry. The answer bank still works.');
    }
  }
  function disable(){stop();update('off','AI off · answer bank and spelling correction still work.');}
  function validate(v){
    if(!v||typeof v.accepted!=='boolean'||typeof v.answer!=='string'||typeof v.explanation!=='string'||![10,25,50,75,100].includes(v.tier)||v.answer.length>100||v.explanation.length>300||(v.accepted&&!v.answer.trim()))throw new Error('Invalid AI response');
    return {accepted:v.accepted,answer:v.answer.trim(),tier:v.tier,explanation:v.explanation};
  }
  async function judge(q,answer){
    if(!enabled||state!=='ready')throw new Error('AI not ready');
    const key=q.id+'|'+answer.trim().toLowerCase();if(cache.has(key))return cache.get(key);
    try{const v=validate(await request('judge',{question:q,answer},backend==='CPU'?180000:60000));cache.set(key,v);return v;}catch(e){if(state!=='off')fail();throw e;}
  }
  window.BrowserAI={enable,disable,judge,validate,get backend(){return backend;},get state(){return state;},get message(){return message;},get ready(){return enabled&&state==='ready';}};
})();