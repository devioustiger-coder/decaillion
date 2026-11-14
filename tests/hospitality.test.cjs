const test=require('node:test'),assert=require('node:assert/strict');global.window={};require('../dist/questions.js');require('../dist/hospitality.js');const G=require('../dist/game.js');
test('102 hospitality prompts have 50 unique accepted answers and all five tiers',()=>{assert.equal(window.HOSPITALITY_BANK.length,102);for(const q of window.HOSPITALITY_BANK){assert.equal(q.answers.length,50,q.id);assert.equal(new Set(q.answers.map(a=>G.normalize(a[0]))).size,50,q.id);assert.deepEqual([...new Set(q.answers.map(a=>a[1]))],[10,25,50,75,100]);for(const a of q.answers)assert.equal(G.match(q,a[0]),a);}});
test('seven backgrounds advance every 100 points, rooftop is highest',()=>{const names=['LOBBY','CUBICLE FARM','MARKETING STUDIO','BREAK ROOM','BOARDROOM','EXECUTIVE SUITE','ROOFTOP'];for(let i=0;i<7;i++){assert.equal(G.zone(i*1000),names[i]);assert.equal(G.zone(i*1000+999),names[i]);}assert.equal(G.zone(7000),'ROOFTOP');});
test('existing saved prompt IDs stay available',()=>{assert.equal(window.QUESTION_BANK.length,126);assert.equal(new Set(window.QUESTION_BANK.map(q=>q.id)).size,126);});
test('ascent scroll is proportional to points, including reduced motion',async()=>{const vm=require('node:vm'),fs=require('node:fs');let frame,now=0,depth=0;const translations=[];const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),translate:(a,b)=>translations.push(b)},{get:(o,k)=>o[k]||(()=>{})});const canvas={getContext:()=>ctx,dataset:{}};const context={window:{Game:G},document:{getElementById:()=>canvas,body:{classList:{toggle(){}}}},innerWidth:1200,innerHeight:900,matchMedia:()=>({matches:false}),performance:{now:()=>now},requestAnimationFrame:f=>frame=f,addEventListener(){},Math,Promise};vm.runInNewContext(fs.readFileSync(require.resolve('../dist/ocean.js'),'utf8'),context);const O=context.window.Ocean;O.onDepth(d=>depth=d);let travel=O.dive(100);now=5000;frame(now);await travel;assert.equal(depth,100);assert.ok(Math.abs(translations[0])<3,'idle drift stays subtle');translations.length=0;O.enter(1000);frame(now);assert.equal(canvas.dataset.zone,'CUBICLE FARM');O.setReduced(true);await O.dive(2000);assert.equal(depth,2000);translations.length=0;frame(now);assert.ok(translations.every(y=>y===0),'reduced motion stops idle drift');});
test('meaning matching accepts descriptions and rejects unrelated or negated claims',()=>{const q=id=>window.HOSPITALITY_BANK.find(q=>q.id===id);assert.equal(G.match(q('ht-4'),'give their money back')[0],'Offer a refund');assert.equal(G.match(q('ht-2'),'bring food to the room')[0],'Room service');assert.equal(G.match(q('ht-2'),'wireless internet')[0],'Wi-Fi');assert.equal(G.match(q('ht-4'),'we should say sorry')[0],'Apologize');assert.equal(G.match(q('ht-2'),'the hotel could provide a pool')[0],'Pool');assert.equal(G.match(q('ht-4'),'never apologize'),null);assert.equal(G.match(q('ht-2'),'pool of imaginary dragons'),null);assert.equal(G.match(q('ht-4'),'give everybody a spaceship'),null);});
test('expanded pool has unique prompts and answer lists; selection uses new prompts',()=>{const bank=window.HOSPITALITY_BANK;assert.equal(new Set(bank.map(q=>q.prompt)).size,102);assert.equal(new Set(bank.map(q=>q.answers.map(a=>G.normalize(a[0])).sort().join('|'))).size,102);assert.equal(bank.reduce((n,q)=>n+q.answers.length,0),5100);const picked=new Set();for(let i=0;i<500;i++){const round=G.select(bank,'expanded-'+i);assert.equal(new Set(round).size,7);round.forEach(id=>picked.add(id));}assert.equal(picked.size,102);});


