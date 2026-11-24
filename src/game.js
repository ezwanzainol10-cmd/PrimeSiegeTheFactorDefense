const $=id=>document.getElementById(id);

let score=0,base=100,level=1,combo=0,maxHp=40,hp=40,x=5,speed=.045,alive=true,tickId;
let hitFactors=new Set(),shotInFlight=false,remainingFactors=[],initialRaksasaNumber=40,packBeasts=[],waveEnemies=[],waveIndex=0,changingTarget=false;
let soundOn=true,musicOn=true,audioCtx=null,musicTimer=null,musicStep=0,gameEnded=false,battleMusic=null;
let playerName="PEMAIN",difficulty="medium",difficultyMultiplier=1,scoreSavedForRun=false;
const LEADERBOARD_KEY="primeSiegeLeaderboardV1";
const PLAYER_KEY="primeSiegePlayerNameV1";
const DIFFICULTY_KEY="primeSiegeDifficultyV1";

const BEASTS=[
 {name:"BADAK BESI",type:"Raksasa Kebal",color:"#c43855",numbers:[24,29,40,56,60,64,80,90,100,120,144],hp:1.2,speed:.80},
 {name:"PEMANGSA SANGAR",type:"Raksasa Pantas",color:"#8b42c9",numbers:[23,31,36,48,54,72,81,96,108,126,150],hp:.8,speed:1.35},
 {name:"PENGHANCUR BATU",type:"Raksasa Berat",color:"#6d7885",numbers:[37,42,49,63,84,96,112,126,144,168,196],hp:1.5,speed:.62},
 {name:"JELMAAN API",type:"Raksasa Api",color:"#e26a28",numbers:[30,41,45,55,60,75,88,99,110,135,165],hp:1.0,speed:1.05},
 {name:"PENGINTAI BAYANG",type:"Raksasa Bayang",color:"#273a8f",numbers:[43,50,56,70,77,98,104,119,140,154,175],hp:1.1,speed:1.18}
];
const CORE_NUMBERS=[40,42,48,54,60,66,70,72,75,80,84,90,96,98,100,108,120,126,144,150,168,180,196,210,225,240];

function factors(n){
 const a=[];
 for(let i=1;i<=Math.floor(Math.sqrt(n));i++){
  if(n%i===0){a.push(i);if(i!==n/i)a.push(n/i);}
 }
 return a.sort((x,y)=>x-y);
}
function prime(n){if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true}
function pf(n){
 const a=[];
 for(let p=2;p*p<=n;p++)while(n%p===0){a.push(p);n/=p;}
 if(n>1)a.push(n);
 return a;
}
function pair(n){
 for(let i=2;i<=Math.floor(Math.sqrt(n));i++)if(n%i===0)return[i,n/i];
 return [n];
}

