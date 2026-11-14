(()=>{const c=document.getElementById('ocean-world'),x=c.getContext('2d');let W,H,p=0,target=0,start=0,from=0,resolve=null,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,cb=()=>{},moving=false,duration=1800,travel=0,burstAt=-10000,burstPoints=0;function r(a,b,w,h,col){x.fillStyle=col;x.fillRect(Math.round(a),Math.round(b),Math.ceil(w),Math.ceil(h));}function resize(){W=c.width=Math.ceil(innerWidth/3);H=c.height=Math.ceil(innerHeight/3);x.imageSmoothingEnabled=false;}function person(a,b,t){const walk=0;r(a+4,b,7,3,'#14182a');r(a+4,b+3,7,7,'#dca77c');r(a+10,b+5,2,2,'#eab98c');r(a+3,b+10,10,13,'#203e60');r(a+6,b+10,4,8,'#e2edf2');r(a+7,b+11,2,8,'#50c9f2');r(a+1,b+11,3,12,'#18314d');r(a+13,b+11,3,12,'#18314d');r(a+13,b+22,3,3,'#dca77c');r(a+4,b+23,4,10+walk,'#17263f');r(a+9,b+23,4,10-walk,'#17263f');r(a+3,b+32+walk,6,2,'#080c19');r(a+9,b+32-walk,6,2,'#080c19');r(a+14,b+24,9,7,'#734a31');r(a+16,b+22,5,2,'#ac8352');}function frame(t){requestAnimationFrame(frame);if(moving){const q=Math.min(1,(t-start)/duration),e=q*q*(3-2*q);travel=e;p=from+(target-from)*e;cb(Math.round(p));if(q===1){moving=false;travel=0;const done=resolve;resolve=null;done?.();}}x.clearRect(0,0,W,H);const floorForDepth=depth=>Math.min(6,Math.max(0,Math.floor(depth/1000)));
const z=floorForDepth(p);
// The supplied office art is the backdrop even on the menu; the lobby is floor zero.
if(window.OfficeBackgrounds){
  const fromFloor=floorForDepth(from),toFloor=floorForDepth(target);
  // Hold one complete room throughout each 100-point band.
  // Slide between the supplied pixel-art rooms only while changing floors.
  if(moving&&!reduced&&toFloor>fromFloor){
    const floors=toFloor-fromFloor;
    const progress=travel*floors;
    const lower=Math.min(toFloor-1,fromFloor+Math.floor(progress));
    const slide=Math.max(0,Math.min(1,progress-(lower-fromFloor)))*H;
    window.OfficeBackgrounds.draw(x,lower,slide,W,H);
    window.OfficeBackgrounds.draw(x,lower+1,slide-H,W,H);
  }else{
    window.OfficeBackgrounds.draw(x,z,0,W,H);
  }
}else{drawCity(t,0,0);}const ground=H*.76,a=W*.18;
// The camera follows a real elevator car; floors pass downward as points move the car up.
const left=a-12,top=ground-48,cw=45,ch=54;
r(left-8,0,cw+16,H,'#07101c');
for(const rail of [left-5,left+cw+3]){r(rail,0,2,H,'#52677a');r(rail+1,0,1,H,'#9bb6c3');}
const shaftShift=(p/1000)*H;
for(let floor=Math.floor(p/1000)-2;floor<=Math.floor(p/1000)+2;floor++){
 const y=ground+(shaftShift-floor*H);r(left-8,y,cw+16,5,'#344d63');r(left-8,y,cw+16,1,'#8ea2b2');
 x.font='5px monospace';x.textAlign='center';x.fillStyle='#c5dce8';x.fillText(String(Math.max(0,floor)*100)+' PTS',left+cw/2,y+13);
}
// Twin suspension cables, top pulley, and a framed cabin with its own floor.
r(a+5,0,1,top,'#c6cbd0');r(a+15,0,1,top,'#707f8c');
r(left,top,cw,ch,'#76919f');r(left+2,top+2,cw-4,ch-4,'#172a3c');
r(left+4,top+5,cw-8,ch-10,'#233e50');r(left+5,top+6,cw-10,2,'#ffe5a0');
r(left+4,ground+1,cw-8,3,'#e3c190');
person(a,ground-34,t);
// Glass cabin doors close during travel; the passenger stays visible behind them.
if(moving){r(left+4,top+9,(cw-8)/2,ch-16,'#8bd4ed32');r(left+cw/2,top+9,(cw-8)/2,ch-16,'#8bd4ed32');r(left+cw/2,top+9,1,ch-16,'#a9dbea');}
else {r(left+3,top+9,3,ch-16,'#9fc8d8');r(left+cw-6,top+9,3,ch-16,'#9fc8d8');}
r(left+8,top-10,cw-16,8,'#071726');x.font='5px monospace';x.textAlign='center';x.fillStyle='#77eed8';x.fillText((moving?'↑ ':'')+Math.round(p/10)+' PTS',left+cw/2,top-4);
c.dataset.elevator=moving?'ascending':'doors-open';
const life=(t-burstAt)/1300;if(!reduced&&life>=0&&life<1){const col=burstPoints===100?'#ffd875':burstPoints>=85?'#c391ff':'#59d9fa';for(let i=0;i<(burstPoints>=85?45:20);i++){const ang=i*2.399,dist=life*(20+(i%7)*6);r(a+10+Math.cos(ang)*dist,ground-25+Math.sin(ang)*dist+life*life*25,2,2,i%3?col:'#f5edc8');}}x.font='5px monospace';x.textAlign='right';x.fillStyle='#93bed5';for(let i=0;i<7;i++){const y=H*.22+i*H*.065;r(W-15,y,4,1,'#487086');x.fillText(String(i*100),W-18,y+2);}r(W-10,H*.22,1,H*.39,'#487086');r(W-13,H*.22+Math.min(1,p/6000)*H*.39,7,2,'#f96799');c.dataset.depth=Math.round(p);c.dataset.zone=window.Game.zone(p);c.dataset.moving=String(moving);}
function drawCity(t,offset,z){const palettes=[['#090f2b','#30204b','#69dcef'],['#261329','#652e46','#ffb083'],['#062839','#216b68','#9cebc3'],['#151539','#3a3066','#ba9bff'],['#061c39','#184d76','#8bdaff'],['#172439','#536d85','#deefff'],['#211437','#613c66','#ffc0de'],['#20172e','#68532c','#ffdc75']];const pal=palettes[z];x.save();x.translate(0,offset);const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,pal[0]);sky.addColorStop(.6,pal[1]);sky.addColorStop(1,'#0a1832');x.fillStyle=sky;x.fillRect(0,0,W,H);for(let i=0;i<65;i++)r((i*71)%W,(i*31)%(H*.45),1,1,i%3?'#7385aa':'#d5d4db');r(W*.82,H*.09,12,13,'#ffe0a0');r(W*.82-2,H*.09+3,16,7,'#ffe0a0');const ground=H*.76;for(let layer=0;layer<2;layer++){const step=layer?49:31,shift=p*(layer?.08:.025);for(let i=-2;i<W/step+3;i++){const index=i+Math.floor(shift/step),a=i*step-shift%step,h=25+((index*37+4000)%73)+(layer?15:30),base=ground-(layer?0:16);r(a,base-h,step-3,h,layer?'#11233e':'#171c36');r(a+5,base-h-4,step-13,4,layer?'#1a2b45':'#202442');if(index%3===0)r(a+step/2,base-h-13,1,10,'#62749b');for(let wy=base-h+8;wy<base-6;wy+=8)for(let wx=a+5;wx<a+step-7;wx+=7){if((Math.floor(wx)+Math.floor(wy)+index)%4!==0)r(wx,wy,3,4,(index+Math.floor(wy))%3?'#b88d54':'#54a9be');}if(layer){const names=[['HOTEL','LOBBY','CONCIERGE','SUITES','CHECK IN','DECA INN'],['BISTRO','CAFE','BAKERY','DINING','CHEF','TERRACE'],['RESORT','SPA','POOL','BEACH','CABANA','PALMS'],['EXPO','EVENTS','GALA','MEETING','HALL','DECA CON'],['CRUISES','PIER','MARINA','PORT','SAIL','VOYAGES'],['CHALET','LODGE','SKI','COCOA','RETREAT','ALPINE'],['SKY BAR','SUITES','ROOFTOP','LOUNGE','PENTHOUSE','VIEWS'],['DECA GRAND','ROYAL','GOLD','PALACE','DIAMOND','ESTATE']][z];r(a+3,base-22,step-9,9,'#11213a');x.font='5px monospace';x.textAlign='center';x.fillStyle=index%2?'#f38fce':'#69dcef';x.fillText(names[((index%6)+6)%6],a+step/2-2,base-16);r(a+step/2-5,base-11,10,11,'#315773');r(a+step/2,base-10,1,9,'#8dd8e9');}}}r(0,ground,W,8,'#4a465d');r(0,ground+8,W,2,'#9a7d8b');r(0,ground+10,W,H,'#11192b');for(let i=-1;i<W/30+1;i++)r(i*30-(p*.08)%30,ground+22,13,1,'#98845c');for(let i=-1;i<W/100+1;i++){let a=i*100-(p*.08)%100;r(a,ground-40,2,40,'#182033');r(a-3,ground-42,8,3,'#f6db92');r(a-5,ground-39,12,2,'#ecd49a33');}landmark(z,ground,pal[2]);x.restore();}function landmark(z,g,col){const a=W*.72; x.fillStyle=col;x.font='6px monospace';x.textAlign='center';
if(z===0){r(a-24,g-65,48,65,'#273a59');r(a-28,g-68,56,5,col);for(let i=0;i<4;i++)for(let j=0;j<4;j++)r(a-18+i*11,g-54+j*10,5,5,'#ffd789');r(a-7,g-15,14,15,'#79c5d4');x.fillStyle=col;x.fillText('HOTEL',a,g-72);}
if(z===1){r(a-35,g-34,70,34,'#512d43');for(let i=0;i<10;i++)r(a-35+i*7,g-38,7,9,i%2?'#f2dab0':'#e77478');for(let i=-1;i<=1;i++){r(a+i*25-7,g-11,14,3,col);r(a+i*25,g-8,2,8,col);}x.fillStyle=col;x.fillText('BISTRO',a,g-45);}
if(z===2){r(a-35,g-5,72,10,'#47bcbf');for(let i=-1;i<=1;i+=2){r(a+i*34,g-65,4,65,'#9b7450');for(let k=-2;k<=2;k++)r(a+i*34+k*7,g-66+Math.abs(k)*3,12,4,'#76b87b');}r(a-15,g-29,30,4,'#f6cb86');r(a,g-25,2,20,'#f6cb86');}
if(z===3){r(a-44,g-52,88,52,'#334268');r(a-47,g-58,94,6,col);for(let i=0;i<5;i++)r(a-36+i*17,g-40,9,40,'#82b6c9');r(a-33,g-50,66,9,'#533867');x.fillStyle=col;x.fillText('DECA EXPO',a,g-43);}
if(z===4){r(a-56,g-4,112,12,'#367ea0');r(a-48,g-19,96,14,'#c5d9e6');r(a-38,g-31,69,12,'#8faec4');r(a-23,g-42,38,11,'#d9e5e9');r(a-5,g-53,9,11,'#e58a83');for(let i=0;i<10;i++)r(a-42+i*9,g-15,4,4,'#203a58');}
if(z===5){x.fillStyle='#a9c8d6';x.beginPath();x.moveTo(a-60,g);x.lineTo(a,g-100);x.lineTo(a+60,g);x.fill();x.fillStyle='#eef5ed';x.beginPath();x.moveTo(a-18,g-70);x.lineTo(a,g-100);x.lineTo(a+18,g-70);x.fill();r(a-26,g-28,52,28,'#795343');r(a-32,g-34,64,6,'#e9f0e9');r(a-8,g-21,16,21,'#ffc877');}
if(z===6){r(a-28,g-110,56,110,'#393857');r(a-34,g-117,68,7,col);r(a-19,g-134,38,17,'#77859b');for(let j=0;j<8;j++)for(let i=0;i<4;i++)r(a-21+i*13,g-103+j*12,7,7,j%2?'#e1acba':'#7bcae2');}
if(z===7){r(a-39,g-65,78,65,'#85704b');r(a-44,g-70,88,6,col);for(let i=-1;i<=1;i++){r(a+i*30-8,g-85,16,85,'#c4a56a');r(a+i*30-11,g-91,22,6,col);}r(a-9,g-23,18,23,'#423c52');for(let i=-2;i<=2;i++)r(a+i*15-2,g-50,5,7,'#fff0ab');x.fillStyle=col;x.fillText('DECA GRAND',a,g-98);}}
function go(d,instant=false){resolve?.();from=p;target=d;start=performance.now();duration=900+Math.min(2100,Math.abs(d-p)*2.1);if(instant||reduced||d===p){p=d;travel=0;cb(Math.round(p));moving=false;resolve=null;return Promise.resolve();}moving=true;return new Promise(done=>resolve=done);}window.Ocean={home:()=>go(0,true),enter:d=>go(d,true),dive:go,celebrate:points=>{if(points){burstPoints=points;burstAt=performance.now();}},setReduced:v=>{reduced=v;document.body.classList.toggle('motion-off',v);if(v&&moving)go(target,true);},get reduced(){return reduced;},onDepth:f=>cb=f};addEventListener('resize',resize);resize();requestAnimationFrame(frame);})();