test('original office pixel scenes render in seven ascending floors',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 let canvasCount=0;
 const contexts=[];
 function context(){const ops=[];contexts.push(ops);return {createRadialGradient:()=>({addColorStop(){}}),imageSmoothingEnabled:false,fillRect:(...a)=>ops.push(['rect',...a]),drawImage:(...a)=>ops.push(['image',...a]),save(){},restore(){},beginPath(){},rect(){},clip(){}};}
 const doc={createElement:()=>{canvasCount++;return {width:0,height:0,getContext:context};}};
 const scope={window:{},document:doc,Math,performance:{now:()=>1000}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/office-backgrounds.js'),'utf8'),scope);
 const bg=scope.window.OfficeBackgrounds;
 assert.equal(bg.floorNames.length,7);
 assert.equal(bg.floorNames[0],'Lobby');assert.equal(bg.floorNames[6],'Rooftop');
 const target=context();
 for(let i=0;i<7;i++){bg.draw(target,i,0,640,360);assert.ok(contexts[i+1].some(op=>op[0]==='rect'));}
 assert.equal(canvasCount,7);
 bg.draw(target,6,0,640,360);assert.equal(canvasCount,7);
});
test('one background per 100 points, with no idle overlap and rooftop at 600+',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 let frame,now=0;
 const draws=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const canvas={getContext:()=>ctx,dataset:{}};
 const scope={window:{Game:G,OfficeBackgrounds:{draw:(context,floor,offset)=>draws.push({floor,offset})}},
  document:{getElementById:()=>canvas,body:{classList:{contains:name=>name==='playing',toggle(){}}}},
  innerWidth:1200,innerHeight:900,matchMedia:()=>({matches:false}),
  performance:{now:()=>now},requestAnimationFrame:f=>frame=f,addEventListener(){},Math,Promise};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/ocean.js'),'utf8'),scope);
 const O=scope.window.Ocean;
 function paint(){draws.length=0;frame(now);return draws.map(v=>({floor:v.floor,offset:v.offset}));}
 for(const score of [0,1,25,99,100,101,199,200,299,300,399,400,499,500,599,600,650,700]){
   O.enter(score*10);
   assert.deepEqual(paint(),[{floor:Math.min(6,Math.floor(score/100)),offset:0}],`score ${score}`);
 }
 O.enter(990);
 const travel=O.dive(1000);
 now+=300;
 assert.deepEqual(paint().map(v=>v.floor),[0,1],'crossing 100 should slide only between adjacent rooms');
 now+=6000;
 assert.deepEqual(paint(),[{floor:1,offset:0}]);
 await travel;
 O.setReduced(true);
 await O.dive(2000);
 assert.deepEqual(paint(),[{floor:2,offset:0}], 'reduced motion should snap to the correct room');
});

test('landing screen renders the lobby artwork before starting a game',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 let frame;const draws=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const canvas={getContext:()=>ctx,dataset:{}};
 const context={window:{Game:G,OfficeBackgrounds:{draw:(ctx,floor,offset)=>draws.push({floor,offset})}},
   document:{getElementById:()=>canvas,body:{classList:{contains:()=>false,toggle(){}}}},
   innerWidth:1200,innerHeight:900,matchMedia:()=>({matches:false}),
   performance:{now:()=>0},requestAnimationFrame:f=>frame=f,addEventListener(){},Math,Promise};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/ocean.js'),'utf8'),context);
 frame(0);
 assert.deepEqual(draws,[{floor:0,offset:0}],'homepage must show original pixel-art Lobby instead of old city');
 assert.equal(canvas.dataset.zone,'LOBBY');
});
