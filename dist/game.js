(function(root){
  'use strict';
  const ratings=[
    {name:'SIDE-HUSTLE DEAL',short:'Common',min:1,points:10,color:'#a9bdcc',symbol:'▪',description:'A first handshake. Every empire starts somewhere.'},
    {name:'SIX-FIGURE DEAL',short:'Uncommon',min:25,points:30,color:'#83e5ae',symbol:'◆',description:'A promising contract. Business is picking up.'},
    {name:'MILLION-DOLLAR DEAL',short:'Rare',min:50,points:60,color:'#59d9fa',symbol:'✦',description:'A million-dollar idea. Welcome to the big leagues.'},
    {name:'BILLION-DOLLAR DEAL',short:'Deep Cut',min:75,points:85,color:'#c391ff',symbol:'✧',description:'A boardroom breakthrough. That is a serious deal.'},
    {name:'ONE IN A DECAILLION DEAL',short:'DECAILLION',min:100,points:100,color:'#ffd875',symbol:'◈',description:'The deal of a lifetime. Signed, sealed, DECAILLION.'}
  ];
  function normalize(s){return String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');}
  function exactMatch(q,value){const n=normalize(value);return q.answers.find(a=>[a[0],...(a[2]||'').split('|')].some(s=>n&&normalize(s)===n))||null;}
  function distance(a,b){const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[a.length][b.length];}
  function spellingMatch(q,value){const exact=exactMatch(q,value);if(exact)return exact;const n=normalize(value);if(n.length<5)return null;const ranked=q.answers.map(a=>({a,d:Math.min(...[a[0],...(a[2]||'').split('|')].filter(Boolean).map(v=>distance(n,normalize(v))))})).sort((a,b)=>a.d-b.d);const limit=n.length>=10?2:1;return ranked[0]&&ranked[0].d<=limit&&(!ranked[1]||ranked[1].d>ranked[0].d)?ranked[0].a:null;}
  // Concept aliases cover everyday descriptions, not just typographical variants.
  const concepts={
    'Room service':['bring food to the room','deliver meals to guest rooms','in room dining'],
    'Offer a refund':['give their money back','return the money','refund the guest','reimburse the guest'],
    'Listen':['hear them out','let them explain','listen to the guest'],
    'Apologize':['say sorry','tell them we are sorry'],
    'Show empathy':['understand how they feel','show understanding'],
    'Follow up':['check on them later','check back with the guest'],
    'Change the room':['move them to another room','switch their room','give them a different room'],
    'Call a manager':['get the manager','ask a supervisor to help'],
    'Fix the issue':['solve the problem','resolve the problem'],
    'Offer an upgrade':['give them a better room','upgrade their room'],
    'Free upgrades':['give guests better rooms for free'],
    'Loyalty program':['reward repeat customers','rewards program','points program','loyalty scheme'],
    'Loyalty points':['give points for repeat stays','reward points'],
    'Remember preferences':['remember what guests like','keep track of guest preferences'],
    'Personalized service':['tailor service to the guest','customize the guest experience'],
    'Housekeeping':['cleaning guest rooms','room cleaning team'],
    'Make beds':['making the bed','make the bed'],
    'Change sheets':['replace bed sheets','changing the bedding','change bed linen'],
    'Replace towels':['put out fresh towels','change the towels'],
    'Empty trash':['take out the garbage','empty the bins','remove rubbish'],
    'Restock toiletries':['refill shampoo and soap','replenish bathroom supplies'],
    'Reuse towels':['use towels again','towel reuse'],
    'Linen reuse program':['wash sheets less often','let guests reuse bedding'],
    'Low-flow showers':['water saving shower heads','low flow showerheads'],
    'Motion sensors':['lights that turn off when nobody is there','motion activated lighting'],
    'Refillable toiletries':['refillable shampoo bottles','bulk soap dispensers'],
    'Reduce food waste':['waste less food','cut food waste'],
    'Donate surplus food':['give leftover food to charity','donate leftover food'],
    'Buy local':['source ingredients locally','purchase local products'],
    'LED lighting':['led bulbs','energy saving light bulbs'],
    'Solar panels':['solar power','solar energy'],
    'Mobile key':['use a phone to unlock the room','phone room key','digital room key'],
    'Self-service kiosk':['self check in machine','automated check in kiosk'],
    'Dynamic pricing':['adjust prices based on demand','change rates with demand'],
    'Upselling':['suggest a more expensive option','sell a room upgrade','encourage a premium option'],
    'Cross-selling':['suggest complementary products','offer related extras'],
    'Check-in':['checking guests in','register arriving guests'],
    'Check-out':['checking guests out','process departures'],
    'Airport shuttle':['rides to the airport','airport bus','shuttle to airport'],
    'Luggage storage':['hold their bags','store suitcases','baggage storage'],
    'Accessible room':['wheelchair accessible room','room for wheelchair users'],
    'Ramp':['sloped entrance for wheelchairs','wheelchair ramp'],
    'Step-free entrance':['entrance without stairs','no steps at entrance'],
    'Visual alarms':['flashing alarms','alarms with flashing lights'],
    'Captioned videos':['videos with subtitles','closed captions'],
    'Late checkout':['let guests leave later','later check out'],
    'Early check-in':['let guests check in early'],
    'Free breakfast':['complimentary breakfast','breakfast included'],
    'Wi-Fi':['wireless internet','free internet','wireless connection'],
    'Gym':['workout room','exercise room','fitness facilities'],
    'Pet amenities':['pet supplies','dog bowls and beds'],
    'Guest satisfaction':['how happy guests are','guest happiness'],
    'Occupancy rate':['percentage of rooms occupied','percent of rooms sold'],
    'Average daily rate':['average room rate','average price per sold room'],
    'Revenue per available room':['room revenue divided by available rooms'],
    'Valet parking':['park cars for guests','someone parks your car'],
    'Concierge':['help guests book activities','guest recommendations desk'],
    'Vegetarian options':['meals without meat','meatless options'],
    'Vegan options':['plant based meals','food without animal products'],
    'Dietary restrictions':['food allergies and dietary needs','special diets'],
    'Guest count':['number of guests','how many people are coming'],
    'Budget':['how much money is available','spending limit'],
    'Weather forecast':['check the weather','expected weather'],
    'Contingency plan':['backup plan','plan b'],
    'Friendly service':['be nice to guests','welcoming staff'],
    'Social media':['post on instagram','tiktok posts','facebook posts'],
    'Email marketing':['send promotional emails','email newsletter'],
    'Referral program':['reward guests for referring friends'],
    'Food cost':['cost of ingredients','ingredient costs'],
    'Wages':['staff pay','employee salaries','payroll'],
    'Staffing':['number of staff','staff needed','employees needed']
  };
  function words(value){
    let s=String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/&/g,' and ').replace(/\bwi[ -]?fi\b/g,'wifi')
      .replace(/\bcomplimentary\b/g,'free').replace(/\b(?:customers?|clients?|visitors?)\b/g,'guest')
      .replace(/\b(?:garbage|rubbish)\b/g,'trash').replace(/\b(?:workers?|employees?)\b/g,'staff')
      .replace(/\b(?:automobiles?|vehicles?)\b/g,'car').replace(/\b(?:purchase|purchasing)\b/g,'buy')
      .replace(/\b(?:offering|providing|provide|offers|offer)\b/g,'give')
      .replace(/\b(?:reduce|reducing|decrease|decreasing)\b/g,'cut');
    const stop=new Set('we they a an the to of for in at on with and their your our its them it guest hotel restaurant could can should would use using have has having by is are be such as example like i think maybe give'.split(' '));
    return [...new Set((s.match(/[a-z0-9]+/g)||[]).filter(t=>!stop.has(t)).map(t=>t.length>4&&t.endsWith('ies')?t.slice(0,-3)+'y':t.length>4&&t.endsWith('ing')?t.slice(0,-3).replace(/(.)\1$/,'$1'):t.length>3&&t.endsWith('s')&&!t.endsWith('ss')?t.slice(0,-1):t))].sort();
  }
  function meaningMatch(q,value){
    // Do not turn negated suggestions or an unrelated sentence into a positive answer.
    if(/\b(no|not|never|without|avoid|don't|dont|cannot|can't)\b/i.test(value)){
      return q.answers.find(a=>(concepts[a[0]]||[]).some(v=>normalize(v)===normalize(value)))||null;
    }
    const input=words(value);if(!input.length)return null;
    const hits=q.answers.filter(a=>[a[0],...(a[2]||'').split('|'),...(concepts[a[0]]||[])].filter(Boolean).some(v=>{
      const candidate=words(v);return candidate.length===input.length&&candidate.every((w,i)=>w===input[i]);
    }));
    // A specific phrase wins over a vague or ambiguous interpretation.
    return hits.length===1?hits[0]:null;
  }
  function match(q,value){return spellingMatch(q,value)||meaningMatch(q,value);}
  function score(points){return ({10:10,25:30,50:60,75:85,100:100})[points]||0;}
  function rating(points){return [...ratings].reverse().find(r=>points>=r.min)||{name:'DEAL NOT CLOSED',short:'Miss',points:0,color:'#f27798',symbol:'×',description:'A fresh category is just ahead.'};}
  function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function select(bank,seed){const r=random(hash(seed)),a=[...bank];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,7).map(q=>q.id);}
  const zones=['LOBBY','CUBICLE FARM','MARKETING STUDIO','BREAK ROOM','BOARDROOM','EXECUTIVE SUITE','ROOFTOP'];
  function zone(depth){return zones[Math.min(6,Math.max(0,Math.floor(depth/1000)))];}
  const api={ratings,normalize,match,score,rating,select,zone};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Game=api;
})(typeof window==='undefined'?this:window);