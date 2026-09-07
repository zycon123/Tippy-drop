// game.js - Tippy Drop! v0.1 prototype (polish pass)
// Improvements: pointer smoothing, impact particles, collision SFX, tinyPlatform restoration
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

  // drawing context
  const ctx = canvas.getContext('2d');

  // canvas sizing (portrait first)
  function resizeCanvas() {
    const maxW = Math.min(window.innerWidth - 24, 480);
    const h = Math.min(window.innerHeight - 140, 760);
    canvas.width = Math.round(maxW * devicePixelRatio || 1);
    canvas.height = Math.round(h * devicePixelRatio || 1);
    canvas.style.width = `${maxW}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(devicePixelRatio || 1,0,0,devicePixelRatio || 1,0,0);
  }

  // game state
  let engine = Engine.create();
  engine.timing.timeScale = 1;
  let world = engine.world;
  world.gravity.y = 1;
  const runner = Runner.create();
  let platform, leftWall, rightWall;
  const playArea = { x:0, y:0, w:0, h:0 };
  let origPlatformWidth = 0;

  let currentObj = null;
  let isHolding = false;
  let pointerX = 0;
  let score = 0;
  let best = +(localStorage.getItem('tippy_best') || 0);
  let combo = 0;
  let spawnCount = 0;
  let paused = true;
  let firstPlay = !(localStorage.getItem('tippy_played'));
  let disableSound = false;
  let disableMusic = false;
  let eventCooldown = 0;

  let particles = [];

  bestVal.textContent = best;
  bestSmallVal.textContent = best;

  // object definitions (25+)
  const objectDefs = [
    {name:'cardboard', type:'rect', w:70,h:60,density:0.002,friction:0.6,restitution:0.1,color:'#f4a261'},
    {name:'ball', type:'circle', r:26,density:0.001,friction:0.05,restitution:0.8,color:'#ffd166'},
    {name:'book', type:'rect', w:62,h:18,density:0.002,friction:0.5,restitution:0.05,color:'#90be6d'},
    {name:'pizza', type:'circle', r:28,density:0.0015,friction:0.4,restitution:0.2,color:'#ffb703'},
    {name:'teddy', type:'rect', w:44,h:54,density:0.0028,friction:0.6,restitution:0.15,color:'#f4a261'},
    {name:'plant', type:'rect', w:36,h:54,density:0.003,friction:0.7,restitution:0.05,color:'#66c2a5'},
    {name:'chair', type:'rect', w:72,h:72,density:0.004,friction:0.7,restitution:0.05,color:'#6a4c93'},
    {name:'tv', type:'rect', w:68,h:46,density:0.0035,friction:0.6,restitution:0.02,color:'#2a9d8f'},
    {name:'microwave', type:'rect', w:72,h:44,density:0.005,friction:0.6,restitution:0.03,color:'#f07a7a'},
    {name:'toilet', type:'rect', w:60,h:64,density:0.008,friction:0.7,restitution:0.01,color:'#e9c46a'},
    {name:'bathtub', type:'rect', w:120,h:36,density:0.009,friction:0.65,restitution:0.02,color:'#a8dadc'},
    {name:'fridge', type:'rect', w:56,h:120,density:0.01,friction:0.7,restitution:0.02,color:'#8ecae6'},
    {name:'cart', type:'rect', w:96,h:52,density:0.007,friction:0.5,restitution:0.04,color:'#ff6b6b'},
    {name:'motorcycle', type:'compound', parts:[{type:'rect',w:90,h:30},{type:'circle',r:18,ox:-30,oy:16},{type:'circle',r:18,ox:30,oy:16}],density:0.007,friction:0.55,restitution:0.05,color:'#f72585'},
    {name:'cow', type:'compound', parts:[{type:'rect',w:120,h:64},{type:'rect',w:48,h:28,ox:36,oy:-12}],density:0.015,friction:0.7,restitution:0.01,color:'#fff5b1'},
    {name:'car', type:'compound', parts:[{type:'rect',w:140,h:48},{type:'circle',r:18,ox:-46,oy:20},{type:'circle',r:18,ox:46,oy:20}],density:0.02,friction:0.7,restitution:0.02,color:'#7f7fd5'},
    {name:'burger', type:'rect', w:110,h:70,density:0.006,friction:0.5,restitution:0.15,color:'#ffb703'},
    {name:'dino', type:'rect', w:140,h:80,density:0.02,friction:0.75,restitution:0.02,color:'#90be6d'},
    {name:'ufo', type:'rect', w:120,h:38,density:0.012,friction:0.4,restitution:0.35,color:'#bde0fe'},
    {name:'rocket', type:'rect', w:48,h:120,density:0.02,friction:0.4,restitution:0.05,color:'#ff6b6b'},
    {name:'duck', type:'rect', w:110,h:78,density:0.008,friction:0.5,restitution:0.25,color:'#ffd166'},
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

    const cw = canvas.width / (devicePixelRatio || 1);
    const ch = canvas.height / (devicePixelRatio || 1);
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

    // store original platform width so tinyPlatform can restore smoothly
    origPlatformWidth = playArea.w;

    // reset state
    currentObj = null;
    isHolding = false;
    score = 0;
    spawnCount = 0;
    combo = 0;
    eventCooldown = 0;
    paused = true;
    updateScoreUI();
  }

  // rendering loop - custom minimal renderer (canvas)
  function render() {
    const cw = canvas.width / (devicePixelRatio || 1);
    const ch = canvas.height / (devicePixelRatio || 1);
    // background
    ctx.clearRect(0,0,cw,ch);

    // subtle sky gradient
    const g = ctx.createLinearGradient(0,0,0,ch);
    g.addColorStop(0,'rgba(255,255,255,0.02)');
    g.addColorStop(1,'rgba(0,0,0,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,cw,ch);

    // platform shadow
    if (platform) {
      ctx.save();
      ctx.translate(platform.position.x, platform.position.y);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(-playArea.w/2, 8, playArea.w, 8);
      ctx.restore();
    }

    // draw bodies
    const bodies = Composite.allBodies(world);
    bodies.forEach(b => {
      if (!b || b === platform || b === leftWall || b === rightWall) return;
      drawBody(b);
    });

    // draw particles
    drawParticles();

    // platform
    if (platform) {
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
  }

  function roundedRect(ctx,x,y,w,h,r){
    ctx.beginPath();
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
      const w = Math.max(6, body.bounds.max.x - body.bounds.min.x);
      const h = Math.max(6, body.bounds.max.y - body.bounds.min.y);
      ctx.beginPath();
      roundedRect(ctx, -w/2, -h/2, w, h, Math.min(12, Math.min(w,h)/5));
      ctx.fill();
      // slight inner shading
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fill();
    }
    ctx.restore();
  }

  // particle system (very small, CPU-friendly)
  function spawnParticles(x,y,color,count=8) {
    for (let i=0;i<count;i++) {
      particles.push({
        x, y,
        vx: (Math.random()-0.5)*3,
        vy: (Math.random()-1.8)*3,
        life: 400 + Math.random()*300,
        age: 0,
        color
      });
    }
  }
  function drawParticles() {
    const now = Date.now();
    for (let i=particles.length-1;i>=0;i--) {
      const p = particles[i];
      p.age += 16;
      p.vy += 0.06; // gravity
      p.x += p.vx;
      p.y += p.vy;
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = hexToRgba(p.color || '#fff', alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, 3*alpha), 0, Math.PI*2);
      ctx.fill();
      if (p.age > p.life) particles.splice(i,1);
    }
  }
  function hexToRgba(hex, a){
    try {
      const c = hex.replace('#','');
      const r = parseInt(c.substring(0,2),16);
      const g = parseInt(c.substring(2,4),16);
      const b = parseInt(c.substring(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    } catch(e){ return `rgba(255,255,255,${a})`; }
  }

  // ---- Game mechanics ----

  // spawn next object
  function spawnNext(oversize=false, double=false, nearby=false) {
    if (currentObj) return;
    spawnCount++;
    const cw = canvas.width / (devicePixelRatio || 1);
    const def = objectDefs[Math.floor(Math.random()*objectDefs.length)];
    const spawnScale = oversize ? 1.6 : 1;
    const x = Math.max(40, Math.min(cw - 40, playArea.x + (Math.random()-0.5) * (playArea.w - 40)));
    const y = Math.max(40, playArea.y - 260);
    const body = makeBody(def, x, y, spawnScale);
    Body.setAngle(body, (Math.random()-0.5)*0.2);
    body.isStatic = true; // hold in place until released
    currentObj = body;
    World.add(world, body);

    if (double) {
      const body2 = makeBody(objectDefs[Math.floor(Math.random()*objectDefs.length)], x + (nearby? 40: 120), y - 10, spawnScale*0.9);
      body2.isStatic = true;
      World.add(world, body2);
      currentObj.pair = body2;
      body2.pair = currentObj;
    }
  }

  // release current object
  function releaseCurrent() {
    if (!currentObj) return;
    currentObj.isStatic = false;
    // small sound
    playTone(220, 0.06, 'sine', 0.04);
    currentObj = null;
    isHolding = false;
  }

  // update tippy meter
  function updateTippyMeter() {
    const bodies = Composite.allBodies(world).filter(b => !b.isStatic && b.label !== 'ground');
    let inst = 0;
    let maxHeight = 0;
    bodies.forEach(b => {
      const ang = Math.abs(b.angle) / Math.PI;
      const av = Math.min(1, Math.abs(b.angularVelocity));
      const lv = Math.min(1, Math.sqrt(b.velocity.x*b.velocity.x + b.velocity.y*b.velocity.y)/8);
      inst += ang*0.7 + av*0.2 + lv*0.4;
      maxHeight = Math.max(maxHeight, Math.max(0, platform.position.y - b.position.y));
    });
    if (bodies.length) inst = inst / bodies.length;
    const hFactor = Math.min(1, maxHeight / 160);
    let scoreFactor = Math.min(1, score / 30);
    let total = Math.min(1, inst*0.9 + hFactor*0.8 + scoreFactor*0.3);
    let label = 'STEADY';
    if (total > 0.75) label = 'PANIC';
    else if (total > 0.5) label = 'TIPPY';
    else if (total > 0.25) label = 'WOBBLY';
    tippyFill.style.width = `${Math.round(total*100)}%`;
    tippyLabel.textContent = label;
    if (label === 'PANIC') tippyFill.style.background = 'linear-gradient(90deg,#ff6b6b,#ffb703)';
    else if (label === 'TIPPY') tippyFill.style.background = 'linear-gradient(90deg,#ffd166,#ff6b6b)';
    else tippyFill.style.background = 'linear-gradient(90deg,#80ff72,#ffd166)';
    return total;
  }

  // scoring: detect stable objects that were just dropped
  function checkForScoring() {
    const bodies = Composite.allBodies(world).filter(b => b && !b.isStatic && !b.scored);
    bodies.forEach(b => {
      const speed = Math.sqrt(b.velocity.x*b.velocity.x + b.velocity.y*b.velocity.y);
      const ang = Math.abs(b.angularVelocity);
      if (b.position.y < platform.position.y - 4 && speed < 0.2 && ang < 0.03) {
        if (b.position.x > platform.position.x - playArea.w/2 - 10 && b.position.x < platform.position.x + playArea.w/2 + 10) {
          b.scored = true;
          let bonus = 0;
          const centerOffset = Math.abs(b.position.x - platform.position.x);
          if (centerOffset < 10) { combo++; bonus += Math.floor(combo/2); showCombo('PERFECT', combo); playTone(880,0.09,'triangle',0.06); }
          else if (centerOffset < 30) { combo++; showCombo('NICE!', combo); playTone(660,0.07,'sine',0.05); }
          else { combo = 0; hideComboSoon(); }
          let gain = 1 + bonus;
          score += gain;
          spawnNext();
          updateScoreUI();
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

  // game over detection
  function checkForGameOver() {
    const cw = canvas.width / (devicePixelRatio || 1), ch = canvas.height / (devicePixelRatio || 1);
    const bodies = Composite.allBodies(world).filter(b => !b.isStatic);
    for (let b of bodies) {
      if (b.position.y > ch + 80) { triggerGameOver(); break; }
      if (Math.abs(b.position.x - platform.position.x) > cw + 80) { triggerGameOver(); break; }
    }
  }

  function triggerGameOver() {
    paused = true;
    Engine.update(engine, 16);
    localStorage.setItem('tippy_best', Math.max(best, score));
    finalScore.textContent = score;
    finalBest.textContent = Math.max(best, score);
    gameOver.classList.remove('hidden');
    playAgain.focus();
    screenShake(12, 600);
    spawnParticles(canvas.width/(devicePixelRatio||1)/2, canvas.height/(devicePixelRatio||1)/2, '#ff6b6b', 30);
    playTone(120,0.6,'sine',0.06);
  }

  // Event system
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
    const chance = Math.min(0.35, 0.05 + (score-8) * 0.015);
    if (Math.random() < chance) {
      const keys = Object.keys(EVENTS);
      const pick = EVENTS[keys[Math.floor(Math.random()*keys.length)]];
      showEventWarning(pick.warn);
      setTimeout(()=> { pick.fn(); eventCooldown = 2000 + Math.random()*4000; }, 700);
    }
  }

  function showEventWarning(text) {
    eventWarning.classList.remove('hidden');
    eventText.textContent = text;
    setTimeout(()=> eventWarning.classList.add('hidden'), 900);
    playTone(520,0.12,'sawtooth',0.06);
  }

  function earthquake() {
    const iterations = 10;
    let count = 0;
    const iv = setInterval(()=>{
      const bodies = Composite.allBodies(world).filter(b=>!b.isStatic);
      bodies.forEach(b => Body.applyForce(b, b.position, {x:(Math.random()-0.5)*0.004, y:(Math.random()-0.5)*0.001}));
      screenShake(3, 130);
      count++; if (count>=iterations) clearInterval(iv);
    }, 90);
  }
  function windBlast() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const bodies = Composite.allBodies(world).filter(b=>!b.isStatic);
    bodies.forEach(b => Body.applyForce(b, b.position, {x:dir*(0.001 + Math.random()*0.002), y:0}));
    screenShake(4,200);
  }
  function lowGravity() { const prev = world.gravity.y; world.gravity.y = 0.28; setTimeout(()=> world.gravity.y = prev, 2800); }
  function giantDrop() { spawnNext(true); }
  function doubleTrouble() { spawnNext(false,true,true); }
  function tinyPlatform() {
    const orig = origPlatformWidth || playArea.w;
    const shrink = Math.max(120, orig*0.45);
    const factor = shrink / playArea.w;
    Body.scale(platform, factor, 1);
    playArea.w = shrink;
    // restore smoothly after time
    setTimeout(()=>{
      const restoreFactor = orig / playArea.w;
      Body.scale(platform, restoreFactor, 1);
      playArea.w = orig;
    }, 3500);
  }

  // visual helpers
  function screenShake(amount=4, duration=300) {
    const start = Date.now();
    const orig = canvas.style.transform || '';
    function step(){ const t = Date.now()-start; if (t>duration){ canvas.style.transform = orig; return; } const dx=(Math.random()-0.5)*amount; const dy=(Math.random()-0.5)*amount; canvas.style.transform=`translate(${dx}px, ${dy}px)`; requestAnimationFrame(step); }
    step();
  }

  // input (pointer) with smoothing
  function setupPointer() {
    function getLocal(ev) { const rect = canvas.getBoundingClientRect(); const cx = (ev.clientX !== undefined) ? ev.clientX : (ev.touches && ev.touches[0] && ev.touches[0].clientX); return cx - rect.left; }
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); if (paused) return; pointerX = getLocal(e); if (!currentObj) spawnNext(); if (currentObj) { isHolding = true; currentObj.isStatic = true; Body.setPosition(currentObj, {x:pointerX, y: currentObj.position.y}); } }, {passive:false});
    canvas.addEventListener('pointermove', (e) => { if (!isHolding || !currentObj) return; pointerX = getLocal(e); }, {passive:true});
    canvas.addEventListener('pointerup', (e) => { if (!isHolding) return; releaseCurrent(); }, {passive:false});
    canvas.addEventListener('touchstart', (e)=> e.preventDefault(), {passive:false});
  }

  // sound: tiny beeps using WebAudio
  const audioCtx = (window.AudioContext || window.webkitAudioContext) && new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq=440, time=0.06, type='sine', vol=0.06) {
    if (!audioCtx || disableSound) return;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time); setTimeout(()=> o.stop(), time*1000 + 50);
  }

  // collision effects
  Events.on(engine, 'collisionStart', function(e){
    e.pairs.forEach(p => {
      const rel = Math.hypot(p.collision.penetration.x, p.collision.penetration.y);
      const speed = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
      const x = p.collision.supports[0].x; const y = p.collision.supports[0].y;
      spawnParticles(x,y,'#ffffff', Math.min(10, Math.round(speed*6)));
      if (speed > 1) playTone(120 + Math.min(800, speed*120), 0.06, 'sine', Math.min(0.08, 0.02 + speed*0.01));
    });
  });

  // share
  function shareScore() {
    const text = `I stacked ${score} objects in Tippy Drop! Can you beat me?`;
    if (navigator.share) navigator.share({title:'Tippy Drop!', text});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=> alert('Score copied to clipboard!'));
    else alert(text);
  }

  // main loop tick
  function tick() {
    if (!paused) {
      Runner.tick(runner, engine, 1000/60);
      // smoothing: if holding, lerp currentObj towards pointerX
      if (isHolding && currentObj) {
        const curX = currentObj.position.x;
        const nx = curX + (pointerX - curX) * 0.35; // smoothing factor
        Body.setPosition(currentObj, {x: nx, y: currentObj.position.y});
      }
      render();
      updateTippyMeter();
      if (eventCooldown <= 0) maybeTriggerEvent();
      if (eventCooldown > 0) eventCooldown -= 16;
      checkForScoring();
      checkForGameOver();
    } else {
      render();
    }
    requestAnimationFrame(tick);
  }

  // UI wiring
  playBtn.addEventListener('click', ()=>{ startScreen.classList.add('hidden'); paused = false; setupScene(); spawnNext(); if (firstPlay) tutorial.classList.remove('hidden'); });
  gotIt.addEventListener('click', ()=>{ tutorial.classList.add('hidden'); firstPlay = false; });
  playAgain.addEventListener('click', ()=>{ gameOver.classList.add('hidden'); setupScene(); paused = false; spawnNext(); });
  shareScoreBtn.addEventListener('click', shareScore);
  soundBtn.addEventListener('click', ()=>{ disableSound = !disableSound; soundBtn.textContent = disableSound ? '🔈' : '🔊'; });
  musicBtn.addEventListener('click', ()=>{ disableMusic = !disableMusic; musicBtn.textContent = disableMusic ? '🔇' : '🎵'; if (!disableMusic && audioCtx) { if (!audioCtx._bg) { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.frequency.value=110; g.gain.value=0.01; o.connect(g); g.connect(audioCtx.destination); o.start(); audioCtx._bg={o,g}; } else audioCtx._bg.g.gain.value = disableMusic?0:0.01; } });

  // initialize (resize first to get accurate sizes)
  resizeCanvas();
  setupScene();
  setupPointer();
  window.addEventListener('resize', ()=>{ resizeCanvas(); setupScene(); });

  // minimal auto-update runner
  requestAnimationFrame(tick);

  // expose some debug
  window.tippy = {engine, world, spawnNext};

})();
