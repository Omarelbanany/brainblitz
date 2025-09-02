const express = require("express");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => {
  console.log(🚀 BrainBlitz running on http://localhost:${PORT});
});

const wss = new WebSocketServer({ server });

let players = []; // {id,name,score,ws}

wss.on("connection", (ws) => {
  let me = null;

  ws.on("message", (raw) => {
    const data = JSON.parse(raw);

    if (data.type === "join") {
      me = { id: data.id, name: data.name || "Player", score: 0, ws };
      players.push(me);
      broadcast({ type: "players", players: compactPlayers() });
    }

    if (data.type === "score") {
      const p = players.find(x => x.id === data.id);
      if (p) {
        p.score += data.points || 0;
        broadcast({ type: "players", players: compactPlayers() });
      }
    }

    // End game -> send each player their own rank + full leaderboard
    if (data.type === "end_game") {
      const sorted = [...players].sort((a,b) => b.score - a.score);
      const leaderboard = sorted.map((p, i) => ({ name: p.name, score: p.score, rank: i+1 }));
      sorted.forEach((p, i) => {
        safeSend(p.ws, { type: "endResult", rank: i+1, leaderboard });
      });
    }
  });

  ws.on("close", () => {
    if (me) {
      players = players.filter(p => p !== me);
      broadcast({ type: "players", players: compactPlayers() });
    }
  });
});

function broadcast(msg) {
  wss.clients.forEach(c => safeSend(c, msg));
}
function safeSend(ws, msg) {
  try { ws.send(JSON.stringify(msg)); } catch {}
}
function compactPlayers() {
  return players.map(p => ({ id: p.id, name: p.name, score: p.score }));
}