function ensureAudio(){
 if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==="suspended")audioCtx.resume();
}
function tone(freq,dur=.08,type="sine",gain=.05){
 if(!soundOn)return;ensureAudio();
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.value=freq;g.gain.value=gain;
 o.connect(g);g.connect(audioCtx.destination);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);
 o.start();o.stop(audioCtx.currentTime+dur);
}
function cannonSound(){tone(120,.06,"sawtooth",.09);setTimeout(()=>tone(620,.11,"square",.045),20);setTimeout(()=>tone(260,.16,"triangle",.025),45)}
function missileWhoosh(){if(!soundOn)return;ensureAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type="sawtooth";o.frequency.setValueAtTime(520,now);o.frequency.exponentialRampToValueAtTime(95,now+.24);g.gain.setValueAtTime(.0001,now);g.gain.linearRampToValueAtTime(.035,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+.25);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+.26)}
function hurtSound(){tone(180,.08,"sawtooth",.07);setTimeout(()=>tone(110,.16,"triangle",.055),55)}
function stepSound(){tone(62,.055,"square",.018);}
function stepSound(){tone(62,.055,"square",.018);}
function beastRoar(){
 if(!soundOn)return;
 ensureAudio();
 const now=audioCtx.currentTime;
 // Original cinematic kaiju-style roar: layered descending growl, rough formants and breath noise.
 const low=audioCtx.createOscillator(),lowGain=audioCtx.createGain(),lowFilter=audioCtx.createBiquadFilter();
 low.type="sawtooth";
 low.frequency.setValueAtTime(92,now);
 low.frequency.exponentialRampToValueAtTime(38,now+.78);
 low.frequency.exponentialRampToValueAtTime(58,now+1.05);
 lowFilter.type="lowpass";lowFilter.frequency.setValueAtTime(520,now);lowFilter.frequency.exponentialRampToValueAtTime(150,now+.9);
 lowGain.gain.setValueAtTime(.0001,now);lowGain.gain.linearRampToValueAtTime(.22,now+.07);lowGain.gain.setValueAtTime(.17,now+.42);lowGain.gain.exponentialRampToValueAtTime(.0001,now+1.08);
 low.connect(lowFilter);lowFilter.connect(lowGain);lowGain.connect(audioCtx.destination);low.start(now);low.stop(now+1.1);
 const growl=audioCtx.createOscillator(),growlGain=audioCtx.createGain(),growlFilter=audioCtx.createBiquadFilter();
 growl.type="square";growl.frequency.setValueAtTime(185,now+.02);growl.frequency.exponentialRampToValueAtTime(72,now+.72);
 growlFilter.type="bandpass";growlFilter.frequency.setValueAtTime(430,now);growlFilter.Q.value=1.1;
 growlGain.gain.setValueAtTime(.0001,now);growlGain.gain.linearRampToValueAtTime(.075,now+.1);growlGain.gain.exponentialRampToValueAtTime(.0001,now+.82);
 growl.connect(growlFilter);growlFilter.connect(growlGain);growlGain.connect(audioCtx.destination);growl.start(now);growl.stop(now+.85);
 const length=Math.floor(audioCtx.sampleRate*.82),buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.pow(1-t,1.8);}
 const breath=audioCtx.createBufferSource(),breathFilter=audioCtx.createBiquadFilter(),breathGain=audioCtx.createGain();
 breath.buffer=buffer;breathFilter.type="lowpass";breathFilter.frequency.setValueAtTime(900,now);breathFilter.frequency.exponentialRampToValueAtTime(260,now+.8);
 breathGain.gain.setValueAtTime(.0001,now);breathGain.gain.linearRampToValueAtTime(.095,now+.08);breathGain.gain.exponentialRampToValueAtTime(.0001,now+.84);
 breath.connect(breathFilter);breathFilter.connect(breathGain);breathGain.connect(audioCtx.destination);breath.start(now);breath.stop(now+.85);
}
function defeatSound(){[330,440,660,880].forEach((f,i)=>setTimeout(()=>tone(f,.18,"square",.045),i*70))}
function bossSound(){[110,165,220].forEach((f,i)=>setTimeout(()=>tone(f,.4,"sawtooth",.05),i*110))}
function explosionSound(){
 if(!soundOn)return;ensureAudio();
 const now=audioCtx.currentTime;
 // Deep bomb-like impact, broadband blast, then a short metallic debris tail.
 const sub=audioCtx.createOscillator(),subGain=audioCtx.createGain();
 sub.type="sine";sub.frequency.setValueAtTime(125,now);sub.frequency.exponentialRampToValueAtTime(27,now+.95);
 subGain.gain.setValueAtTime(.0001,now);subGain.gain.linearRampToValueAtTime(.72,now+.014);subGain.gain.exponentialRampToValueAtTime(.0001,now+1.02);
 sub.connect(subGain);subGain.connect(audioCtx.destination);sub.start(now);sub.stop(now+1.04);
 const length=Math.floor(audioCtx.sampleRate*.9),buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.pow(1-t,1.55);}
 const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),noiseGain=audioCtx.createGain();
 noise.buffer=buffer;filter.type="lowpass";filter.frequency.setValueAtTime(4200,now);filter.frequency.exponentialRampToValueAtTime(180,now+.88);
 noiseGain.gain.setValueAtTime(.0001,now);noiseGain.gain.linearRampToValueAtTime(.48,now+.012);noiseGain.gain.exponentialRampToValueAtTime(.0001,now+.92);
 noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(audioCtx.destination);noise.start(now);noise.stop(now+.94);
 const crack=audioCtx.createOscillator(),crackGain=audioCtx.createGain();
 crack.type="triangle";crack.frequency.setValueAtTime(760,now+.025);crack.frequency.exponentialRampToValueAtTime(95,now+.28);
 crackGain.gain.setValueAtTime(.0001,now);crackGain.gain.linearRampToValueAtTime(.18,now+.025);crackGain.gain.exponentialRampToValueAtTime(.0001,now+.31);
 crack.connect(crackGain);crackGain.connect(audioCtx.destination);crack.start(now);crack.stop(now+.33);
}

