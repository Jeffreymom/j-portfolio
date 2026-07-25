const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const introOverlay = document.getElementById("introOverlay");
const roundOverlay = document.getElementById("roundOverlay");
const finalOverlay = document.getElementById("finalOverlay");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const retryBtn = document.getElementById("retryBtn");
const resetBtn = document.getElementById("resetBtn");
const soundBtn = document.getElementById("soundBtn");

const roundText = document.getElementById("roundText");
const averageText = document.getElementById("averageText");
const bestText = document.getElementById("bestText");
const roundScore = document.getElementById("roundScore");
const roundComment = document.getElementById("roundComment");
const shapeMetric = document.getElementById("shapeMetric");
const closureMetric = document.getElementById("closureMetric");
const radiusMetric = document.getElementById("radiusMetric");
const finalScore = document.getElementById("finalScore");
const finalGrade = document.getElementById("finalGrade");
const recordText = document.getElementById("recordText");
const scoreList = document.getElementById("scoreList");

const STORAGE_KEY = "perfect_circle_best";
let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
let soundOn = true;
let running = false;
let drawing = false;
let round = 1;
let scores = [];
let points = [];
let center = {x:0,y:0};
let radius = 150;
let startPoint = {x:0,y:0};
let dpr = 1;

function updateBest() {
  bestText.textContent = best ? best.toFixed(1) : "-";
}
updateBest();

function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  setupGuide();
  drawScene();
}

function setupGuide() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  center = { x: w/2, y: h/2 + 10 };
  radius = Math.min(w,h) * 0.27;
  const angle = -Math.PI/4;
  startPoint = {
    x:center.x + Math.cos(angle)*radius,
    y:center.y + Math.sin(angle)*radius
  };
}

function drawScene() {
  const w=canvas.clientWidth, h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#f5f6f8";
  ctx.fillRect(0,0,w,h);

  ctx.beginPath();
  ctx.arc(center.x,center.y,7,0,Math.PI*2);
  ctx.fillStyle="#9ca1aa";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x,center.y);
  ctx.lineTo(startPoint.x,startPoint.y);
  ctx.strokeStyle="#15bf37";
  ctx.lineWidth=8;
  ctx.lineCap="round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(startPoint.x,startPoint.y,13,0,Math.PI*2);
  ctx.fillStyle="rgba(21,191,55,.16)";
  ctx.fill();

  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x,points[0].y);
    for (let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y);
    ctx.strokeStyle="#ff334d";
    ctx.lineWidth=5;
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.stroke();
  }
}

function getPos(e) {
  const r=canvas.getBoundingClientRect();
  return {x:e.clientX-r.left,y:e.clientY-r.top};
}

function distance(a,b) {
  return Math.hypot(a.x-b.x,a.y-b.y);
}

function pointerDown(e) {
  if (!running) return;
  const p=getPos(e);
  if (distance(p,startPoint) > Math.max(34,radius*.18)) return;
  drawing=true;
  points=[p];
  canvas.setPointerCapture?.(e.pointerId);
  e.preventDefault();
  beep(650,.05);
}

function pointerMove(e) {
  if (!drawing || !running) return;
  const p=getPos(e);
  const last=points[points.length-1];
  if (!last || distance(p,last)>2.2) points.push(p);
  drawScene();
  e.preventDefault();
}

function pointerUp(e) {
  if (!drawing) return;
  drawing=false;
  canvas.releasePointerCapture?.(e.pointerId);
  if (points.length < 20) {
    points=[];
    drawScene();
    return;
  }
  finishRound();
}

function circularCoverage(angles) {
  if (angles.length<2) return 0;
  const sorted=[...angles].sort((a,b)=>a-b);
  let maxGap=0;
  for(let i=1;i<sorted.length;i++) maxGap=Math.max(maxGap,sorted[i]-sorted[i-1]);
  maxGap=Math.max(maxGap,Math.PI*2-sorted.at(-1)+sorted[0]);
  return Math.max(0,1-maxGap/(Math.PI*2));
}

