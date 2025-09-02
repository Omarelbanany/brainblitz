let ws, myId;

function joinGame() {
  const name = document.getElementById("name").value || "Player";
  myId = Date.now();
  ws = new WebSocket(window.location.origin.replace(/^http/, "ws"));

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", name, id: myId }));
    document.getElementById("join").style.display = "none";
    document.getElementById("game").style.display = "block";
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "players") renderLeaderboard(msg.players);
    if (msg.type === "endResult") handleEndResult(msg);
  };
}

function answer(points) {
  ws.send(JSON.stringify({ type: "score", id: myId, points }));
}
function endGame() {
  ws.send(JSON.stringify({ type: "end_game" }));
}

function renderLeaderboard(players) {
  const ul = document.getElementById("leaderboard");
  ul.innerHTML = "";
  players.sort((a,b)=>b.score-a.score).forEach(p => {
    const li = document.createElement("li");
    li.textContent = ${p.name}: ${p.score};
    ul.appendChild(li);
  });
}

/*** END RESULT (per-player meme + confetti) ***/
function handleEndResult({ rank, leaderboard }) {
  // Winner gets winner meme + confetti once; others get emotional damage + looping sound
  const memeUrl = (rank === 1)
    ? "https://sayingimages.com/winner-meme/"
    : "https://i.imgflip.com/43a45p.png";

  document.getElementById("memeImg").src = memeUrl;
  document.getElementById("memePopup").classList.remove("hidden");

  if (rank === 1) {
    startConfetti(); // visual only
  } else {
    const emo = document.getElementById("emotionalSound");
    emo.currentTime = 0;
    emo.play(); // loops until stopped
  }

  window.finalLeaderboard = leaderboard;
}

function showLeaderboard() {
  // fade out emotional damage sound smoothly
  fadeOutSound(document.getElementById("emotionalSound"), 1200);
  document.getElementById("memePopup").classList.add("hidden");
  // re-render using window.finalLeaderboard (already sorted/ranked)
  const ul = document.getElementById("leaderboard");
  ul.innerHTML = "";
  (window.finalLeaderboard || []).forEach(p => {
    const li = document.createElement("li");
    li.textContent = ${p.rank}. ${p.name}: ${p.score};
    ul.appendChild(li);
  });
}

function restartGame() {
  // stop sound, hide popup, reset scores locally (demo); in a full game you'd reset on server
  fadeOutSound(document.getElementById("emotionalSound"), 600);
  document.getElementById("memePopup").classList.add("hidden");
  // simple reset: reload the page (easy for demo)
  location.reload();
}

/*** Smooth audio fade ***/
function fadeOutSound(audio, duration = 1000) {
  if (!audio || audio.paused) return;
  let step = audio.volume / (duration / 50);
  const timer = setInterval(() => {
    if (audio.volume > step) {
      audio.volume -= step;
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      clearInterval(timer);
    }
  }, 50);
}

/*** Confetti that fades away after ~5s ***/
function startConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = 1;

  let parts = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 50 + 50,
    color: hsl(${Math.random()*360},100%,50%)
  }));

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    parts.forEach(p => { p.y += (Math.cos(p.d) + 3 + p.r/2)/2; p.x += Math.sin(p.d); });
  }

  const loop = setInterval(draw, 30);
  setTimeout(() => {
    const fade = setInterval(() => {
      const op = parseFloat(canvas.style.opacity);
      if (op > 0.05) canvas.style.opacity = op - 0.05;
      else { clearInterval(fade); clearInterval(loop); ctx.clearRect(0,0,canvas.width,canvas.height); }
    }, 100);
  }, 5000);
}