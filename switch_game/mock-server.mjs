import { createServer } from "http";
import { Server } from "socket.io";

// ─── Map ───────────────────────────────────────────────────────────────────
// 21x15  0=floor  1=wall  "sXX"=switch
// Spawn Red:(1,1),(1,13)  Blue:(19,1),(19,13)
const MAP = [
  [1, 1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1],
  [1, 0,     0,     0,     0,     0,     0,     1,     0,     0,     0,     0,     0,     1,     0,     0,     0,     0,     0,     0,     1],
  [1, 0,     1,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     1,     0,     1],
  [1, 0,     1,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     1,     0,     1],
  [1, 0,     0,     0,     1,     0,    "s01",  0,     0,     0,    "s02",  0,     0,     0,    "s03",  0,     1,     0,     0,     0,     1],
  [1, 0,     1,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     1,     0,     1],
  [1, 0,     0,    "s04",  1,     0,     0,     1,     0,     0,     1,     0,     0,     1,     0,     0,     1,    "s05",  0,     0,     1],
  [1, 1,     0,     0,     0,     0,     0,     0,     0,     0,    "s06",  0,     0,     0,     0,     0,     0,     0,     0,     1,     1],
  [1, 0,     0,     0,     1,     0,     0,     1,     0,     0,     1,     0,     0,     1,     0,     0,     1,     0,     0,     0,     1],
  [1, 0,     1,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     1,     0,     1],
  [1, 0,     0,     0,     1,     0,     0,     0,     0,     0,    "s07",  0,     0,     0,     1,     0,     0,     0,     0,     0,     1],
  [1, 0,     1,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,     1,     0,     1],
  [1, 0,     1,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     0,     1,     1,     0,     1],
  [1, 0,     0,     0,     0,     0,     0,     1,     0,     0,     0,     0,     0,     1,     0,     0,     0,     0,     0,     0,     1],
  [1, 1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1,     1],
];

// s01:2 + s02:3 + s03:2 + s04:2 + s05:2 + s06:3 + s07:3 = 17
const SWITCH_WEIGHTS = { s01: 2, s02: 3, s03: 2, s04: 2, s05: 2, s06: 3, s07: 3 };

const SPAWN = {
  red:  [{ x: 1,  y: 1  }, { x: 1,  y: 13 }],
  blue: [{ x: 19, y: 1  }, { x: 19, y: 13 }],
};

const GAME_DURATION = 60;

// ─── Item definitions ──────────────────────────────────────────────────────
// Positions are floor tiles not occupied by switches
const ITEM_DEFS = [
  { name: "blinded", x: 5,  y: 1  },
  { name: "reverse", x: 15, y: 1  },
  { name: "jump",    x: 5,  y: 13 },
  { name: "blinded", x: 15, y: 13 },
  { name: "jump",    x: 3,  y: 7  },
  { name: "reverse", x: 17, y: 7  },
];

const ITEM_EFFECT_DURATION = 5000; // ms
const ITEM_RESPAWN_DELAY   = 8000; // ms

// ─── State ─────────────────────────────────────────────────────────────────
const rooms      = new Map(); // roomId -> { state, mapData }
const sidToRoom  = new Map(); // sid -> roomId
const timers     = new Map(); // roomId -> intervalId
const effectTimers = new Map(); // `${roomId}:${sid}:${effect}` -> timeoutId

// ─── Helpers ───────────────────────────────────────────────────────────────
function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function makeMapData() {
  return { map: MAP.map((r) => [...r]), switch_weights: { ...SWITCH_WEIGHTS } };
}

function makeState(roomId, hostSid) {
  const switches = Object.fromEntries(Object.keys(SWITCH_WEIGHTS).map((k) => [k, null]));
  return {
    room_id: roomId,
    status: "waiting",
    host: hostSid,
    players: {},
    items: [],
    time_left: GAME_DURATION,
    switches,
    score: { red: 0, blue: 0 },
  };
}

function makePlayerStatus() {
  return { blinded: false, reversed: false, can_jump: false };
}