function evaluateCircle() {
  const radii=points.map(p=>distance(p,center));
  const avgR=radii.reduce((a,b)=>a+b,0)/radii.length;
  const variance=radii.reduce((sum,r)=>sum+(r-avgR)**2,0)/radii.length;
  const std=Math.sqrt(variance);

  const shapeScore=Math.max(0,100-(std/Math.max(avgR,1))*250);
  const radiusScore=Math.max(0,100-(Math.abs(avgR-radius)/radius)*180);

  const closureDist=distance(points[0],points.at(-1));
  const closureScore=Math.max(0,100-(closureDist/radius)*180);

  const angles=points.map(p=>{
    let a=Math.atan2(p.y-center.y,p.x-center.x);
    if(a<0) a+=Math.PI*2;
    return a;
  });
  const coverage=circularCoverage(angles);
  const coverageScore=Math.min(100,coverage*108);

  const pathLength=points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
  const idealLength=2*Math.PI*radius;
  const lengthScore=Math.max(0,100-(Math.abs(pathLength-idealLength)/idealLength)*80);

  let total =
    shapeScore*.34 +
    radiusScore*.24 +
    closureScore*.18 +
    coverageScore*.18 +
    lengthScore*.06;

  if (coverage < .78) total *= coverage/.78;
  return {
    total:Math.max(0,Math.min(100,total)),
    shape:shapeScore,
    closure:(closureScore*.55+coverageScore*.45),
    radius:radiusScore
  };
}

function commentFor(score) {
  if(score>=97) return "거의 완벽한 원이에요!";
  if(score>=93) return "프로급 마우스 컨트롤이에요.";
  if(score>=88) return "매우 안정적인 원입니다.";
  if(score>=80) return "좋아요! 조금만 더 부드럽게 그려보세요.";
  if(score>=65) return "출발점과 반지름을 더 의식해보세요.";
  return "천천히 한 바퀴를 완성해보세요.";
}

function finishRound() {
  running=false;
  const result=evaluateCircle();
  const score=Number(result.total.toFixed(1));
  scores.push(score);
  roundScore.textContent=score.toFixed(1);
  roundComment.textContent=commentFor(score);
  shapeMetric.textContent=Math.round(result.shape);
  closureMetric.textContent=Math.round(result.closure);
  radiusMetric.textContent=Math.round(result.radius);

  const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
  averageText.textContent=avg.toFixed(1);
  roundOverlay.hidden=false;
  nextBtn.textContent=round===5 ? "최종 결과 보기" : "다음 라운드";
  beep(score>=90?880:440,.1);
}

function beginRound() {
  points=[];
  running=true;
  drawing=false;
  roundText.textContent=round;
  roundOverlay.hidden=true;
  finalOverlay.hidden=true;
  drawScene();
}

function showFinal() {
  const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
  const value=Number(avg.toFixed(1));
  finalScore.textContent=value.toFixed(1);

  let grade="원 그리기 연습생";
  if(value>=97) grade="완벽한 원의 장인";
  else if(value>=93) grade="프로게이머급 컨트롤";
  else if(value>=88) grade="정교한 마우스 컨트롤";
  else if(value>=80) grade="안정적인 원 그리기";
  else if(value>=65) grade="조금만 더 연습해보세요";
  finalGrade.textContent=grade;

  const newRecord=value>best;
  if(newRecord) {
    best=value;
    localStorage.setItem(STORAGE_KEY,String(best));
    recordText.textContent="★ 최고 기록을 갱신했어요!";
  } else {
    recordText.textContent=best ? `최고 기록: ${best.toFixed(1)}점` : "";
  }
  updateBest();

  scoreList.innerHTML=scores.map((s,i)=>`<span class="score-chip">${i+1}R · ${s.toFixed(1)}</span>`).join("");
  roundOverlay.hidden=true;
  finalOverlay.hidden=false;
}

function startTest() {
  round=1;
  scores=[];
  averageText.textContent="-";
  introOverlay.hidden=true;
  beginRound();
}

startBtn.addEventListener("click",startTest);
retryBtn.addEventListener("click",startTest);

nextBtn.addEventListener("click",()=>{
  if(round>=5) showFinal();
  else {
    round++;
    beginRound();
  }
});

resetBtn.addEventListener("click",()=>{
  localStorage.removeItem(STORAGE_KEY);
  best=0;
  updateBest();
  recordText.textContent="저장된 최고 기록을 초기화했어요.";
});

soundBtn.addEventListener("click",()=>{
  soundOn=!soundOn;
  soundBtn.textContent=soundOn?"🔊":"🔇";
});

function beep(freq=500,duration=.07) {
  if(!soundOn) return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  const ac=new AC();
  const osc=ac.createOscillator();
  const gain=ac.createGain();
  osc.frequency.value=freq;
  gain.gain.setValueAtTime(.04,ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime+duration);
}

canvas.addEventListener("pointerdown",pointerDown);
canvas.addEventListener("pointermove",pointerMove);
canvas.addEventListener("pointerup",pointerUp);
canvas.addEventListener("pointercancel",pointerUp);
window.addEventListener("resize",resize);
window.addEventListener("orientationchange",()=>setTimeout(resize,180));

resize();
