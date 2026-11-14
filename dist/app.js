(() => {
  'use strict';
  const $=s=>document.querySelector(s),BANK=window.QUESTION_BANK,G=window.Game,O=window.Ocean,KEY='decaillion.v1',AI=window.BrowserAI;
  const stage=$('#stage'),dialog=$('#info-dialog');
  const floorNames=['Lobby','Cubicle Farm','Marketing Studio','Break Room','Boardroom','Executive Suite','Rooftop'];
  function floorProgress(score){const floor=Math.min(6,Math.floor(score/100));return score>=600?'Rooftop reached · keep earning points':`${(floor+1)*100-score} pts to ${floorNames[floor+1]}`;}
  function pointScale(){return `<div class="point-scale" aria-label="Answer scores by rarity">${G.ratings.map(r=>`<span style="--rarity:${r.color}"><b>${r.points}</b><small>${r.short}</small></span>`).join('')}</div>`;}
  let saved;try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch{saved={};}
  if(!saved||typeof saved!=='object')saved={};
  if(!Array.isArray(saved.history))saved.history=[];
  if(!saved.dailies||typeof saved.dailies!=='object')saved.dailies={};
  if(!saved.settings)saved.settings={sound:false};
  let mode='daily',run=null,clock=null,transition=0,soundContext=null,judging=false;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function dayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function dailyNumber(day=dayKey()){const [y,m,d]=day.split('-').map(Number);return Math.max(1,Math.round((Date.UTC(y,m-1,d)-Date.UTC(2026,10,12))/86400000)+1);}
  function store(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}}
  function persist(){if(run?.mode==='daily'){saved.dailies[run.day]=run;store();}}
  function stopClock(){clearInterval(clock);clock=null;}
  function total(){return run?run.results.reduce((s,r)=>s+r.points,0):0;}
  function currentQ(){return BANK.find(q=>q.id===run.questions[run.results.length]);}
  function currentDepth(){return total()*10;}
  function updateHud(){
    $('#hud').hidden=!run;
    stage.dataset.entry=run?String(run.results.length%3):'home';
    if(!run)return;
    $('#hud-score').textContent=total();
    const n=run.phase==='complete'?7:Math.min(7,run.results.length+(run.phase==='feedback'?0:1));
    $('#hud-round').textContent=run.phase==='complete'?'DEALS COMPLETE':`PROMPT ${n} OF 7`;
    $('#round-blocks').innerHTML=run.questions.map((_,i)=>{const r=run.results[i];return `<span class="${r?(r.points?'done':'miss'):i===run.results.length&&run.phase!=='feedback'?'current':''}" ${r?`style="--rating:${G.rating(r.points).color}"`:''}></span>`;}).join('');
  }
  O.onDepth(d=>{const score=Math.round(d/10),progress=score>=600?100:score%100;$('#hud-depth').textContent=floorProgress(score);$('#hud-zone').textContent=G.zone(d);$('#floor-progress').style.width=`${progress}%`;$('.floor-track').setAttribute('aria-valuenow',String(progress));$('.floor-track').setAttribute('aria-valuetext',floorProgress(score));document.body.classList.toggle('underwater',d>200);});
  function sound(kind){window.DealAudio?.setEnabled(!!saved.settings.sound);window.DealAudio?.play(kind);}
  function syncSound(){const on=!!saved.settings.sound;$('#sound-button').classList.toggle('sound-on',on);$('#sound-button').setAttribute('aria-pressed',String(on));$('#sound-button').setAttribute('aria-label',on?'Turn sound off':'Turn sound on');}
  function home(){
    stopClock();transition++;if(judging)AI.disable();judging=false;run=null;document.body.classList.remove('playing');updateHud();O.home();
    const daily=saved.dailies[dayKey()],complete=daily?.phase==='complete',resume=daily&&!complete;
    const action=mode==='practice'?'START PRACTICE':complete?'VIEW RESULTS':resume?'CONTINUE RUN':'PLAY DAILY';
    stage.innerHTML=`<section class="landing"><div class="title-wrap"><h1 class="game-title">DECAILLION</h1><p class="subtitle">DEALS AFTER DARK</p><p class="tagline">7 prompts. 25 seconds. How high can you go?</p></div><div class="landing-actions"><button class="small-link how-link" id="how-button">HOW TO PLAY ↗</button><div class="mode-label"><span>${mode==='daily'?`DAILY DEALS #${dailyNumber()}`:'UNLIMITED PRACTICE'}</span><span>${mode==='daily'?(complete?'DEALS COMPLETE':resume?'RUN IN PROGRESS':'CLIMB THE TOWER'):'A FRESH ROUND EVERY TIME'}</span></div><button id="start-button" class="pixel-button">${action} <span aria-hidden="true">↑</span></button><div class="under-start"><span class="dive-number">${mode==='daily'?new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase():`${window.HOSPITALITY_BANK.length} HOSPITALITY PROMPTS`}</span><button id="mode-button" class="mode-button">${mode==='daily'?'UNLIMITED ∞':'DAILY DEALS ◇'}</button></div><div class="landing-scoring"><p>Rarer answers earn more points.</p>${pointScale()}<small>100 points = one floor up</small></div>${aiPanel(true)}<p class="landing-note">${mode==='daily'?(complete?`${daily.results.reduce((s,r)=>s+r.points,0)} points earned. New deals at local midnight.`:resume?'Your progress is saved. A running timer keeps counting.':'102 hospitality prompts · 50 accepted answers each'):'New prompts every run · no daily limit'}</p></div><footer class="landing-footer">AN INDEPENDENT DECA-INSPIRED GAME<span>Not affiliated with DECA Inc. or Krillion · <button class="small-link" id="scoring-button" style="font-size:inherit;padding:0;letter-spacing:0">Rarity scoring</button></span></footer></section>`;
    bindAI();$('#start-button').onclick=start;$('#mode-button').onclick=()=>{mode=mode==='daily'?'practice':'daily';home();};$('#how-button').onclick=how;$('#scoring-button').onclick=scoring;
  }
  function aiPanel(compact=false){const content=`<div class="ai-panel"><div class="ai-heading"><span>✦ OPTIONAL AI JUDGE</span><button id="ai-toggle" class="small-link">${AI.ready?'TURN OFF':AI.state==='loading'?'CANCEL DOWNLOAD':'ENABLE AI'}</button></div><p id="ai-status" role="status">${esc(AI.message)}</p><small>Judges new descriptions on your device. First download: about 800 MB on CPU or 1 GB on GPU. CPU mode is slower. Answers stay on your device. AI can make mistakes.</small></div>`;return compact?`<details class="ai-details" ${AI.ready||AI.state==='loading'?'open':''}><summary>Optional AI judge <span>${AI.ready?'ON':AI.state==='loading'?'DOWNLOADING':'OFF'}</span></summary>${content}</details>`:content;}
  function bindAI(){if($('#ai-toggle'))$('#ai-toggle').onclick=()=>{if(AI.ready||AI.state==='loading')AI.disable();else AI.enable();};}
  window.addEventListener('ai-status',()=>{const panel=$('.ai-panel');if(panel){panel.outerHTML=aiPanel();const details=$('.ai-details');if(details)details.querySelector('summary span').textContent=AI.ready?'ON':AI.state==='loading'?'DOWNLOADING':'OFF';bindAI();}});
  function start(){
    window.DealAudio?.unlock();sound('start');
    stopClock();transition++;document.body.classList.add('playing');
    if(mode==='daily'&&saved.dailies[dayKey()]){
      run=saved.dailies[dayKey()];updateHud();O.dive(currentDepth(),true);
      if(run.phase==='complete')return results();
      if(run.phase==='feedback')return feedback(false);
      if(run.phase==='ready')return prepare();
      if(run.pausedAt){run.deadline+=Date.now()-run.pausedAt;delete run.pausedAt;persist();}
      return question();
    }
    run={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,mode,day:dayKey(),questions:G.select(window.HOSPITALITY_BANK,mode==='daily'?dayKey()+'decaillion':String(Math.random())),results:[],phase:'ready',deadline:0};
    persist();updateHud();O.enter(0);prepare();
  }
  function questionPanel(q){return `<section class="prompt-panel"><div class="prompt-kicker"><span>PROMPT ${run.results.length+1} OF 7</span><span class="category">${esc(q.category)}</span></div><h1 id="question-prompt">${esc(q.prompt)}</h1><p class="prompt-hint">Rarer answers earn 10, 30, 60, 85 or 100 points.</p></section>`;}
  function surfaceButton(){return '<button class="surface-link" id="surface-button">← BACK HOME</button>';}
  function bindSurface(){if($('#surface-button'))$('#surface-button').onclick=leave;}
  function prepare(){
    stopClock();run.phase='ready';persist();updateHud();
    const q=currentQ();if(!q)return finish();
    stage.innerHTML=`<div class="game-screen">${questionPanel(q)}<div class="answer-dock ready-dock">GET READY<strong id="countdown">3</strong>25 seconds to find one answer</div>${surfaceButton()}</div>`;bindSurface();
    const deadline=Date.now()+3000;clock=setInterval(()=>{if(!run||run.phase!=='ready')return;const seconds=Math.ceil((deadline-Date.now())/1000);if(seconds<=0){stopClock();run.phase='question';run.attempts=0;run.deadline=Date.now()+25000;persist();question();}else $('#countdown').textContent=seconds;},100);
  }
  function question(){
    stopClock();const q=currentQ();if(!q)return finish();run.lastTick=26;updateHud();
    stage.innerHTML=`<div class="game-screen">${questionPanel(q)}<form class="answer-dock" id="answer-form"><div class="answer-row"><div class="timer" role="timer" aria-label="Seconds remaining"><span id="seconds">25</span></div><div class="answer-wrap"><input id="answer" class="answer-input" aria-label="Your answer" placeholder="type one answer…" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="100"><span class="time-bar" id="time-bar"></span></div><button class="dive-submit" type="submit" id="submit-button" disabled>SUBMIT</button></div><p id="retry-feedback" role="status">Try again until accepted or time runs out.</p><div class="dock-bottom"><span>ONE ACCEPTED ANSWER PER PROMPT.</span><button id="skip-button" type="button">SKIP →</button></div></form>${surfaceButton()}</div>`;bindSurface();
    $('#answer').oninput=()=>{$('#submit-button').disabled=judging||!$('#answer').value.trim();};
    $('#answer-form').onsubmit=e=>{e.preventDefault();const input=$('#answer').value.trim();if(input)submit(input,Date.now()>=run.deadline?'timeout':'answer');};
    $('#skip-button').onclick=()=>submit('','skip');
    tick();if(run.phase==='question'){clock=setInterval(tick,100);$('#answer').focus({preventScroll:true});}
  }
  function tick(){if(run?.phase!=='question'||judging)return;const left=Math.max(0,run.deadline-Date.now());const sec=Math.ceil(left/1000);if(sec>0&&sec<=5&&run.lastTick!==sec)sound('tick');run.lastTick=sec;$('#seconds').textContent=sec;$('#time-bar').style.transform=`scaleX(${left/25000})`;$('.timer').classList.toggle('urgent',left<6000);if(left<=0)submit('','timeout');}
  function retry(message){
    sound('retry');
    run.attempts=(run.attempts||0)+1;persist();
    $('#answer').disabled=false;$('#submit-button').disabled=!$('#answer').value.trim();$('#skip-button').disabled=false;
    $('#answer').setAttribute('aria-invalid','true');$('#retry-feedback').textContent=`${message} Attempt ${run.attempts}.`;
    $('#answer').select();$('#answer').focus();tick();if(run?.phase==='question')clock=setInterval(tick,100);
  }
  async function submit(input,reason){
    if(run?.phase!=='question'||judging)return;stopClock();const q=currentQ();
    if(reason==='answer'){window.DealAudio?.unlock();sound('pitch');}
    let answer=reason==='answer'?G.match(q,input):null,verdict=null;
    if(reason==='answer'&&!answer&&AI.ready){
      const active=run,token=transition,pausedAt=Date.now();judging=true;run.pausedAt=pausedAt;persist();
      $('#answer').disabled=true;$('#submit-button').disabled=true;$('#skip-button').disabled=true;
      $('#retry-feedback').textContent='Your local AI is reviewing the deal… Timer paused.';
      let error=false;
      try{verdict=await AI.judge(q,input);}catch{error=true;}
      // Never apply a late response to a different round or a departed run.
      if(active.pausedAt===pausedAt){active.deadline+=Date.now()-pausedAt;delete active.pausedAt;store();}
      if(run!==active||token!==transition)return;
      judging=false;persist();
      if(error){retry('AI could not finish. Try again with the answer bank, or reload AI from the menu.');return;}
      if(verdict.accepted)answer=G.match(q,verdict.answer)||[verdict.answer,verdict.tier];
    }
    if(reason==='answer'&&!answer){retry(verdict?`${verdict.explanation} Try another answer.`:'No clear concept match yet. Rephrase your idea, or enable Browser AI to judge new descriptions.');return;}
    if(answer&&G.normalize(input)!==G.normalize(answer[0]))toast(`Accepted as: ${answer[0]}`);
    run.results.push({qid:q.id,input:reason==='answer'?input:'',answer:answer?.[0]||null,points:answer?G.score(answer[1]):0,reason,ai:!!verdict,explanation:verdict?.explanation||''});
    run.phase='feedback';persist();updateHud();feedback(true);
  }
  function feedback(animate){
    stopClock();const r=run.results.at(-1),rating=G.rating(r.points),q=BANK.find(q=>q.id===r.qid),token=++transition;
    const label=r.points?rating.short.toUpperCase()+' ANSWER':r.reason==='timeout'?'TIME’S UP':r.reason==='skip'?'SKIPPED':'DEAL NOT CLOSED';
    const message=r.points?`${rating.short} tier · ${r.points} of 100 possible points for this answer.`:r.reason==='answer'?'Not in this prompt’s answer bank. Explore the accepted answers below.':r.reason==='timeout'?'The clock beat you to it. The next idea is waiting.':'No points this time. On to the next category.';
    stage.innerHTML=`<div class="game-screen ${animate&&r.points&&!O.reduced?'deal-travelling':''}"><div class="pitch-token">${esc(r.answer||'')}<span>↑ ELEVATOR ASCENDING</span></div><section class="reveal-panel ${animate?'arriving':''}" style="--rarity:${rating.color}" aria-live="polite"><div class="rarity-icon" aria-hidden="true">${rating.symbol}</div><h1 class="rarity-name ${r.points===100?'jackpot':''}">${label}</h1><p class="landed-answer">${esc(r.answer||r.input||(r.reason==='skip'?'Keep exploring.':'The next opportunity awaits.'))}</p><div class="reveal-points"><strong>+${r.points}</strong><span>POINTS EARNED</span></div><div class="score-breakdown"><span>${total()-r.points} previous</span><span>+ ${r.points} this answer</span><strong>= ${total()} total</strong></div><p class="next-floor-note">↑ ${floorProgress(total())}</p><p class="reveal-caption">${esc(message)}${r.ai?`<br><span class="ai-verdict">AI-estimated tier · ${esc(r.explanation)}</span>`:''}</p></section><div class="answer-dock reveal-dock"><button class="pixel-button" id="next-button" ${animate&&r.points?'disabled':''}>${animate&&r.points?'ELEVATOR ASCENDING…':run.results.length===7?'VIEW RESULTS →':'NEXT PROMPT →'}</button><button class="small-link" id="answers-button">▸ EXPLORE ACCEPTED ANSWERS</button><div class="rarity-legend">10 · 30 · 60 · 85 · 100 points per answer</div></div>${surfaceButton()}</div>`;bindSurface();updateHud();
    $('#answers-button').onclick=()=>showBank(q);
    $('#next-button').onclick=()=>{if(run.results.length===7)return finish();run.phase='question';run.attempts=0;run.deadline=Date.now()+25000;persist();question();};
    if(animate){setTimeout(()=>{if(token!==transition||run?.phase!=='feedback')return;if(r.points)sound('travel');O.dive(currentDepth()).then(()=>{if(token!==transition||run?.phase!=='feedback')return;$('.game-screen').classList.remove('deal-travelling');$('.reveal-panel').classList.add('deal-landed');O.celebrate?.(r.points);sound(r.points);$('#next-button').disabled=false;$('#next-button').textContent=run.results.length===7?'VIEW RESULTS →':'NEXT PROMPT →';$('#announcer').textContent=`${rating.name}. You earned ${r.points} points. Total score ${total()} of 700. ${floorProgress(total())}.`;});},r.points&&!O.reduced?450:0);}
  }
  function finish(){stopClock();run.phase='complete';if(!saved.history.some(h=>h.id===run.id))saved.history.push({id:run.id,day:run.day,mode:run.mode,score:total()});persist();store();results();}
  function results(){
    stopClock();transition++;updateHud();document.body.classList.add('playing');O.dive(currentDepth(),true);
    const score=total(),best=Math.max(0,...saved.history.map(h=>h.score));
    const title=score>=650?'ONE IN A DECAILLION DEAL':score>=500?'BUSINESS TYCOON':score>=350?'DEAL MAKER':score>=200?'RISING EXECUTIVE':score>0?'OPEN FOR BUSINESS':'BACK AT HEADQUARTERS';
    stage.innerHTML=`<section class="result-screen"><div class="result-panel"><p class="result-kicker">${run.mode==='daily'?`DAILY DEALS #${dailyNumber(run.day)}`:'PRACTICE RUN'} COMPLETE</p><h1 class="result-title">${title}</h1><p class="result-depth">${total()}<small>pts</small></p><p class="result-summary">${score} / 700 PTS · ${run.results.filter(r=>r.points).length} / 7 DEALS CLOSED<br>${score===best&&score?'A personal best. That is good business.':'There’s always another big deal to discover.'}</p><div class="result-list">${run.results.map((r,i)=>{const rating=G.rating(r.points);return `<div class="result-row" style="--rarity:${rating.color}"><span>0${i+1}</span><div><strong>${esc(r.answer||r.input||(r.reason==='skip'?'Skipped':'Time ran out'))}</strong><small>${rating.short} · ${r.points} points</small></div><span>+${r.points}</span></div>`;}).join('')}</div><div class="result-buttons"><button id="share-button" class="pixel-button">SHARE DEALS ↗</button><button id="again-button" class="pixel-button pink">ANOTHER DEAL RUN ↑</button></div><button class="small-link" id="result-home">← BACK HOME</button></div></section>`;
    $('#share-button').onclick=share;$('#again-button').onclick=()=>{mode='practice';start();};$('#result-home').onclick=home;
  }
  function showDialog(content){$('#dialog-content').innerHTML=content;if(!dialog.open)dialog.showModal();}
  function closeDialog(){dialog.close();}
  function showBank(q){showDialog(`<p class="dialog-kicker">${esc(q.category).toUpperCase()}</p><h2>THE ANSWER BANK</h2><p>${esc(q.prompt)}</p><p>${esc(q.note)}</p><div class="answer-bank-list">${[...q.answers].sort((a,b)=>b[1]-a[1]).map(a=>`<div class="answer-chip" style="--rarity:${G.rating(G.score(a[1])).color}"><span>${esc(a[0])}</span><b>${G.score(a[1])} pts</b></div>`).join('')}</div><p>Curated rarity tiers. Other reasonable answers may be missing from this bank.</p>`);}
  function menu(){showDialog(`<p class="dialog-kicker">DECAILLION</p><h2>MAKE YOUR NEXT MOVE</h2><div class="menu-items"><button id="menu-daily">Daily deals <span>◇</span></button><button id="menu-practice">Unlimited practice <span>∞</span></button><button id="menu-how">How to play <span>?</span></button><button id="menu-tiers">Rarity tiers <span>◆</span></button><button id="menu-ai">Browser AI <span>${AI.ready?'ON':'SETUP'}</span></button><button id="menu-stats">Your deal log <span>▥</span></button><button id="menu-motion">City animation <span>${O.reduced?'REDUCED':'ON'}</span></button></div>`);$('#menu-daily').onclick=()=>changeMode('daily');$('#menu-practice').onclick=()=>changeMode('practice');$('#menu-how').onclick=how;$('#menu-tiers').onclick=scoring;$('#menu-ai').onclick=()=>{showDialog(`<h2>YOUR LOCAL DEAL JUDGE</h2>${aiPanel()}<p>Enable before starting a run. Known answers are instant; new answers go to the model. The timer pauses while AI judges. A failed judgment does not use your turn.</p>`);bindAI();};$('#menu-stats').onclick=stats;$('#menu-motion').onclick=()=>{O.setReduced(!O.reduced);saved.settings.reduced=O.reduced;store();menu();};}
  function changeMode(next){mode=next;closeDialog();if(run&&run.phase!=='complete')leave();else home();}
  function leave(){if(!run||run.phase==='complete')return home();showDialog(`<p class="dialog-kicker">BACK TO HEADQUARTERS</p><h2>BACK TO HEADQUARTERS?</h2><p>${run.mode==='daily'?'Your daily progress stays saved in this browser. A running question timer keeps counting.':'This practice run will end. You can start a fresh one anytime.'}</p><button id="confirm-leave" class="pixel-button">RETURN HOME ↑</button><button id="keep-diving" class="small-link">KEEP NEGOTIATING →</button>`);$('#confirm-leave').onclick=()=>{closeDialog();home();};$('#keep-diving').onclick=closeDialog;}
  function how(){showDialog(`<p class="dialog-kicker">WELCOME TO THE CITY</p><h2>THINK BIG. CLOSE BIGGER.</h2><ol><li>Seven hospitality prompts. You have <strong>25 seconds</strong> to type answers until one is accepted or time runs out.</li><li>Each answer earns <strong>10, 30, 60, 85 or 100 points</strong> based on its curated rarity tier. Rarer ideas score higher. A skip or timeout earns 0.</li><li>Each point lifts the elevator higher. Every 100 points unlocks a new office floor, with the rooftop as the ultimate level at 600 points.</li></ol><p>Daily deals: one attempt per day in this browser. Unlimited: a new mix whenever you want.</p><p>Enable Browser AI on the home screen for new answers beyond the bank. Its first model download can take several minutes. The timer pauses during AI review. Spelling, common synonyms, and supported descriptions are matched automatically. Browser AI can evaluate other ways of expressing an idea. Keep pitching until an answer is accepted or the clock expires.</p><button class="pixel-button" id="got-it">READY TO NEGOTIATE ↑</button>`);$('#got-it').onclick=closeDialog;}
  function scoring(){showDialog(`<p class="dialog-kicker">HOW BIG IS YOUR DEAL?</p><h2>THE RARITY SCALE</h2><div class="tier-list">${G.ratings.map(r=>`<div style="--rarity:${r.color}"><span>${r.short}</span><b>${r.points} PTS</b></div>`).join('')}</div><p>One accepted answer per prompt. Add its points to your total, up to <strong>700 points across 7 prompts</strong>. Skips and timeouts earn 0. Every <strong>100 total points</strong> takes the elevator up one floor; the rooftop starts at 600.</p><p>Example: 30 points + 85 points = 115 total. That puts you in the Cubicle Farm, 85 points from the Marketing Studio.</p><p>${window.HOSPITALITY_BANK.length} hospitality prompts, 50 curated answers each. Scores are assigned tiers, not live player frequencies.</p><p>Browser AI can judge answers beyond the bank and estimate a tier. These are estimates, not measured player frequencies. Small local models can be wrong. Explore the curated answers after each prompt.</p><p>Earlier run scores are preserved in your log. Independent study game; not affiliated with DECA Inc. or Krillion.</p>`);}
  function stats(){const best=Math.max(0,...saved.history.map(h=>h.score));let streak=0;const d=new Date();if(!saved.history.some(h=>h.mode==='daily'&&h.day===dayKey(d)))d.setDate(d.getDate()-1);while(saved.history.some(h=>h.mode==='daily'&&h.day===dayKey(d))){streak++;d.setDate(d.getDate()-1);}showDialog(`<p class="dialog-kicker">YOUR DEAL LOG</p><h2>YOUR BUSINESS PORTFOLIO</h2><div class="stat-grid"><div><strong>${saved.history.length}</strong><span>RUNS</span></div><div><strong>${best}</strong><span>BEST SCORE</span></div><div><strong>${streak}</strong><span>DAY STREAK</span></div></div><p>${saved.history.length?'The next big deal is out there.':'Finish your first run to start your log.'}</p><p>Progress is saved in this browser.</p>`);}
  async function share(){const text=`DECAILLION ${run.mode==='daily'?`#${dailyNumber(run.day)}`:'UNLIMITED'}\n${total()}/700 PTS\n${run.results.map(r=>r.points===100?'💎':r.points>=75?'🟪':r.points>=50?'🟦':r.points>=25?'🟩':r.points?'⬜':'⬛').join('')}\nBigger ideas close bigger deals.\n${location.origin}`;try{await navigator.clipboard.writeText(text);toast('DEALS COPIED. SHARE IT WITH YOUR CHAPTER.');}catch{showDialog(`<h2>SHARE YOUR DEALS</h2><textarea id="share-text" class="share-text" aria-label="Share text">${esc(text)}</textarea><p>Select and copy your results to share it.</p>`);$('#share-text').select();}}
  function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000);}
  $('#menu-button').onclick=menu;$('#stats-button').onclick=stats;$('.dialog-close').onclick=closeDialog;
  $('#sound-button').onclick=()=>{saved.settings.sound=!saved.settings.sound;window.DealAudio?.unlock();window.DealAudio?.setEnabled(!!saved.settings.sound);syncSound();store();if(saved.settings.sound)sound(30);};
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!judging&&run?.phase==='question'&&Date.now()>=run.deadline)submit('','timeout');});
  if(typeof saved.settings.reduced==='boolean')O.setReduced(saved.settings.reduced);
  syncSound();home();
})();