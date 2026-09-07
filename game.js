// game.js - Tippy Drop! v0.1 prototype
// Requires Matter.js included in index.html

(() => {
  // ---- Setup ----
  const { Engine, World, Bodies, Body, Composite, Events, Runner } = Matter;
  const canvas = document.getElementById('gameCanvas');
  const scoreVal = document.getElementById('scoreVal');
  const bestVal = document.getElementById('bestVal');
  const bestSmallVal = document.getElementById('bestSmallVal');
  const tippyFill = document.getElementById('tippyFill');
  const tippyLabel = document.getElementById('tippyLabel');
  const comboEl = document.getElementById('combo');
  const comboMult = document.getElementById('comboMult');
  const eventWarning = document.getElementById('eventWarning');
  const eventText = document.getElementById('eventText');
  const startScreen = document.getElementById('startScreen');
  const playBtn = document.getElementById('playBtn');
  const tutorial = document.getElementById('tutorial');
  const gotIt = document.getElementById('gotIt');
  const soundBtn = document.getElementById('soundBtn');
  const musicBtn = document.getElementById('musicBtn');
  const gameOver = document.getElementById('gameOver');
  const finalScore = document.getElementById('finalScore');
  const finalBest = document.getElementById('finalBest');
  const playAgain = document.getElementById('playAgain');
  const shareScoreBtn = document.getElementById('shareScore');
  const credit = document.getElementById('credit');

  // canvas sizing (portrait first)
  function resizeCanvas() {
    const maxW = Math.min(window.innerWidth - 24, 480);
    const h = Math.min(window.innerHeight - 140, 760);
    canvas.width = Math.round(maxW * devicePixelRatio);
    canvas.height = Math.round(h * devicePixelRatio);
    canvas.style.width = `${maxW}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }

  // drawing context
  const ctx = canvas.getContext('2d');

  // game state
  let engine = Engine.create();
  engine.timing.timeScale = 1;
  let world = engine.world;
  world.gravity.y = 1;
  const runner = Runner.create();
  let platform, leftWall, rightWall;
  const playArea = { x:0, y:0, w:0, h:0 };

  let currentObj = null;
  let isHolding = false;
  let pointerX = 0;
  let score = 0;
  let best = +(localStorage.getItem('tippy_best') || 0);
  let combo = 0;
  let comboTimer = 0;
  let spawnCount = 0;
  let paused = true;
  let firstPlay = !(localStorage.getItem('tippy_played'));
  let disableSound = false;
  let disableMusic = false;
  let eventTimer = 0;
  let nextEventAt = 8; // score threshold when events may begin
  let activeEvent = null;
  let eventCooldown = 0;

  bestVal.textContent = best;
  bestSmallVal.textContent = best;

  // object definitions (at least 25)
  const objectDefs = [
    // early / easy
    {name:'cardboard', type:'rect', w:70,h:60,density:0.002,friction:0.6,restitution:0.1,color:'#f4a261'},
    {name:'ball', type:'circle', r:26,density:0.001,friction:0.05,restitution:0.8,color:'#ffd166'},
    {name:'book', type:'rect', w:62,h:18,density:0.002,friction:0.5,restitution:0.05,color:'#90be6d'},
    {name:'pizza', type:'circle', r:28,density:0.0015,friction:0.4,restitution:0.2,color:'#ffb703'},
    {name:'teddy', type:'rect', w:44,h:54,density:0.0028,friction:0.6,restitution:0.15,color:'#f4a261'},
    {name:'plant', type:'rect', w:36,h:54,density:0.003,friction:0.7,restitution:0.05,color:'#66c2a5'},
    {name:'chair', type:'rect', w:72,h:72,density:0.004,friction:0.7,restitution:0.05,color:'#6a4c93'},
    {name:'tv', type:'rect', w:68,h:46,density:0.0035,friction:0.6,restitution:0.02,color:'#2a9d8f'},
    // mid-game
    {name:'microwave', type:'rect', w:72,h:44,density:0.005,friction:0.6,restitution:0.03,color:'#f07a7a'},
    {name:'toilet', type:'rect', w:60,h:64,density:0.008,friction:0.7,restitution:0.01,color:'#e9c46a'},
    {name:'bathtub', type:'rect', w:120,h:36,density:0.009,friction:0.65,restitution:0.02,color:'#a8dadc'},
    {name:'fridge', type:'rect', w:56,h:120,density:0.01,friction:0.7,restitution:0.02,color:'#8ecae6'},
    {name:'cart', type:'rect', w:96,h:52,density:0.007,friction:0.5,restitution:0.04,color:'#ff6b6b'},
    {name:'motorcycle', type:'compound', parts:[{type:'rect',w:90,h:30},{type:'circle',r:18,ox:-30,oy:16},{type:'circle',r:18,ox:30,oy:16}],density:0.007,friction:0.55,restitution:0.05,color:'#f72585'},
    // late / ridiculous
    {name:'cow', type:'compound', parts:[{type:'rect',w:120,h:64},{type:'rect',w:48,h:28,ox:36,oy:-12}],density:0.015,friction:0.7,restitution:0.01,color:'#fff5b1'},
    {name:'car', type:'compound', parts:[{type:'rect',w:140,h:48},{type:'circle',r:18,ox:-46,oy:20},{type:'circle',r:18,ox:46,oy:20}],density:0.02,friction:0.7,restitution:0.02,color:'#7f7fd5'},
    {name:'burger', type:'rect', w:110,h:70,density:0.006,friction:0.5,restitution:0.15,color:'#ffb703'},
    {name:'dino', type:'rect', w:140,h:80,density:0.02,friction:0.75,restitution:0.02,color:'#90be6d'},
    {name:'ufo', type:'rect', w:120,h:38,density:0.012,friction:0.4,restitution:0.35,color:'#bde0fe'},
    {name:'rocket', type:'rect', w:48,h:120,density:0.02,friction:0.4,restitution:0.05,color:'#ff6b6b'},
    {name:'duck', type:'rect', w:110,h:78,density:0.008,friction:0.5,restitution:0.25,color:'#ffd166'},
    // extra to reach 25+
    {name:'lamp', type:'rect', w:34,h:80,density:0.003,friction:0.6,restitution:0.04,color:'#ffd6a5'},
    {name:'crate', type:'rect', w:78,h:78,density:0.004,friction:0.7,restitution:0.02,color:'#d4a373'},
    {name:'vase', type:'circle', r:26,density:0.004,friction:0.6,restitution:0.1,color:'#e9c46a'}
  ];

  // helper: create body from def with optional scale
  function makeBody(def, x, y, scale=1) {
    if (def.type === 'rect') {
      const w = def.w * scale, h = def.h * scale;
      return Bodies.rectangle(x,y,w,h,{
        density:def.density,
        friction:def.friction,
        restitution:def.restitution,
        render:{fillStyle:def.color},
        label:def.name
      });
    } else if (def.type === 'circle') {
      const r = def.r * scale;
      return Bodies.circle(x,y,r,{
        density:def.density,
        friction:def.friction,
        restitution:def.restitution,
        render:{fillStyle:def.color},
        label:def.name
      });
    } else if (def.type === 'compound') {
      const parts = [];
      def.parts.forEach(p => {
        if (p.type === 'rect') {
          parts.push(Bodies.rectangle(x + (p.ox||0)*scale, y + (p.oy||0)*scale, p.w*scale, p.h*scale, {render:{fillStyle:def.color}}));
        } else if (p.type === 'circle') {
          parts.push(Bodies.circle(x + (p.ox||0)*scale, y + (p.oy||0)*scale, p.r*scale, {render:{fillStyle:def.color}}));
        }
      });
      const compound = Body.create({parts, density:def.density, friction:def.friction, restitution:def.restitution, label:def.name});
      return compound;
    }
    return Bodies.rectangle(x,y,40,40);
  }

  // build world bounds / platform
  function setupScene() {
    World.clear(world, false);
    Engine.clear(engine);
    world.gravity.y = 1;

    const cw = canvas.width / devicePixelRatio;
    const ch = canvas.height / devicePixelRatio;
    playArea.x = cw/2;
    playArea.y = ch*0.75;
    playArea.w = Math.min(360, cw - 40);
    playArea.h = 14;

    // platform is static rectangle
    platform = Bodies.rectangle(playArea.x, playArea.y, playArea.w, playArea.h, {isStatic:true,render:{fillStyle:'#2a9d8f'}});
    leftWall = Bodies.rectangle(-40, ch/2, 80, ch*2, {isStatic:true});
    rightWall = Bodies.rectangle(cw+40, ch/2, 80, ch*2, {isStatic:true});
    const floor = Bodies.rectangle(cw/2, ch + 200, cw*2, 400, {isStatic:true});

    World.add(world, [platform, leftWall, rightWall, floor]);

    // reset state
    currentObj = null;
    isHolding = false;
    score = 0;
    spawnCount = 0;
    combo = 0;
    comboTimer = 0;
    eventTimer = 0;
    eventCooldown = 0;
    activeEvent = null;
    paused = true;
    updateScoreUI();
  }

  // rendering loop - custom minimal renderer (canvas)
  function render() {
    const cw = canvas.width / devicePixelRatio;
    const ch = canvas.height / devicePixelRatio;
    // background
    ctx.clearRect(0,0,cw,ch);

    // subtle sky gradient
    const g = ctx.createLinearGradient(0,0,0,ch);
    g.addColorStop(0,'rgba(255,255,255,0.02)');
    g.addColorStop(1,'rgba(0,0,0,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,cw,ch);

    // platform shadow
    ctx.save();
    ctx.translate(platform.position.x, platform.position.y);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(-playArea.w/2, 8, playArea.w, 8);
    ctx.restore();

    // draw bodies
    const bodies = Composite.allBodies(world);
    bodies.forEach(b => {
      if (b === platform || b === leftWall || b === rightWall) return;
      drawBody(b);
    });

    // platform
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    roundedRect(ctx, playArea.x - playArea.w/2, playArea.y - playArea.h/2, playArea.w, playArea.h, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function roundedRect(ctx,x,y,w,h,r){
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawBody(body) {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = (body.render && body.render.fillStyle) || '#999';
    // draw based on parts
    if (body.circleRadius) {
      ctx.beginPath();
      ctx.arc(0,0,body.circleRadius,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.ellipse(0, body.circleRadius*0.4, body.circleRadius*0.6, body.circleRadius*0.25, 0,0,Math.PI*2);
      ctx.fill();
    } else {
      // bbox
      const w = body.bounds.max.x - body.bounds.min.x;
      const h = body.bounds.max.y - body.bounds.min.y;
      ctx.beginPath();
      roundedRect(ctx, -w/2, -h/2, w, h, Math.min(12, Math.min(w,h)/5));
      ctx.fill();
      // slight inner shading
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- Game mechanics ----

  // spawn next object
  function spawnNext(oversize=false, double=false, nearby=false) {
    if (currentObj) return;
    spawnCount++;
    const cw = canvas.width / devicePixelRatio;
    const def = objectDefs[Math.floor(Math.random()*objectDefs.length)];
    // sometimes bias towards harder objects as spawnCount increases
    const spawnScale = oversize ? 1.6 : 1;
    const x = Math.max(40, Math.min(cw - 40, playArea.x + (Math.random()-0.5) * (playArea.w - 40)));
    const y = Math.max(40, playArea.y - 260);
    const body = makeBody(def, x, y, spawnScale);
    // random orientation
    Body.setAngle(body, (Math.random()-0.5)*0.2);
    // temporary hold so player can position
    body.isStatic = true;
    currentObj = body;
    World.add(world, body);

    if (double) {
      // spawn second object nearby
      const body2 = makeBody(objectDefs[Math.floor(Math.random()*objectDefs.length)], x + (nearby? 40: 120), y - 10, spawnScale*0.9);
      body2.isStatic = true;
      World.add(world, body2);
      // mark it as sibling so scoring handles it
      currentObj.pair = body2;
      body2.pair = currentObj;
    }
  }

  // release current object
  function releaseCurrent() {
    if (!currentObj) return;
    currentObj.isStatic = false;
    // small kick depending on last pointer velocity
    currentObj = null;
    isHolding = false;
  }

  // update tippy meter
  function updateTippyMeter() {
    // instability measure (0..1)
    const bodies = Composite.allBodies(world).filter(b => !b.isStatic && b.label !== 'ground');
    let inst = 0;
    let maxHeight = 0;
    bodies.forEach(b => {
      const ang = Math.abs(b.angle) / Math.PI; // 0..1
      const av = Math.min(1, Math.abs(b.angularVelocity));
      const lv = Math.min(1, Math.sqrt(b.velocity.x*b.velocity.x + b.velocity.y*b.velocity.y)/8);
      inst += ang*0.7 + av*0.2 + lv*0.4;
      maxHeight = Math.max(maxHeight, Math.max(0, platform.position.y - b.position.y));
    });
    if (bodies.length) inst = inst / bodies.length;
    // height factor
    const hFactor = Math.min(1, maxHeight / 160);
    let scoreFactor = Math.min(1, score / 30);
    let total = Math.min(1, inst*0.9 + hFactor*0.8 + scoreFactor*0.3);
    // map to label
    let label = 'STEADY';
    if (total > 0.75) label = 'PANIC';
    else if (total > 0.5) label = 'TIPPY';
    else if (total > 0.25) label = 'WOBBLY';
    tippyFill.style.width = `${Math.round(total*100)}%`;
    tippyLabel.textContent = label;
    // subtle UI reaction: tint
    if (label === 'PANIC') tippyFill.style.background = 'linear-gradient(90deg,#ff6b6b,#ffb703)';
    else if (label === 'TIPPY') tippyFill.style.background = 'linear-gradient(90deg,#ffd166,#ff6b6b)';
    else tippyFill.style.background = 'linear-gradient(90deg,#80ff72,#ffd166)';

    return total;
  }

  // scoring: detect stable objects that were just dropped
  function checkForScoring() {
    // look for bodies that are resting (speed small) and have not been scored yet
    const bodies = Composite.allBodies(world).filter(b => b && !b.isStatic && !b.scored);
    bodies.forEach(b => {
      const speed = Math.sqrt(b.velocity.x*b.velocity.x + b.velocity.y*b.velocity.y);
      const ang = Math.abs(b.angularVelocity);
      // if near platform level and slow for a bit, award
      if (b.position.y < platform.position.y - 4 && speed < 0.2 && ang < 0.03) {
        // check that body is within platform horizontal bounds
        if (b.position.x > platform.position.x - playArea.w/2 - 10 && b.position.x < platform.position.x + playArea.w/2 + 10) {
          b.scored = true;
          // scoring
          let bonus = 0;
          const centerOffset = Math.abs(b.position.x - platform.position.x);
          if (centerOffset < 10) { combo++; bonus += Math.floor(combo/2); showCombo('PERFECT', combo); }
          else if (centerOffset < 30) { combo++; showCombo('NICE!', combo); }
          else { combo = 0; hideComboSoon(); }
          let gain = 1 + bonus;
          // small random extra for surviving an event
          if (activeEvent && activeEvent.name === 'LOW_GRAVITY') gain += 1;
          score += gain;
          spawnNext(); // spawn next automatically
          updateScoreUI();
          // set played flag
          localStorage.setItem('tippy_played','1');
        }
      }
    });
  }

  function showCombo(text, mult) {
    comboEl.classList.remove('hidden');
    comboEl.innerText = `${text} `;
    comboMult.textContent = `x${Math.min(3, Math.max(1, mult))}`;
    window.clearTimeout(comboEl._hideTO);
    comboEl._hideTO = setTimeout(()=> comboEl.classList.add('hidden'), 1400);
  }
  function hideComboSoon() {
    window.clearTimeout(comboEl._hideTO);
    comboEl._hideTO = setTimeout(()=> comboEl.classList.add('hidden'), 600);
  }

  function updateScoreUI() {
    scoreVal.textContent = score;
    best = Math.max(best, score);
    bestVal.textContent = best;
    bestSmallVal.textContent = best;
  }

  // game over detection: any body falls below play area beyond threshold or platform tipped seriously
  function checkForGameOver() {
    const cw = canvas.width / devicePixelRatio, ch = canvas.height / devicePixelRatio;
    const bodies = Composite.allBodies(world).filter(b => !b.isStatic);
    for (let b of bodies) {
      if (b.position.y > ch + 80) {
        // consider fallen -> game over
        triggerGameOver();
        break;
      }
      // if platform object pushes outside horizontally far enough
      if (Math.abs(b.position.x - platform.position.x) > cw + 80) {
        triggerGameOver();
        break;
      }
    }
    // extra: if platform itself is heavily tilted/shifted (shouldn't happen with static), ignore
  }

  // Game Over
  function triggerGameOver() {
    paused = true;
    // freeze world briefly and show collapse effects
    Engine.update(engine, 16); // finalize step
    // store best
    localStorage.setItem('tippy_best', Math.max(best, score));
    finalScore.textContent = score;
    finalBest.textContent = Math.max(best, score);
    gameOver.classList.remove('hidden');
    playAgain.focus();
    // small collapse shake
    screenShake(12, 600);
    // TODO: particles (omitted for brevity)
  }

  // Event system (panic events)
  const EVENTS = {
    EARTHQUAKE: {name:'EARTHQUAKE', fn:earthquake, warn:'EARTHQUAKE!'},
    WIND: {name:'WIND', fn:windBlast, warn:'WIND BLAST!'},
    LOW_GRAVITY: {name:'LOW_GRAVITY', fn:lowGravity, warn:'LOW GRAVITY!'},
    GIANT_DROP: {name:'GIANT_DROP', fn:giantDrop, warn:'GIANT DROP!'},
    DOUBLE: {name:'DOUBLE', fn:doubleTrouble, warn:'DOUBLE TROUBLE!'},
    TINY: {name:'TINY', fn:tinyPlatform, warn:'TINY PLATFORM!'}
  };

  function maybeTriggerEvent() {
    if (score < 8) return;
    if (eventCooldown > 0) return;
    // event chance grows with score
    const chance = Math.min(0.35, 0.05 + (score-8) * 0.015);
    if (Math.random() < chance) {
      const keys = Object.keys(EVENTS);
      const pick = EVENTS[keys[Math.floor(Math.random()*keys.length)]];
      showEventWarning(pick.warn);
      activeEvent = {name:pick.name};
      // short delay then run
      setTimeout(()=> {
        pick.fn();
        activeEvent = null;
        eventCooldown = 2000 + Math.random()*4000;
      }, 700);
    }
  }

  function showEventWarning(text) {
    eventWarning.classList.remove('hidden');
    eventText.textContent = text;
    setTimeout(()=> eventWarning.classList.add('hidden'), 900);
  }

  function earthquake() {
    // brief shakes applying small impulses repeatedly
    const iterations = 12;
    let count = 0;
    const iv = setInterval(()=>{
      const bodies = Composite.allBodies(world).filter(b=>!b.isStatic);
      bodies.forEach(b => {
        Body.applyForce(b, b.position, {x:(Math.random()-0.5)*0.004, y:(Math.random()-0.5)*0.001});
      });
      screenShake(3, 150);
      count++;
      if (count >= iterations) clearInterval(iv);
    }, 90);
  }

  function windBlast() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const bodies = Composite.allBodies(world).filter(b=>!b.isStatic);
    bodies.forEach(b => Body.applyForce(b, b.position, {x:dir*(0.001 + Math.random()*0.002), y:0}));
    screenShake(4,200);
  }

  function lowGravity() {
    const prev = world.gravity.y;
    world.gravity.y = 0.25;
    setTimeout(()=> world.gravity.y = prev, 2800);
  }

  function giantDrop() {
    spawnNext(true);
  }

  function doubleTrouble() {
    spawnNext(false,true,true);
  }

  function tinyPlatform() {
    // temporarily reduce platform width
    const orig = playArea.w;
    const shrink = Math.max(120, orig*0.45);
    Body.scale(platform, shrink / playArea.w, 1);
    playArea.w = shrink;
    setTimeout(()=> {
      // restore by re-setting a new platform
      setupScene();
      // re-add existing bodies? For simplicity we reset the scene
    }, 3500);
  }

  // visual helpers
  function screenShake(amount=4, duration=300) {
    const start = Date.now();
    const orig = canvas.style.transform || '';
    function step(){
      const t = Date.now()-start;
      if (t > duration) { canvas.style.transform = orig; return; }
      const dx = (Math.random()-0.5) * amount;
      const dy = (Math.random()-0.5) * amount;
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(step);
    }
    step();
  }

  // input (pointer)
  function setupPointer() {
    function getLocal(ev) {
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX || ev.touches && ev.touches[0].clientX) - rect.left;
      return x;
    }
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (paused) return;
      pointerX = getLocal(e);
      if (!currentObj) spawnNext();
      if (currentObj) {
        isHolding = true;
        currentObj.isStatic = true;
        // move to pointer
        currentObj.position.x = pointerX;
        Body.setPosition(currentObj, {x:pointerX, y: currentObj.position.y});
      }
    }, {passive:false});

    canvas.addEventListener('pointermove', (e) => {
      if (!isHolding || !currentObj) return;
      pointerX = getLocal(e);
      Body.setPosition(currentObj, {x: pointerX, y: currentObj.position.y});
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!isHolding) return;
      releaseCurrent();
    });

    // also support touchstart fallback
    canvas.addEventListener('touchstart', (e)=> e.preventDefault(), {passive:false});
  }

  // sound: tiny beeps using WebAudio
  const audioCtx = (window.AudioContext || window.webkitAudioContext) && new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq=440, time=0.06, type='sine', vol=0.06) {
    if (!audioCtx || disableSound) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
    setTimeout(()=> o.stop(), time*1000 + 50);
  }

  // share
  function shareScore() {
    const text = `I stacked ${score} objects in Tippy Drop! Can you beat me?`;
    if (navigator.share) {
      navigator.share({title:'Tippy Drop!', text});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(()=> alert('Score copied to clipboard!'));
    } else {
      alert(text);
    }
  }

  // main loop tick
  function tick() {
    if (!paused) {
      Runner.tick(runner, engine, 1000/60);
      // update physics separately if timeScale changed
      render();
      // update tippy meter
      const inst = updateTippyMeter();
      // maybe trigger events
      if (eventCooldown <= 0) maybeTriggerEvent();
      // degrade cooldown
      if (eventCooldown > 0) eventCooldown -= 16;
      // scoring
      checkForScoring();
      // game over check
      checkForGameOver();
    } else {
      render();
    }
    requestAnimationFrame(tick);
  }

  // UI wiring
  playBtn.addEventListener('click', ()=>{
    startScreen.classList.add('hidden');
    paused = false;
    setupScene();
    spawnNext();
    if (firstPlay) {
      tutorial.classList.remove('hidden');
    }
  });

  gotIt.addEventListener('click', ()=>{
    tutorial.classList.add('hidden');
    firstPlay = false;
  });

  playAgain.addEventListener('click', ()=>{
    gameOver.classList.add('hidden');
    setupScene();
    paused = false;
    spawnNext();
  });

  shareScoreBtn.addEventListener('click', shareScore);

  soundBtn.addEventListener('click', ()=>{
    disableSound = !disableSound;
    soundBtn.textContent = disableSound ? '🔈' : '🔊';
  });

  musicBtn.addEventListener('click', ()=>{
    disableMusic = !disableMusic;
    musicBtn.textContent = disableMusic ? '🔇' : '🎵';
    if (!disableMusic && audioCtx) {
      // Tiny looping ambience: low oscillator at low volume
      if (!audioCtx._bg) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 110;
        g.gain.value = 0.01;
        o.connect(g); g.connect(audioCtx.destination);
        o.start();
        audioCtx._bg = {o,g};
      } else {
        audioCtx._bg.g.gain.value = disableMusic ? 0 : 0.01;
      }
    }
  });

  // share from start screen (no-op)
  shareScoreBtn.disabled = false;

  // initialize
  setupScene();
  setupPointer();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // minimal auto-update runner
  requestAnimationFrame(tick);

  // expose some debug
  window.tippy = {engine, world, spawnNext};

  // small sound on start
  soundBtn.textContent = '🔊';
})();
