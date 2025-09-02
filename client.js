let myId, players = [];

function joinGame() {
  const name = document.getElementById("name").value || "Player";
  myId = Date.now();
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("game").style.display = "block";
  players.push({ id: myId, name, score: 0 });
  renderLeaderboard();
}

function answer(points) {
  const player = players.find(p => p.id === myId);
  if (!player) return;
  player.score += points;
  renderLeaderboard();
}

function endGame() {
  players.sort((a, b) => b.score - a.score);
  const rank = players.findIndex(p => p.id === myId) + 1;
  handleEndResult({ rank, leaderboard: players });
}

function renderLeaderboard() {
  const ul = document.getElementById("leaderboard");
  ul.innerHTML = "";
  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p.name}: ${p.score}`;
    ul.appendChild(li);
  });
}

function handleEndResult({ rank, leaderboard }) {
  const memeUrl = rank === 1
    ? "https://sayingimages.com/winner-meme/"
    : "https://i.imgflip.com/43a45p.png";

  const popup = document.getElementById("memePopup");
  document.getElementById("memeImg").src = memeUrl;
  popup.classList.remove("hidden");

  if (rank === 1) startConfetti();
  else {
    const emo = document.getElementById("emotionalSound");
    emo.currentTime = 0;
    emo.play();
  }

  window.finalLeaderboard = leaderboard;
}

function showLeaderboard() {
  fadeOutSound(document.getElementById("emotionalSound"), 1200);
  document.getElementById("memePopup").classList.add("hidden");
  renderLeaderboard();
}

function restartGame() {
  fadeOutSound(document.getElementById("emotionalSound"), 600);
  document.getElementById("memePopup").classList.add("hidden");
  players = [];
  document.getElementById("game").style.display = "none";
  document.getElementById("mainPage").style.display = "flex";
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
    color: `hsl(${Math.random()*360},100%,50%)`
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