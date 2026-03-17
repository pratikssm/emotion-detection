/* ═══════════════════════════════════════════════════════════════
   EmoSense AI — app.js
   All JavaScript logic for the frontend
═══════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════
// CONFIG — Change API URL if Flask runs on a different port
// ══════════════════════════════════════════
const API_URL    = 'http://localhost:5000/predict';
const HEALTH_URL = 'http://localhost:5000/health';

// ══════════════════════════════════════════
// EMOTION DEFINITIONS
// (Must match model output order: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise)
// ══════════════════════════════════════════
const EMOTIONS = [
  { name: 'Angry',    emoji: '😠', color: '#ef4444' },
  { name: 'Disgust',  emoji: '🤢', color: '#10b981' },
  { name: 'Fear',     emoji: '😨', color: '#a855f7' },
  { name: 'Happy',    emoji: '😄', color: '#22c55e' },
  { name: 'Neutral',  emoji: '😐', color: '#94a3b8' },
  { name: 'Sad',      emoji: '😢', color: '#3b82f6' },
  { name: 'Surprise', emoji: '😲', color: '#f59e0b' },
];

// ══════════════════════════════════════════
// STATE VARIABLES
// ══════════════════════════════════════════
let stream         = null;
let detecting      = false;
let predictTimer   = null;
let sessionTimer   = null;
let detectionCount = 0;
let sessionSeconds = 0;
let emotionCounts  = {};
let sessionHistory = [];
let isDark         = true;
let useRealAPI     = false;

// Demo-mode simulation state
let simEmoIdx = 3;  // Default: Happy
let simHold   = 0;

// Initialize emotion counters to 0
EMOTIONS.forEach(e => emotionCounts[e.name] = 0);

// ══════════════════════════════════════════
// CHART
// ══════════════════════════════════════════
let chart = null;

function initChart() {
  chart = new Chart(document.getElementById('emotionChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: EMOTIONS.map(e => e.name),
      datasets: [{
        data: EMOTIONS.map(() => 0),
        backgroundColor: EMOTIONS.map(e => e.color + 'bb'),
        borderColor:     EMOTIONS.map(e => e.color),
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 10 }, color: '#5a7090', boxWidth: 10, padding: 8 }
        }
      }
    }
  });
}

function updateChart() {
  if (!chart) return;
  chart.data.datasets[0].data = EMOTIONS.map(e => emotionCounts[e.name]);
  chart.update('none');
}

// ══════════════════════════════════════════
// CONFIDENCE BARS — build DOM once
// ══════════════════════════════════════════
function initConfBars() {
  const container = document.getElementById('confBars');
  container.innerHTML = '';

  EMOTIONS.forEach(e => {
    const row = document.createElement('div');
    row.className = 'conf-row';
    row.innerHTML = `
      <div class="conf-label-row">
        <span>${e.emoji} ${e.name}</span>
        <span class="conf-pct" id="pct-${e.name}">0%</span>
      </div>
      <div class="conf-bar-bg">
        <div class="conf-bar-fill" id="bar-${e.name}" style="background:${e.color}"></div>
      </div>`;
    container.appendChild(row);
  });
}

// ══════════════════════════════════════════
// API HEALTH CHECK
// ══════════════════════════════════════════
async function checkAPI() {
  const dot    = document.getElementById('apiDot');
  const txt    = document.getElementById('apiText');
  const banner = document.getElementById('demoBanner');

  try {
    const r = await fetch(HEALTH_URL, { 
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    useRealAPI = d.model_ready;

    if (d.model_ready) {
      dot.className    = 'api-dot on';
      txt.textContent  = 'Flask API ✓';
      banner.classList.add('hidden');
      console.log('[✓] Flask API connected successfully');
    } else {
      dot.className    = 'api-dot off';
      txt.textContent  = 'No Model';
      banner.classList.remove('hidden');
      console.warn('[!] Model not loaded. Start Flask server: python backend/app.py');
    }
  } catch (err) {
    useRealAPI        = false;
    dot.className     = 'api-dot demo';
    txt.textContent   = 'Demo Mode';
    banner.classList.remove('hidden');
    console.error('[✗] Flask API connection failed:', err.message);
    console.log('Start Flask with: python backend/app.py');
  }
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p  => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ══════════════════════════════════════════
// THEME TOGGLE
// ══════════════════════════════════════════
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light', !isDark);
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';
}

// ══════════════════════════════════════════
// TOAST NOTIFICATION
// ══════════════════════════════════════════
function showToast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════
// START DETECTION — request webcam access
// ══════════════════════════════════════════
async function startDetection() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
    });

    const video = document.getElementById('videoEl');
    video.srcObject = stream;
    await video.play();
    video.style.display = 'block';

    document.getElementById('camPlaceholder').style.display = 'none';
    document.getElementById('statusDot').classList.add('active');
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display  = 'flex';

    detecting = true;
    sessionSeconds = 0;

    // Run prediction every 200ms (5 fps effective)
    predictTimer = setInterval(runFrame, 200);

    // Update session time every second
    sessionTimer = setInterval(() => {
      sessionSeconds++;
      const m = Math.floor(sessionSeconds / 60).toString().padStart(2, '0');
      const s = (sessionSeconds % 60).toString().padStart(2, '0');
      document.getElementById('statTime').textContent =
        sessionSeconds < 60 ? sessionSeconds + 's' : m + ':' + s;
    }, 1000);

    showToast('Detection started!', '🎥');

  } catch (err) {
    if (err.name === 'NotAllowedError') {
      showToast('Camera permission denied!', '⛔');
      alert('Camera allow karo:\nBrowser → Settings → Privacy → Camera → Allow\n\nPhir dobara try karo.');
    } else {
      showToast('Camera error: ' + err.message, '⚠️');
    }
  }
}

// ══════════════════════════════════════════
// STOP DETECTION
// ══════════════════════════════════════════
function stopDetection() {
  detecting = false;
  clearInterval(predictTimer);
  clearInterval(sessionTimer);

  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

  const video  = document.getElementById('videoEl');
  const canvas = document.getElementById('canvasEl');

  video.style.display = 'none';
  video.srcObject     = null;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById('camPlaceholder').style.display = 'flex';
  document.getElementById('statusDot').classList.remove('active');
  document.getElementById('startBtn').style.display = 'flex';
  document.getElementById('stopBtn').style.display  = 'none';

  document.getElementById('emotionEmoji').textContent  = '😶';
  document.getElementById('emotionLabel').textContent  = 'Stopped';
  document.getElementById('emotionLabel').style.color  = 'var(--muted)';
  document.getElementById('emotionConf').textContent   = '';
  document.getElementById('statFaces').textContent     = '0';

  showToast('Detection stopped', '⏹');
}

// ══════════════════════════════════════════
// MAIN PREDICTION LOOP (called every 200ms)
// ══════════════════════════════════════════
async function runFrame() {
  if (!detecting) return;

  const video  = document.getElementById('videoEl');
  const canvas = document.getElementById('canvasEl');
  const ctx    = canvas.getContext('2d');

  if (video.readyState < 2) return;   // Video not ready yet

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  // Mirror the frame (matches mirrored video display)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  if (useRealAPI) {
    // ── REAL FLASK API MODE ──────────────────────
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg', .75) }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.warn('[!] API error:', data.error);
        return;
      }

      document.getElementById('statFaces').textContent = data.count || 0;

      if (data.faces && data.faces.length > 0) {
        drawBox(ctx, data.faces[0], canvas.width);
        updateUI(data.faces[0]);
        record(data.faces[0]);
      }
    } catch (e) {
      console.error('[✗] Prediction error:', e.message);
      // Auto-switch to demo mode on persistent failure
      useRealAPI = false;
      console.log('Switched to demo mode. Check Flask server.');
    }

  } else {
    // ── DEMO / SIMULATION MODE ───────────────────
    simHold++;
    if (simHold > Math.floor(6 + Math.random() * 12)) {
      simHold = 0;
      // Weighted random: Happy most likely, Disgust least likely
      const weights = [0.28, 0.08, 0.09, 0.20, 0.18, 0.10, 0.07];
      let rand = Math.random(), cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) { simEmoIdx = i; break; }
      }
    }

    // Build fake confidence scores
    const rawScores = EMOTIONS.map((_, i) =>
      i === simEmoIdx ? 0.55 + Math.random() * 0.35 : Math.random() * 0.12
    );
    const sum       = rawScores.reduce((a, b) => a + b, 0);
    const normScores = rawScores.map(s => s / sum);

    const fakeResult = {
      emotion:    EMOTIONS[simEmoIdx].name,
      confidence: normScores[simEmoIdx],
      scores:     Object.fromEntries(EMOTIONS.map((e, i) => [e.name, normScores[i]])),
      box: {
        x: Math.floor(canvas.width  * .28 + Math.sin(Date.now() / 4000) * canvas.width  * .04),
        y: Math.floor(canvas.height * .12),
        w: Math.floor(canvas.width  * .36),
        h: Math.floor(canvas.height * .65)
      }
    };

    document.getElementById('statFaces').textContent = 1;
    drawBox(ctx, fakeResult, canvas.width);
    updateUI(fakeResult);
    record(fakeResult);
  }
}

// ══════════════════════════════════════════
// DRAW BOUNDING BOX ON CANVAS
// ══════════════════════════════════════════
function drawBox(ctx, face, canvasWidth) {
  const { x, y, w, h } = face.box;
  const emo = EMOTIONS.find(e => e.name === face.emotion) || EMOTIONS[4];

  // Corner-bracket style box
  const cornerLen = Math.max(18, Math.floor(w / 6));
  ctx.lineWidth    = 2;
  ctx.strokeStyle  = emo.color;
  ctx.shadowColor  = emo.color;
  ctx.shadowBlur   = 10;

  const corners = [
    [x,     y,     1,  1],   // Top-left
    [x + w, y,    -1,  1],   // Top-right
    [x,     y + h, 1, -1],   // Bottom-left
    [x + w, y + h,-1, -1],   // Bottom-right
  ];

  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerLen);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;

  // Label above the box
  const label = `${emo.emoji} ${face.emotion}  ${(face.confidence * 100).toFixed(0)}%`;
  ctx.font     = 'bold 13px Syne, sans-serif';
  const textW  = ctx.measureText(label).width;

  ctx.fillStyle = emo.color + 'dd';
  ctx.fillRect(x, y - 26, textW + 16, 26);

  ctx.fillStyle = '#000';
  ctx.fillText(label, x + 8, y - 8);
}

// ══════════════════════════════════════════
// UPDATE SIDEBAR UI
// ══════════════════════════════════════════
function updateUI(face) {
  const emo = EMOTIONS.find(e => e.name === face.emotion) || EMOTIONS[4];

  // Big emoji — animate when it changes
  const emojiEl = document.getElementById('emotionEmoji');
  if (emojiEl.textContent !== emo.emoji) {
    emojiEl.textContent = emo.emoji;
    emojiEl.classList.remove('pop');
    void emojiEl.offsetWidth;   // force reflow to restart animation
    emojiEl.classList.add('pop');
  }

  document.getElementById('emotionLabel').textContent = emo.name;
  document.getElementById('emotionLabel').style.color = emo.color;
  document.getElementById('emotionConf').textContent  = `${(face.confidence * 100).toFixed(1)}% confidence`;

  // Update all confidence bars
  EMOTIONS.forEach(e => {
    const score = (face.scores?.[e.name] || 0) * 100;
    const bar   = document.getElementById('bar-' + e.name);
    const pct   = document.getElementById('pct-' + e.name);
    if (bar) bar.style.width     = score.toFixed(1) + '%';
    if (pct) pct.textContent     = score.toFixed(1) + '%';
  });
}

// ══════════════════════════════════════════
// RECORD DETECTION & UPDATE STATS
// ══════════════════════════════════════════
function record(face) {
  detectionCount++;
  emotionCounts[face.emotion] = (emotionCounts[face.emotion] || 0) + 1;

  document.getElementById('statTotal').textContent = detectionCount;

  // Dominant emotion emoji
  const dominant = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  const domEmo   = EMOTIONS.find(e => e.name === dominant[0]);
  document.getElementById('statDom').textContent = domEmo ? domEmo.emoji : '—';

  // Add to history every 5 detections (avoids spamming the list)
  if (detectionCount % 5 === 0) addHistory(face);

  updateChart();
}

function addHistory(face) {
  const list    = document.getElementById('historyList');
  const emptyEl = list.querySelector('.empty-msg');
  if (emptyEl) emptyEl.remove();

  const emo = EMOTIONS.find(e => e.name === face.emotion) || EMOTIONS[4];
  const now = new Date();

  const item       = document.createElement('div');
  item.className   = 'history-item';
  item.innerHTML   = `
    <span style="font-size:1.1rem">${emo.emoji}</span>
    <span style="color:${emo.color};font-family:'Syne',sans-serif;font-weight:700">${emo.name}</span>
    <span style="color:var(--muted);font-size:.7rem">${(face.confidence * 100).toFixed(0)}%</span>
    <span style="color:var(--muted);font-size:.68rem">${now.toLocaleTimeString()}</span>`;

  list.insertBefore(item, list.firstChild);

  // Keep list at max 12 entries
  while (list.children.length > 12) list.removeChild(list.lastChild);

  sessionHistory.push({
    emotion:    face.emotion,
    confidence: (face.confidence * 100).toFixed(1),
    time:       now.toISOString()
  });
}

// ══════════════════════════════════════════
// SCREENSHOT
// ══════════════════════════════════════════
function takeSnapshot() {
  if (!detecting) {
    showToast('Pehle detection start karo!', '⚠️');
    return;
  }

  // Flash effect
  const flash = document.getElementById('flash');
  flash.classList.add('snap');
  setTimeout(() => flash.classList.remove('snap'), 200);

  // Download canvas as PNG
  const canvas = document.getElementById('canvasEl');
  const a      = document.createElement('a');
  a.download   = `emosense-${Date.now()}.png`;
  a.href       = canvas.toDataURL('image/png');
  a.click();

  showToast('Screenshot saved!', '📸');
}

// ══════════════════════════════════════════
// DOWNLOAD SESSION REPORT
// ══════════════════════════════════════════
function downloadReport() {
  if (detectionCount === 0) {
    showToast('Pehle detection start karo!', '⚠️');
    return;
  }

  const lines = [
    '╔══════════════════════════════════════════╗',
    '║      EmoSense AI — Session Report        ║',
    '╚══════════════════════════════════════════╝',
    '',
    `Generated    : ${new Date().toLocaleString()}`,
    `Session Time : ${sessionSeconds}s`,
    `Total Detections: ${detectionCount}`,
    '',
    '── EMOTION BREAKDOWN ──────────────────────',
    ...EMOTIONS.map(e => {
      const c = emotionCounts[e.name] || 0;
      const p = detectionCount ? ((c / detectionCount) * 100).toFixed(1) : 0;
      const bars = '█'.repeat(Math.round(p / 5)) + '░'.repeat(20 - Math.round(p / 5));
      return `  ${e.emoji} ${e.name.padEnd(10)} ${bars} ${p}% (${c})`;
    }),
    '',
    '── DETECTION LOG ──────────────────────────',
    ...sessionHistory.map(h =>
      `  [${new Date(h.time).toLocaleTimeString()}]  ${h.emotion.padEnd(10)}  ${h.confidence}% confidence`
    ),
    '',
    'EmoSense AI | TensorFlow + Flask | College Project'
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.download = `emosense-report-${Date.now()}.txt`;
  a.href     = URL.createObjectURL(blob);
  a.click();

  showToast('Report downloaded!', '📄');
}

// ══════════════════════════════════════════
// APP INIT — runs when DOM is ready
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  console.log('%c EmoSense AI Frontend Initialized ', 'background:#22c55e;color:#000;font-weight:bold;padding:4px 8px;border-radius:4px;');
  console.log('Frontend Version: 1.0 | Last Updated: 2026-03-17');
  console.log('Checking Flask API connection...');
  
  initConfBars();           // Build confidence bar DOM
  initChart();              // Init Chart.js doughnut
  checkAPI();               // Check if Flask is running
  setInterval(checkAPI, 15000);  // Re-check every 15 seconds
  
  console.log('To connect to real backend:\n1. Open terminal\n2. Run: python backend/app.py\n3. Make sure emotion_model.h5 exists in src/ folder');
});