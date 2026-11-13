const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness(){
 let now=100000,resolve,reject;
 const el=new Map(),intervals=new Map(),saved={};let n=0;
 const element=s=>{if(!el.has(s))el.set(s,{innerHTML:'',textContent:'',value:'',style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},focus(){},select(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false}});return el.get(s)};
 const window={Game:require('../dist/game.js'),QUESTION_BANK:[{id:'q',category:'Marketing',prompt:'Name a pricing strategy.',note:'Real pricing strategies.',answers:[['Cost-plus pricing',10]]}],Ocean:{onDepth(){},home(){},enter(){},dive(){return Promise.resolve()},setReduced(){}},BrowserAI:{ready:true,state:'ready',message:'Ready',disable(){},judge(){return new Promise((a,b)=>{resolve=a;reject=b})}},addEventListener(){}};
 class Clock extends Date{static now(){return now}}
 const context={window,document:{querySelector:element,body:element('body'),addEventListener(){}},localStorage:{getItem(){return null},setItem(k,v){saved.value=JSON.parse(v)}},Date:Clock,setInterval(f){intervals.set(++n,f);return n},clearInterval(id){intervals.delete(id)},setTimeout(){},navigator:{},location:{origin:'https://example.test'}};
 window.Game={...window.Game,select:()=>['q']};
 vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),context);
 element('#start-button').onclick();now+=3100;for(const f of [...intervals.values()])f();
 return {el:element,get run(){return Object.values(saved.value.dailies)[0]},advance(ms){now+=ms;for(const f of [...intervals.values()])f()},pitch(value){element('#answer').value=value;element('#answer-form').onsubmit({preventDefault(){}})},resolve(v){resolve(v)},reject(){reject(new Error('test failure'))},leave(){element('#surface-button').onclick();element('#confirm-leave').onclick()}};
}
const flush=()=>new Promise(r=>setImmediate(r));
test('new valid answer scores, timer pauses, duplicate submits ignored',async()=>{const h=harness();const deadline=h.run.deadline;h.pitch('pay what you want');h.pitch('another');h.advance(40000);assert.equal(h.run.results.length,0);h.resolve({accepted:true,answer:'Pay what you want',tier:50,explanation:'A valid participative pricing strategy.'});await flush();assert.equal(h.run.results.length,1);assert.equal(h.run.results[0].points,60);assert.equal(h.run.deadline,deadline+40000);assert.equal(h.run.results[0].ai,true)});
test('AI rejection permits retries with preserved time',async()=>{const h=harness();h.pitch('spaceships');h.advance(5000);h.resolve({accepted:false,answer:'spaceships',tier:10,explanation:'Not a pricing strategy.'});await flush();assert.equal(h.run.phase,'question');assert.equal(h.run.attempts,1);assert.equal(h.run.results.length,0);assert.equal(h.el('#answer').disabled,false);h.pitch('Cost-plus pricing');assert.equal(h.run.results[0].points,10)});
test('model failure restores input without losing round',async()=>{const h=harness();h.pitch('new answer');h.advance(60000);h.reject();await flush();assert.equal(h.run.phase,'question');assert.equal(h.el('#answer').disabled,false);assert.equal(h.run.results.length,0)});
test('late answer cannot update a departed run',async()=>{const h=harness();h.pitch('new answer');h.leave();h.resolve({accepted:true,answer:'New strategy',tier:100,explanation:'Test'});await flush();assert.equal(h.run.results.length,0);assert.match(h.el('#stage').innerHTML,/DEALS AFTER DARK/)});
test('bank typo matching and expiry still work',()=>{const h=harness();h.pitch('cost plsu pricing');assert.equal(h.run.results[0].answer,'Cost-plus pricing');const t=harness();t.advance(26000);assert.equal(t.run.results[0].reason,'timeout')});
test('invalid model output is rejected',()=>{const window={dispatchEvent(){}};vm.runInNewContext(fs.readFileSync('dist/browser-ai.js','utf8'),{window});assert.throws(()=>window.BrowserAI.validate({accepted:'yes',answer:'a',tier:100,explanation:'x'}));assert.throws(()=>window.BrowserAI.validate({accepted:true,answer:'',tier:100,explanation:'x'}));assert.throws(()=>window.BrowserAI.validate({accepted:true,answer:'a',tier:999,explanation:'x'}))});
function backendHarness(gpu){
 const workers=[];const window={dispatchEvent(){}};
 class Worker {constructor(url){this.url=url;workers.push(this)}postMessage(m){this.sent=m}terminate(){this.terminated=true}}
 const context={window,navigator:gpu?{gpu}: {},Worker,Event:class{},setTimeout(){return 1},clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync('dist/browser-ai.js','utf8'),context);
 return {ai:window.BrowserAI,workers,reply(index,result,error){const w=workers[index];w.onmessage({data:{id:w.sent.id,result,error}})}};
}
test('missing WebGPU automatically loads CPU worker',async()=>{const h=backendHarness();const p=h.ai.enable();await flush();assert.equal(h.workers[0].url,'judge-cpu-worker.js');h.reply(0,true);await p;assert.equal(h.ai.ready,true);assert.equal(h.ai.backend,'CPU')});
test('GPU load failure automatically retries on CPU',async()=>{const h=backendHarness({requestAdapter:async()=>({features:new Set(['shader-f16'])})});const p=h.ai.enable();await flush();assert.equal(h.workers[0].url,'judge-worker.js');h.reply(0,null,'out of GPU memory');await flush();assert.equal(h.workers[0].terminated,true);assert.equal(h.workers[1].url,'judge-cpu-worker.js');h.reply(1,true);await p;assert.equal(h.ai.backend,'CPU');assert.equal(h.ai.ready,true)});
test('CPU download cancel cannot become ready later',async()=>{const h=backendHarness();const p=h.ai.enable();await flush();h.ai.disable();await p;h.reply(0,true);assert.equal(h.ai.ready,false);assert.equal(h.ai.state,'off');assert.equal(h.workers[0].terminated,true)});