// Muzik latar perang sinematik asli: lapisan tali, loyang, dram medan dan dentuman timpani.
let musicBeat=0;
function musicNote(freq,startAt,duration,wave="sawtooth",volume=.08){
 if(!audioCtx||!musicOn)return;
 const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
 osc.type=wave;osc.frequency.setValueAtTime(freq,startAt);
 filter.type="lowpass";filter.frequency.setValueAtTime(wave==="sawtooth"?1250:2300,startAt);
 gain.gain.setValueAtTime(.0001,startAt);gain.gain.linearRampToValueAtTime(volume,startAt+.045);
 gain.gain.setValueAtTime(volume*.78,startAt+duration*.55);gain.gain.exponentialRampToValueAtTime(.0001,startAt+duration);
 osc.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);osc.start(startAt);osc.stop(startAt+duration+.02);
}
function warDrum(startAt,kind="snare"){
 if(!audioCtx||!musicOn)return;
 const length=Math.floor(audioCtx.sampleRate*(kind==="snare"?.20:.34));
 const buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.pow(1-t,kind==="snare"?2.8:1.5);}
 const src=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();
 src.buffer=buffer;filter.type="lowpass";filter.frequency.value=kind==="snare"?2400:480;
 gain.gain.setValueAtTime(kind==="snare"?.22:.42,startAt);gain.gain.exponentialRampToValueAtTime(.0001,startAt+(kind==="snare"?.19:.32));
 src.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);src.start(startAt);src.stop(startAt+length/audioCtx.sampleRate);
 if(kind==="timpani"){
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.setValueAtTime(105,startAt);o.frequency.exponentialRampToValueAtTime(42,startAt+.28);
  g.gain.setValueAtTime(.25,startAt);g.gain.exponentialRampToValueAtTime(.0001,startAt+.31);o.connect(g);g.connect(audioCtx.destination);o.start(startAt);o.stop(startAt+.32);
 }
}
function musicLoop(){
 if(!musicOn||!audioCtx||gameEnded)return;
 const now=audioCtx.currentTime;
 const roots=[73.42,73.42,82.41,65.41,87.31,82.41,98,73.42];
 const melody=[293.66,349.23,392,349.23,261.63,293.66,220,246.94];
 const beat=musicBeat%8,root=roots[beat];
 // Brass-like low chords and urgent rising string ostinato.
 musicNote(root,now,.36,"sawtooth",.19);musicNote(root*1.5,now+.025,.30,"sawtooth",.09);
 musicNote(root*2,now,.38,"triangle",.11);
 musicNote(melody[beat],now+.04,.34,"sawtooth",.075);
 musicNote(melody[beat]*2,now+.19,.20,"triangle",.035);
 if(beat===0||beat===4)warDrum(now,"timpani");
 if(beat===2||beat===6)warDrum(now,"snare");
 if(beat===3||beat===7)musicNote(root*.5,now,.22,"square",.09);
 musicBeat++;
}
function stopBattleMusic(){
 if(battleMusic){battleMusic.pause();battleMusic.currentTime=0;}
}
function startMusic(){
 if(!musicOn||gameEnded)return;
 if(!battleMusic){
  battleMusic=new Audio("assets/prime-siege-battle-theme.wav");
  battleMusic.loop=true;
  battleMusic.volume=0.82;
  battleMusic.preload="auto";
 }
 battleMusic.play().catch(()=>{});
}