function nextSpawn(room, team) {
  const taken = new Set(
    Object.values(room.state.players)
      .filter((p) => p.team === team)
      .map((p) => `${p.x},${p.y}`)
  );
  return { ...SPAWN[team].find((pos) => !taken.has(`${pos.x},${pos.y}`)) ?? SPAWN[team][0] };
}

function recalcScore(state) {
  state.score = { red: 0, blue: 0 };
  for (const [id, owner] of Object.entries(state.switches)) {
    if (owner) state.score[owner] += SWITCH_WEIGHTS[id];
  }
}

function spawnInitialItems(state) {
  state.items = ITEM_DEFS.map((d) => ({ ...d }));
}

function clearEffectTimersForRoom(roomId) {
  for (const key of [...effectTimers.keys()]) {
    if (key.startsWith(`${roomId}:`)) {
      clearTimeout(effectTimers.get(key));
      effectTimers.delete(key);
    }
  }
}

function applyEffect(roomId, room, targetSid, statusKey, duration) {
  const key = `${roomId}:${targetSid}:${statusKey}`;
  const existing = effectTimers.get(key);
  if (existing) clearTimeout(existing);

  if (room.state.players[targetSid]) {
    room.state.players[targetSid].status[statusKey] = true;
  }

  effectTimers.set(key, setTimeout(() => {
    effectTimers.delete(key);
    const r = rooms.get(roomId);
    if (r && r.state.players[targetSid]) {
      r.state.players[targetSid].status[statusKey] = false;
      io.to(roomId).emit("update_state", r.state);
    }
  }, duration));
}

function handleItemPickup(roomId, room, pickerSid, pickerTeam, item) {
  const opposing = pickerTeam === "red" ? "blue" : "red";

  if (item.name === "blinded") {
    for (const [sid, p] of Object.entries(room.state.players)) {
      if (p.team === opposing) applyEffect(roomId, room, sid, "blinded", ITEM_EFFECT_DURATION);
    }
    console.log("[item] blinded applied to", opposing);
  } else if (item.name === "reverse") {
    for (const [sid, p] of Object.entries(room.state.players)) {
      if (p.team === opposing) applyEffect(roomId, room, sid, "reversed", ITEM_EFFECT_DURATION);
    }
    console.log("[item] reversed applied to", opposing);
  } else if (item.name === "jump") {
    applyEffect(roomId, room, pickerSid, "can_jump", ITEM_EFFECT_DURATION);
    console.log("[item] can_jump applied to", pickerSid);
  }
}

function scheduleItemRespawn(roomId, item) {
  setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room || room.state.status !== "playing") return;
    // Only respawn if no item already at this position
    const occupied = room.state.items.some((i) => i.x === item.x && i.y === item.y);
    if (!occupied) {
      room.state.items.push({ ...item });
      io.to(roomId).emit("update_state", room.state);
      console.log("[item] respawned", item.name, "at", item.x, item.y);
    }
  }, ITEM_RESPAWN_DELAY);
}

function startCountdown(roomId) {
  const interval = setInterval(() => {
    const room = rooms.get(roomId);
    if (!room) { clearInterval(interval); timers.delete(roomId); return; }

    room.state.time_left -= 1;
    if (room.state.time_left <= 0) {
      room.state.time_left = 0;
      room.state.status = "finished";
      clearInterval(interval);
      timers.delete(roomId);
      clearEffectTimersForRoom(roomId);
    }
    io.to(roomId).emit("update_state", room.state);
  }, 1000);
  timers.set(roomId, interval);
}