function msg(t){$("message").textContent=t;$("message").classList.add("show");clearTimeout(msg.t);msg.t=setTimeout(()=>$("message").classList.remove("show"),1000)}
function ui(){
 $("score").textContent=score;$("baseHp").textContent=base+"%";$("level").textContent=level;$("combo").textContent=combo;
 $("beastNumber").textContent=maxHp>1?maxHp:"";$("hpFill").style.width=(100*maxHp/initialRaksasaNumber)+"%";$("beast").style.left=x+"%";
 $("beastName").textContent=window.beast?.name||"RAKSASA NOMBOR";
 $("beastNumber").title=prime(maxHp)?"Nombor perdana":"Nombor komposit";
 packBeasts.forEach((el,i)=>{el.style.left=(x-(i+1)*11)+"%";const badge=el.querySelector(".pack-number-badge");if(badge&&waveEnemies[i+1])badge.textContent=waveEnemies[i+1].number;const name=el.querySelector(".pack-name-badge");if(name&&waveEnemies[i+1])name.textContent=waveEnemies[i+1].name;});
 const typeLabel=$("numberType");
 if(typeLabel)typeLabel.textContent=prime(maxHp)?"NOMBOR PERDANA":"NOMBOR KOMPOSIT";
 const difficultyLabel=$("difficultyLabel");
 if(difficultyLabel)difficultyLabel.textContent=({low:"RENDAH",medium:"SEDERHANA",high:"TINGGI"})[difficulty]||"SEDERHANA";
}
function difficultySpeedCap(){return ({low:.17,medium:.255,high:.36})[difficulty]||.255;}
function restoreCannon(){
 const cannon=document.querySelector(".cannon");
 if(!cannon)return;
 cannon.classList.remove("cannon-explode");
 cannon.getAnimations().forEach(animation=>animation.cancel());
 cannon.style.opacity="1";cannon.style.visibility="visible";cannon.style.filter="";
 void cannon.offsetWidth;
}
function clearBeastPack(){
 packBeasts.forEach(el=>el.remove());packBeasts=[];
}
function createBeastPack(){
 clearBeastPack();
 const main=$("beast");
 for(let i=1;i<waveEnemies.length;i++){
  const clone=main.cloneNode(true);clone.removeAttribute("id");clone.classList.add("beast-pack-ally");
  clone.setAttribute("aria-hidden","true");clone.style.left=(-6-i*11)+"%";clone.style.zIndex=String(6-i);
  clone.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
  clone.querySelectorAll("strong,small,.number-type,.beast-hp").forEach(el=>el.remove());
  const number=document.createElement("strong");number.className="pack-number-badge";number.textContent=waveEnemies[i].number;
  const name=document.createElement("small");name.className="pack-name-badge";name.textContent=waveEnemies[i].name;
  clone.append(number,name);$("arena").appendChild(clone);packBeasts.push(clone);
 }
}
function setActiveEnemy(enemy){
 window.beast=enemy.beast;maxHp=enemy.number;hp=maxHp;initialRaksasaNumber=enemy.number;
 remainingFactors=pf(enemy.number);hitFactors=new Set();
 document.documentElement.style.setProperty("--beast-color",enemy.beast.color);
 $("beastNumber").textContent=maxHp;$("beastName").textContent=enemy.beast.name;
 $("beast").classList.remove("hit","defeat");$("beast").style.opacity="1";
}
function chooseBeast(){
 const total=level>=5?Math.min(5,2+Math.floor((level-5)/3)):1;
 waveEnemies=Array.from({length:total},()=>{
  const b=BEASTS[Math.floor(Math.random()*BEASTS.length)];
  return {beast:b,number:b.numbers[Math.floor(Math.random()*b.numbers.length)]};
 });
 waveIndex=0;x=5;shotInFlight=false;changingTarget=false;setActiveEnemy(waveEnemies[0]);
 // Kelajuan dikurangkan lagi kira-kira 10% berbanding versi sebelumnya.
 // Kelajuan dipulihkan mengikut tetapan PRIME SIEGE V9.
 speed=Math.min((.070+level*.006)*window.beast.speed*difficultyMultiplier,difficultySpeedCap());alive=true;
 createBeastPack();
 if(soundOn&&audioCtx)setTimeout(beastRoar,180);
}
function start(){
 clearInterval(tickId);
 clearBeastPack();
 const beastEl=$("beast");beastEl.classList.remove("defeat","hit");beastEl.style.opacity="1";beastEl.style.transform="";
 restoreCannon();
 chooseBeast();ammo();ui();
 tickId=setInterval(move,50);
}
function move(){
 if(!alive||gameEnded)return;
 x+=speed;
 packBeasts.forEach((el,i)=>{el.style.left=(x-(i+1)*11)+"%";const badge=el.querySelector(".pack-number-badge");if(badge&&waveEnemies[i+1])badge.textContent=waveEnemies[i+1].number;const name=el.querySelector(".pack-name-badge");if(name&&waveEnemies[i+1])name.textContent=waveEnemies[i+1].name;});
 if(Math.floor(x*2)!==Math.floor((x-speed)*2))stepSound();
 const beastBox=$("beast").getBoundingClientRect(),cannonEl=document.querySelector(".cannon");
 if(!cannonEl){console.error("Cannon element missing from arena");return;}
 const cannonBox=cannonEl.getBoundingClientRect();
 const touching=beastBox.right>=cannonBox.left && beastBox.left<=cannonBox.right && beastBox.bottom>=cannonBox.top && beastBox.top<=cannonBox.bottom;
 if(touching){alive=false;clearInterval(tickId);base=0;combo=0;ui();triggerGameOver();return}
 ui();
}
function ammo(){
 // Include EVERY required prime factor, including duplicates (e.g. 12 needs 2, 2, 3).
 // Decoy missiles are prime numbers that do not divide the raksasa's original number.
 const required=waveEnemies.flatMap(enemy=>pf(enemy.number));
 const primePool=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
 const distractorPool=primePool.filter(n=>!waveEnemies.some(enemy=>enemy.number%n===0) && !required.includes(n));
 const distractors=[];
 while(distractors.length<Math.max(3,7-required.length) && distractorPool.length){
  const idx=Math.floor(Math.random()*distractorPool.length);
  distractors.push(distractorPool.splice(idx,1)[0]);
 }
 const choices=[...required,...distractors];
 // Fisher-Yates shuffle avoids sort(Math.random()) bias.
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 $("ammo").innerHTML="";
 choices.forEach((n,index)=>{
  const b=document.createElement("button");
  b.className="missile-ammo";b.innerHTML=`<span class="missile-mini"></span><b>${n}</b>`;
  b.setAttribute("aria-label","Peluru berpandu faktor "+n);
  b.dataset.factor=n;b.dataset.ammoId=String(index);
  b.onclick=()=>shoot(n,b);
  $("ammo").appendChild(b);
 });
}

function animateShot(){
 shotInFlight=true;setTimeout(()=>{shotInFlight=false},250);
 const arena=$("arena"),c=document.querySelector(".cannon"),beast=$("beast");
 c.classList.remove("cannon-fire");void c.offsetWidth;c.classList.add("cannon-fire");
 setTimeout(()=>c.classList.remove("cannon-fire"),190);
 const a=arena.getBoundingClientRect(),cr=c.getBoundingClientRect(),br=beast.getBoundingClientRect();
 const s=document.createElement("div");s.className="shot missile-projectile";s.style.left=(cr.left-a.left+cr.width*.75)+"px";s.style.top=(cr.top-a.top+cr.height*.38)+"px";arena.appendChild(s);
 const ex=br.left-a.left+br.width*.45,ey=br.top-a.top+br.height*.5;
 const sx=parseFloat(s.style.left),sy=parseFloat(s.style.top),dx=ex-sx,dy=ey-sy;
 s.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${dx}px,${dy}px) scale(.45)`}],{duration:240,easing:"cubic-bezier(.2,.8,.2,1)"});
 setTimeout(()=>s.remove(),250);
 const mf=document.createElement("div");mf.className="muzzle-flash";arena.appendChild(mf);mf.classList.add("fire");setTimeout(()=>mf.remove(),220);
 cannonSound();missileWhoosh();
}
function shoot(n,b){
 if(!alive||gameEnded||changingTarget||b.disabled)return;
 b.disabled=true;animateShot();
 const beastEl=$("beast");beastEl.classList.remove("hit");void beastEl.offsetWidth;beastEl.classList.add("hit");
 // Every impact provokes an audible raksasa roar, whether the factor is right or wrong.
 setTimeout(()=>{if(soundOn)beastRoar();},55);
 // A valid missile must be prime and divide the raksasa's CURRENT remaining number.
 if(prime(n)&&maxHp%n===0){
  maxHp=maxHp/n;const usedAt=remainingFactors.indexOf(n);if(usedAt>=0)remainingFactors.splice(usedAt,1);hitFactors.add(n);
  combo++;score+=10+combo*3;hurtSound();
  msg("✓ Tepat! "+n+" membahagi nombor dengan tepat. Baki: "+maxHp);
  if(maxHp===1){
   beastEl.classList.add("defeat");score+=100;defeatSound();
   waveEnemies.shift();
   if(waveEnemies.length){
    changingTarget=true;msg("⚔ RAKSASA DITUMPAKAN! BALA BANTUAN MENYERANG!");
    setTimeout(()=>{if(gameEnded)return;setActiveEnemy(waveEnemies[0]);createBeastPack();changingTarget=false;ui();},420);
   }else{
    alive=false;clearInterval(tickId);$("beastNumber").textContent="";level++;msg("🏆 SEMUA RAKSASA DITUMPAKAN!");
    setTimeout(()=>{if(!gameEnded){if(level%4===0)boss();else start();}},700);
   }
  }
 }else{
  b.disabled=false;combo=0;speed=Math.min(speed*1.55+.012*difficultyMultiplier,difficultySpeedCap());score=Math.max(0,score-5);
  msg("⚠️ Peluru "+n+" bukan faktor perdana bagi baki "+maxHp+"! Raksasa bergerak lebih laju.");
 }
 ui();
}

function flash(){modal(`<h2>💎 BONUS FAKTOR</h2><p>Apakah dua faktor yang sentiasa wujud bagi nombor <b>${maxHp}</b>?</p><div class="formula"><button onclick="bonus(true)">1 dan ${maxHp}</button><button onclick="bonus(false)">2 dan ${maxHp}</button></div>`)}
function bonus(ok){if(ok){score+=100;msg("BONUS +100")}else score=Math.max(0,score-25);closeModal();setTimeout(start,400);ui()}
function boss(){
  bossSound();
  const n=CORE_NUMBERS[Math.floor(Math.random()*CORE_NUMBERS.length)],fs=pf(n);
  window.coreNumber=n;window.target=fs;window.pos=0;window.coreDuration=30;
  const counts={};fs.forEach(v=>counts[v]=(counts[v]||0)+1);
  window.coreCounts=counts;window.corePicked={};
  const distractors=[2,3,5,7,11,13,17,19].filter(v=>!fs.includes(v));
  const choices=[...new Set([...fs,...distractors.slice(0,Math.max(2,7-new Set(fs).size))])].sort((a,b)=>a-b);
  modal(`<div class="core-shell core-howto">
    <div class="core-topline"><span>⚡ TAKLIMAT MISI</span><span class="core-rank">TAHAP BOS</span></div>
    <h2>TERAS PERDANA</h2><p class="core-subtitle">PANDUAN MISI • STABILKAN REAKTOR</p>
    <div class="howto-badge">🧠 MISI PEMFAKTORAN PERDANA</div>
    <p class="core-instruction">Reaktor mengandungi nombor <b>${n}</b>. Cari faktor perdana yang membahagi nombor itu sehingga hasil bahagi menjadi 1.</p>
    <div class="howto-steps">
      <div><b>01</b><span><strong>Pilih faktor perdana</strong><small>Pilih nombor perdana yang boleh membahagi nombor semasa dengan tepat.</small></span></div>
      <div><b>02</b><span><strong>Ulang jika perlu</strong><small>Faktor yang sama boleh dipilih lebih daripada sekali jika pemfaktoran memerlukannya.</small></span></div>
      <div><b>03</b><span><strong>Lengkapkan semua slot</strong><small>Susun semua faktor sehingga hasil darabnya sama dengan nombor teras.</small></span></div>
      <div><b>04</b><span><strong>Jaga masa</strong><small>Jawapan salah menolak 3 saat. Anda mempunyai 30 saat sahaja untuk menstabilkan reaktor.</small></span></div>
    </div>
    <div class="howto-example">
      <b>DEMONSTRASI ANIMASI • CARA MEMECAHKAN NOMBOR</b>
      <div class="core-demo" aria-label="Contoh 24 dibahagi dengan 2, kemudian 2, kemudian 2 dan 3 sehingga menjadi 1">
        <div class="demo-number n1">24</div><span class="demo-op op1">÷ 2</span>
        <div class="demo-number n2">12</div><span class="demo-op op2">÷ 2</span>
        <div class="demo-number n3">6</div><span class="demo-op op3">÷ 2</span>
        <div class="demo-number n4">3</div><span class="demo-op op4">÷ 3</span>
        <div class="demo-number n5">1</div>
      </div>
      <small class="demo-caption">24 → 12 → 6 → 3 → 1 | Faktor perdana: 2 × 2 × 2 × 3</small>
    </div>
    <button class="play-again core-start" onclick="startCoreGame()">▶ FAHAM — MULAKAN MISI</button>
  </div>`);
  window.coreChoices=choices;
}
function startCoreGame(){
  const n=window.coreNumber,fs=window.target,choices=window.coreChoices;
  window.pos=0;window.deadline=Date.now()+window.coreDuration*1000;
  modal(`<div class="core-shell">
    <div class="core-topline"><span>⚡ PROTOKOL REAKTOR</span><span class="core-rank">TAHAP BOS</span></div>
    <h2>TERAS PERDANA</h2><p class="core-subtitle">STABILKAN REAKTOR • PEMFAKTORAN PERDANA</p>
    <div class="reactor-wrap"><div class="reactor-ring"><div class="reactor-orb"><span id="coreTarget">${n}</span><small>NOMBOR TERAS</small></div></div></div>
    <div class="core-energy-head"><span>TENAGA REAKTOR</span><b id="coreEnergyText">100%</b></div>
    <div class="core-energy"><i id="coreEnergyFill"></i></div>
    <p class="core-instruction">Pilih faktor perdana satu demi satu untuk menguraikan <b>${n}</b>.</p>
    <div class="core-slots" id="coreSlots">${fs.map((v,i)=>`<span class="core-slot" id="coreSlot${i}">?</span>${i<fs.length-1?'<b class="core-times">×</b>':''}`).join('')}</div>
    <div class="core-progress"><span id="coreProgress">0 / ${fs.length} faktor dikenal pasti</span><span class="core-timer-wrap">MASA <b id="coreTimer">30s</b></span></div>
    <div class="core-choices">${choices.map(v=>`<button class="core-choice" onclick="pick(${v},this)">${v}</button>`).join('')}</div>
    <p id="status" class="core-status">Pilih nombor perdana yang membahagi nombor sasaran.</p>
    <button class="play-again" onclick="restartBoss()">↻ MULA SEMULA TERAS</button>
  </div>`);
  clearInterval(window.bossTimer);
  window.bossTimer=setInterval(()=>{
    const left=Math.max(0,Math.ceil((window.deadline-Date.now())/1000));
    const timer=$('coreTimer');if(timer){timer.textContent=left+'s';timer.classList.toggle('urgent',left<=10)}
    if(left<=0){clearInterval(window.bossTimer);const st=$('status');if(st)st.textContent='⛔ MASA TAMAT! Cuba aktifkan semula Teras Perdana.';document.querySelectorAll('.core-choice').forEach(b=>b.disabled=true)}
  },200);
}
function restartBoss(){clearInterval(window.bossTimer);boss()}
function pick(v,b){
  if(Date.now()>window.deadline||b.disabled||window.pos>=window.target.length)return;
  const status=$('status'),energy=$('coreEnergyFill'),energyText=$('coreEnergyText');
  if(v===window.target[window.pos]){
    window.corePicked[v]=(window.corePicked[v]||0)+1;
    b.classList.add('core-correct');
    if(window.corePicked[v]>=window.coreCounts[v])b.disabled=true;
    const slot=$('coreSlot'+window.pos);slot.textContent=v;slot.classList.add('filled');
    window.pos++;score+=25;
    const progress=$('coreProgress');if(progress)progress.textContent=window.pos+' / '+window.target.length+' faktor dikenal pasti';
    const pct=Math.max(0,100-window.pos/window.target.length*15);if(energy)energy.style.width=pct+'%';if(energyText)energyText.textContent=Math.round(pct)+'%';
    if(status)status.textContent='✓ Tepat! '+v+' ialah faktor perdana yang diperlukan.';
    tone(650+window.pos*90,.12,'sine',.07);
    if(window.pos===window.target.length){
      clearInterval(window.bossTimer);score+=250;
      if(status)status.textContent='🌟 REAKTOR DISTABILKAN! Pemfaktoran perdana lengkap.';
      document.querySelectorAll('.core-choice').forEach(btn=>btn.disabled=true);
      const orb=document.querySelector('.reactor-orb');if(orb)orb.classList.add('core-win');
      defeatSound();ui();setTimeout(()=>{closeModal();msg('🌟 TERAS PERDANA DISTABILKAN! +250 BONUS');start()},1300);return;
    }
  }else{
    window.deadline-=3000;
    if(status)status.textContent='⚠️ Bukan faktor perdana yang diperlukan pada langkah ini. Masa -3 saat. Cuba lagi!';
    if(energy)energy.style.width=Math.max(10,parseFloat(energy.style.width||'100')-8)+'%';
    hurtSound();b.classList.add('core-wrong');setTimeout(()=>b.classList.remove('core-wrong'),450);
  }
  ui();
}
function modal(html){$("modal").className="modal";$("modal").innerHTML=`<div class="modal-card">${html}</div>`}
function closeModal(){$("modal").className="modal hidden";$("modal").innerHTML=""}
function triggerGameOver(){
 if(gameEnded)return;
 gameEnded=true;alive=false;clearInterval(tickId);clearInterval(musicTimer);stopBattleMusic();
 const cannon=document.querySelector(".cannon");
 if(cannon){
  cannon.classList.remove("cannon-explode");void cannon.offsetWidth;cannon.classList.add("cannon-explode");
  const arena=$("arena"),blast=document.createElement("div");
  blast.className="cannon-blast";blast.setAttribute("aria-hidden","true");arena.appendChild(blast);
  setTimeout(()=>blast.remove(),1150);
 }
 explosionSound();
 $("message").textContent="💥 MERIAM TELAH DIMUSNAHKAN!";$("message").classList.add("show");
 setTimeout(gameOver,650);
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));}
function getLeaderboard(){
 try{const data=JSON.parse(localStorage.getItem(LEADERBOARD_KEY)||"[]");return Array.isArray(data)?data:[]}catch(_){return []}
}
function saveRunScore(){
 if(scoreSavedForRun)return null;
 scoreSavedForRun=true;
 const entry={name:(playerName||"PEMAIN").slice(0,18),score:Number(score)||0,level:Number(level)||1,difficulty,when:new Date().toISOString()};
 const board=getLeaderboard();board.push(entry);board.sort((a,b)=>b.score-a.score||b.level-a.level||new Date(a.when)-new Date(b.when));
 try{localStorage.setItem(LEADERBOARD_KEY,JSON.stringify(board));}catch(_){/* browser storage quota or privacy settings may prevent persistence */}
 const position=board.findIndex(item=>item===entry);return position>=0?position+1:null;
}
function leaderboardMarkup(limit=5){
 const board=getLeaderboard().slice(0,limit);
 if(!board.length)return '<p class="leaderboard-empty">Belum ada rekod. Tamatkan misi untuk mencatat skor pertama!</p>';
 return `<div class="leaderboard-table"><div class="leaderboard-row leaderboard-head"><span>#</span><span>PEMAIN</span><span>SKOR</span><span>ARAS</span><span>TAHAP</span></div>${board.map((e,i)=>`<div class="leaderboard-row"><b>${i+1}</b><span>${escapeHTML(e.name||"PEMAIN")}</span><strong>${Number(e.score)||0}</strong><span>${Number(e.level)||1}</span><small>${escapeHTML(({low:"RENDAH",medium:"SEDERHANA",high:"TINGGI"}[e.difficulty]||"SEDERHANA"))}</small></div>`).join("")}</div>`;
}
function saveSettingsFromTitle(){
 const nameInput=$("playerNameInput"),difficultyInput=$("difficultySelect");
 playerName=((nameInput?.value||playerName||"PEMAIN").trim().slice(0,18))||"PEMAIN";
 difficulty=difficultyInput?.value||difficulty||"medium";
 difficultyMultiplier=({low:.90,medium:1.15,high:1.48})[difficulty]||1.15;
 try{localStorage.setItem(PLAYER_KEY,playerName);localStorage.setItem(DIFFICULTY_KEY,difficulty);}catch(_){}
}
function gameOver(){
 const rank=saveRunScore();
 modal(`<div class="end-screen"><div class="end-kicker">MISI TAMAT</div><h2>☠️ PERMAINAN TAMAT</h2><p>Raksasa telah memusnahkan meriam.</p><div class="final-score"><small>SKOR AKHIR</small><strong>${score}</strong><span>${escapeHTML(playerName)} • ${({low:"RENDAH",medium:"SEDERHANA",high:"TINGGI"}[difficulty]||"SEDERHANA")} • ARAS ${level}</span></div>${rank?`<p class="rank-note">Kedudukan carta: <b>#${rank}</b></p>`:""}<h3>🏆 CARTA KEDUDUKAN • 10 TERATAS</h3>${leaderboardMarkup(10)}<div class="end-actions"><button class="play-again" onclick="resetGame()">▶ MAIN SEMULA</button><button class="secondary-action" onclick="showTitleScreen()">⌂ SKRIN UTAMA</button></div></div>`);
}
function resetGame(){
 clearInterval(tickId);clearInterval(musicTimer);clearInterval(window.bossTimer);
 gameEnded=false;score=0;base=100;level=1;combo=0;alive=true;scoreSavedForRun=false;
 closeModal();restoreCannon();clearBeastPack();
 $("beast").classList.remove("hit","defeat");$("message").classList.remove("show");
 start();if(musicOn)startMusic();
}
function toggleSound(){soundOn=!soundOn;$("soundToggle").textContent=soundOn?"🔊 BUNYI HIDUP":"🔇 BUNYI MATI";if(soundOn){tone(520,.08);startMusic()}}
function toggleMusic(){musicOn=!musicOn;$("musicToggle").textContent=musicOn?"🎵 MUZIK HIDUP":"🔇 MUZIK MATI";if(musicOn)startMusic();else stopBattleMusic()}

$("restart").onclick=resetGame;
$("soundToggle").onclick=()=>{ensureAudio();toggleSound()};
$("musicToggle").onclick=()=>{ensureAudio();toggleMusic()};
document.addEventListener("pointerdown",()=>{if(musicOn&&!gameEnded)startMusic()},{once:true});
function showHowTo(){
 modal(`<div class="howto-screen"><div class="title-kicker">PANDUAN TAKTIKAL</div><h2>📘 CARA BERMAIN</h2><p><b>SEGMEN 1 — PERTAHANAN FAKTOR</b></p><ol><li>Lihat nombor pada raksasa dan pilih peluru yang merupakan faktor tepat bagi nombor semasa.</li><li>Setiap tembakan betul membahagikan nombor raksasa dengan peluru tersebut.</li><li>Peluru pengalih perhatian tidak perlu digunakan. Peluru salah menyebabkan raksasa memecut dengan sangat pantas.</li><li>Tumpaskan raksasa sebelum ia sampai ke meriam.</li></ol><p><b>SEGMEN 2 — TERAS PERDANA</b></p><ol><li>Setiap 4 aras, aktifkan misi TERAS PERDANA.</li><li>Pilih faktor perdana yang membahagi nombor teras sehingga hasil bahagi menjadi 1.</li><li>Faktor berulang mungkin diperlukan; jawapan salah menolak 3 saat.</li></ol><button class="secondary-action" onclick="showTitleScreen()">← KEMBALI KE SKRIN UTAMA</button></div>`);
}
function showLeaderboard(){
 modal(`<div class="leaderboard-screen"><div class="title-kicker">DEWAN PENJAGA</div><h2>🏆 CARTA KEDUDUKAN</h2><p>10 skor tertinggi yang disimpan pada pelayar/peranti ini.</p>${leaderboardMarkup(10)}<button class="secondary-action" onclick="showTitleScreen()">← KEMBALI KE SKRIN UTAMA</button></div>`);
}
function showTitleScreen(){
 clearInterval(tickId);clearInterval(musicTimer);stopBattleMusic();clearInterval(window.bossTimer);alive=false;gameEnded=false;
 let savedName="PEMAIN",savedDifficulty="medium";
 try{savedName=localStorage.getItem(PLAYER_KEY)||"PEMAIN";savedDifficulty=localStorage.getItem(DIFFICULTY_KEY)||"medium";}catch(_){}
 playerName=savedName;difficulty=savedDifficulty;difficultyMultiplier=({low:.90,medium:1.15,high:1.48})[difficulty]||1.15;
 modal(`<div class="title-screen"><div class="title-kicker">TINGKATAN 1 • STRATEGI TEKA-TEKI AKSI</div><div class="title-emblem">⚔</div><h2>PRIME SIEGE</h2><div class="title-subtitle">PERTAHANAN FAKTOR</div><p class="title-tagline">PERTAHANKAN MERIAM. KUASAI FAKTOR. TUMBANGKAN RAKSASA.</p><label class="title-label" for="playerNameInput">NAMA PEMAIN</label><input id="playerNameInput" maxlength="18" value="${escapeHTML(savedName)}" placeholder="Masukkan nama pemain"><label class="title-label" for="difficultySelect">PILIH TAHAP KESUKARAN</label><select id="difficultySelect"><option value="low" ${savedDifficulty==="low"?"selected":""}>RENDAH — Raksasa bergerak pantas</option><option value="medium" ${savedDifficulty==="medium"?"selected":""}>SEDERHANA — Raksasa bergerak sangat pantas</option><option value="high" ${savedDifficulty==="high"?"selected":""}>TINGGI — Raksasa bergerak amat pantas</option></select><div class="difficulty-hints"><span>🟢 RENDAH</span><span>🟡 SEDERHANA</span><span>🔴 TINGGI</span></div><button class="play-again title-start" onclick="beginMission()">▶ MULA MISI</button><div class="title-buttons"><button class="secondary-action" onclick="showHowTo()">📘 CARA BERMAIN</button><button class="secondary-action" onclick="showLeaderboard()">🏆 CARTA KEDUDUKAN</button></div><div class="title-record"><b>PENJAGA TERBAIK</b>${leaderboardMarkup(3)}</div></div>`);
}
function beginMission(){
 saveSettingsFromTitle();score=0;base=100;level=1;combo=0;gameEnded=false;scoreSavedForRun=false;alive=true;
 closeModal();start();if(musicOn)startMusic();
}
showTitleScreen();