// ─── Server ────────────────────────────────────────────────────────────────
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("[connect]", socket.id);

  socket.on("create_room", () => {
    let roomId;
    do { roomId = generateRoomId(); } while (rooms.has(roomId));

    const mapData = makeMapData();
    const state   = makeState(roomId, socket.id);
    state.players[socket.id] = { team: "red", ...SPAWN.red[0], status: makePlayerStatus() };

    rooms.set(roomId, { state, mapData });
    sidToRoom.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit("map", mapData);
    socket.emit("update_state", state);
    console.log("[create_room]", roomId, socket.id);
  });

  socket.on("join_room", ({ room_id }) => {
    const room = rooms.get(room_id);
    if (!room) { socket.emit("error", { reason: "room_not_found" }); return; }
    if (room.state.status !== "waiting") { socket.emit("error", { reason: "room_not_waiting" }); return; }

    const counts = Object.values(room.state.players).reduce(
      (acc, p) => { acc[p.team]++; return acc; },
      { red: 0, blue: 0 }
    );
    const team = counts.red <= counts.blue ? "red" : "blue";

    room.state.players[socket.id] = { team, ...nextSpawn(room, team), status: makePlayerStatus() };
    sidToRoom.set(socket.id, room_id);
    socket.join(room_id);

    socket.emit("map", room.mapData);
    io.to(room_id).emit("update_state", room.state);
    console.log("[join_room]", room_id, socket.id, team);
  });

  socket.on("start_game", () => {
    const roomId = sidToRoom.get(socket.id);
    const room   = rooms.get(roomId);
    if (!room)                              { socket.emit("error", { reason: "room_not_found" });       return; }
    if (room.state.host !== socket.id)      { socket.emit("error", { reason: "not_host" });             return; }
    if (room.state.status !== "waiting")    { socket.emit("error", { reason: "game_already_started" }); return; }

    room.state.status = "playing";
    spawnInitialItems(room.state);
    io.to(roomId).emit("update_state", room.state);
    startCountdown(roomId);
    console.log("[start_game]", roomId);
  });

  socket.on("move", ({ direction }) => {
    const roomId = sidToRoom.get(socket.id);
    const room   = rooms.get(roomId);
    if (!room || room.state.status !== "playing") return;

    const player = room.state.players[socket.id];
    if (!player) return;

    let dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    let dy = direction === "up"   ? -1 : direction === "down"  ? 1 : 0;

    // Server-side direction reversal
    if (player.status.reversed) {
      dx = -dx;
      dy = -dy;
    }

    const nx = player.x + dx;
    const ny = player.y + dy;

    const cell = room.mapData.map[ny]?.[nx];
    if (cell === undefined) return; // out of bounds
    if (!player.status.can_jump && cell === 1) return; // wall blocked unless jumping

    player.x = nx;
    player.y = ny;

    // Switch capture (only on non-wall floor with switch id)
    if (typeof cell === "string") {
      if (room.state.switches[cell] !== player.team) {
        room.state.switches[cell] = player.team;
        recalcScore(room.state);
      }
    }

    // Item pickup
    const itemIdx = room.state.items.findIndex((i) => i.x === nx && i.y === ny);
    if (itemIdx !== -1) {
      const item = room.state.items.splice(itemIdx, 1)[0];
      handleItemPickup(roomId, room, socket.id, player.team, item);
      scheduleItemRespawn(roomId, item);
    }

    io.to(roomId).emit("update_state", room.state);
  });

  socket.on("disconnect", () => {
    const roomId = sidToRoom.get(socket.id);
    sidToRoom.delete(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    delete room.state.players[socket.id];

    // Clean up effect timers for this player
    for (const key of [...effectTimers.keys()]) {
      if (key.startsWith(`${roomId}:${socket.id}:`)) {
        clearTimeout(effectTimers.get(key));
        effectTimers.delete(key);
      }
    }

    if (Object.keys(room.state.players).length === 0) {
      const timer = timers.get(roomId);
      if (timer) { clearInterval(timer); timers.delete(roomId); }
      clearEffectTimersForRoom(roomId);
      rooms.delete(roomId);
      console.log("[room deleted]", roomId);
    } else {
      if (room.state.host === socket.id) {
        room.state.host = Object.keys(room.state.players)[0];
      }
      io.to(roomId).emit("update_state", room.state);
    }
    console.log("[disconnect]", socket.id, roomId);
  });
});

httpServer.listen(8000, () =>
  console.log("Mock server running at http://localhost:8000")
);
