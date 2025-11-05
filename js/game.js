import Platform from "./Classes/Platform.js";
import Player from "./Classes/Player.js";
import Residuo from "./Classes/Residuos.js";
import Box from "./Classes/Box.js";
import Goal from "./Classes/Goal.js";

// Canvas Elements
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  " ": false,
  x: false,
  z: false,
};

// Game state
let isPaused = false;

// Reusable pause/unpause functions
function pauseGame() {
  isPaused = true;
}

function unpauseGame() {
  isPaused = false;
}

function togglePause() {
  isPaused = !isPaused;
}

// Victory popup elements
const victoryOverlay = document.getElementById("victoryOverlay");
const nextPhaseBtn = document.getElementById("nextPhaseBtn");
const keepCollectingBtn = document.getElementById("keepCollectingBtn");

// Residuo counter UI elements
const uiPapel = document.getElementById("ui-papel");
const uiVidro = document.getElementById("ui-vidro");
const uiPlastico = document.getElementById("ui-plastico");
const uiLixo = document.getElementById("ui-lixo");
const uiTotal = document.getElementById("ui-total");

// Function to update the residuo counter UI
function updateResiduoUI() {
  const counts = player.getResiduoCounts();
  const total = counts.papel + counts.vidro + counts.plastico + counts.lixo;
  
  uiPapel.textContent = counts.papel;
  uiVidro.textContent = counts.vidro;
  uiPlastico.textContent = counts.plastico;
  uiLixo.textContent = counts.lixo;
  uiTotal.textContent = `${total}/24`;
}

// Next phase button click handler
nextPhaseBtn.addEventListener("click", () => {
  window.location.href = "../html/jogo_ml5.html";
});

// Keep collecting button click handler
keepCollectingBtn.addEventListener("click", () => {
  unpauseGame();
  // Don't reset completed flag - the goal will re-trigger only after player exits and re-enters
  victoryOverlay.classList.remove("show");
});

// === INSTRUCTIONS MODAL ===
// Initialize instructions modal that appears when entering the game
function initInstrucoesModal() {
  const modal = document.getElementById("instrucoesModal");
  const jogarBtn = document.getElementById("instrucoesJogar");
  const naoMostrarBtn = document.getElementById("instrucoesNaoMostrar");

  // Check if user has already asked not to show instructions
  const naoMostrarInstrucoes = localStorage.getItem(
    "nao_mostrar_instrucoes_game"
  );

  // Show modal only if user hasn't disabled it
  if (!naoMostrarInstrucoes || naoMostrarInstrucoes !== "true") {
    modal.classList.add("active");
  }

  // Button to start playing
  jogarBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Button to not show instructions again
  naoMostrarBtn.addEventListener("click", () => {
    localStorage.setItem("nao_mostrar_instrucoes_game", "true");
    modal.classList.remove("active");
  });

  // Close if clicking outside the modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
}

// Initialize instructions modal on page load
initInstrucoesModal();

// === GRID SYSTEM ===
const GRID_COLS = 48; // 48 columns
const GRID_ROWS = 28; // 28 rows
const GRID_SIZE = 48; // Each grid cell is 24x24 pixels (800/d48 ≈ 16.67, 600/28 ≈ 21.43, using 24 for clean division)

// === DEBUG MODE ===
let DEBUG_MODE = false;
keys["d"] = false; // Toggle debug with 'd' key

// === CAMERA SYSTEM ===
const camera = {
  x: 0,
  y: 0,
  deadZoneX: W * 0.3, // Player can move 30% from center before camera moves
  deadZoneWidth: W * 0.4, // Dead zone is 40% of screen width
  smoothness: 0.1, // Camera lerp factor (lower = smoother)
  worldWidth: 2016, // Total world width (matches right boundary)
  worldHeight: H,

  update(targetX) {
    // Calculate camera bounds
    const leftBound = this.x + this.deadZoneX;
    const rightBound = this.x + this.deadZoneX + this.deadZoneWidth;

    // Only move camera if player exits dead zone
    if (targetX < leftBound) {
      this.x += (targetX - leftBound) * this.smoothness;
    } else if (targetX > rightBound) {
      this.x += (targetX - rightBound) * this.smoothness;
    }

    // Clamp camera to world bounds
    this.x = Math.max(0, Math.min(this.worldWidth - W, this.x));
    this.y = Math.max(0, Math.min(this.worldHeight - H, this.y));
  },

  apply(ctx) {
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  },
};

// Game Creation
const player = new Player(1.5, 10.5); // Grid coordinates: x=2, y=10.5 -> pixels: x=96, y=504
await player.loadAudio("../assets/sound/power_up.wav", "power_up");
await player.loadAudio("../assets/sound/jump.wav", "jump");
await player.loadSprite("../assets/img/Player.png");

// Load residuo images
await Residuo.loadImages();

// Load tileset for platforms and boxes
const tileset = new Image();
tileset.src = "../assets/img/Ground.png";
Platform.setTileset(tileset);
Box.setTileset(tileset);

const platforms = [
  new Platform(0, 11.5, 42, 0.83),

  new Platform(3, 9.5, 6, 0.83),
  new Platform(3, 7.5, 2, 0.5, { type: "oneway" }),
  new Platform(7, 7.5, 2, 0.5, { type: "oneway" }),

  new Platform(12, 9.5, 3, 0.83),
  new Platform(12, 8.5, 1, 1.83),

  new Platform(12, 5.5, 3, 0.83),
  new Platform(12, 4.5, 1, 1.83),

  new Platform(14, 7.5, 3, 0.83),
  new Platform(16, 6.5, 1, 1.83),

  new Platform(19, 9.5, 3, 0.5, { type: "oneway" }),
  new Platform(19, 7.5, 3, 0.5, {
    type: "oneway",
    minGridY: 3.5,
    maxGridY: 7.5,
    vy: 80,
  }),

  new Platform(24, 10.5, 4, 1.83),
  new Platform(29, 10.5, 4, 1.83),

  new Platform(25, 8.5, 7, 0.83),
  new Platform(25, 3.5, 1, 5.83),

  new Platform(26, 4.5, 3, 0.5, { type: "oneway" }),
  new Platform(32, 4.5, 3, 0.5, { type: "oneway" }),
  new Platform(29, 6.5, 3, 0.5, { type: "oneway" }),

  new Platform(34, 9.5, 3, 0.5, {
    type: "oneway",
    minGridX: 34,
    maxGridX: 37,
    vx: 80,
  }),
];

// === RESIDUO SPAWN SYSTEM ===
const possibleResiduoPositions = [
  { x: 2, y: 10 },
  { x: 3, y: 11 },
  { x: 3, y: 5 },
  { x: 3, y: 7 },
  { x: 4, y: 9 },
  { x: 5, y: 6 },
  { x: 5, y: 11 },
  { x: 6, y: 6 },
  { x: 6, y: 11 },
  { x: 7, y: 9 },
  { x: 8, y: 5 },
  { x: 8, y: 7 },
  { x: 8, y: 11 },
  { x: 9, y: 10 },
  { x: 10, y: 9 },
  { x: 10, y: 11 },
  { x: 12, y: 4 },
  { x: 12, y: 8 },
  { x: 12, y: 11 },
  { x: 13, y: 5 },
  { x: 13, y: 9 },
  { x: 14, y: 11 },
  { x: 15, y: 7 },
  { x: 15, y: 10 },
  { x: 16, y: 6 },
  { x: 17, y: 11 },
  { x: 19, y: 9 },
  { x: 19, y: 3 },
  { x: 20, y: 7 },
  { x: 21, y: 9 },
  { x: 21, y: 3 },
  { x: 23, y: 9 },
  { x: 23, y: 11 },
  { x: 25, y: 10 },
  { x: 25, y: 3 },
  { x: 26, y: 4 },
  { x: 26, y: 8 },
  { x: 28, y: 4 },
  { x: 28, y: 6 },
  { x: 28, y: 10 },
  { x: 31, y: 6 },
  { x: 31, y: 10 },
  { x: 32, y: 9 },
  { x: 32, y: 7 },
  { x: 34, y: 11 },
  { x: 34, y: 8 },
  { x: 36, y: 7 },
  { x: 36, y: 9 },
  { x: 37, y: 11 },
  { x: 38, y: 9 },
  { x: 39, y: 9 },
  { x: 40, y: 11 },
  { x: 41, y: 9 },
];

// Function to randomly select 24 positions with at least one of each type
function spawnRandomResiduos() {
  const types = ["PLASTIC", "PAPER", "GLASS", "INDEFERENCIADO"];
  const selectedPositions = [];
  const residuos = [];

  // Shuffle the possible positions
  const shuffledPositions = [...possibleResiduoPositions].sort(
    () => Math.random() - 0.5
  );

  // Select 24 positions
  for (let i = 0; i < 24 && i < shuffledPositions.length; i++) {
    selectedPositions.push(shuffledPositions[i]);
  }

  // Ensure at least one of each type
  for (let i = 0; i < types.length; i++) {
    const pos = selectedPositions[i];
    residuos.push(new Residuo(pos.x, pos.y, 0.67, 0.67, types[i])); // Using grid coordinates
  }

  // Fill remaining with random types
  for (let i = types.length; i < selectedPositions.length; i++) {
    const pos = selectedPositions[i];
    const randomType = types[Math.floor(Math.random() * types.length)];
    residuos.push(new Residuo(pos.x, pos.y, 0.67, 0.67, randomType)); // Using grid coordinates
  }

  return residuos;
}

// Create residuos with random selection
const residuos = spawnRandomResiduos();
// Create Goal at the start of the level
const goal = new Goal(41, 10.5, 1, 1); // Grid: x=0, y=10, w=1, h=1.5 -> pixels: x=0, y=480, w=48, h=72

const boxes = [
  new Box(21.5, 8.5, 1, 1),
  new Box(12.5, 3.5, 1, 1),
  new Box(25.5, 9.5, 1, 1),
  new Box(12.5, 10.5, 1, 1),
];

// Event Loop
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  ctx.clearRect(0, 0, W, H);

  // Only update game logic if not paused
  if (!isPaused) {
    // Update camera to follow player
    camera.update(player.pos.x, player.pos.y);

    // Update goal
    goal.update(dt, player);

    // Check if player reached the goal
    if (goal.checkCollision(player)) {
      pauseGame(); // Pause the game using reusable function
      goal.completed = true; // Mark as completed to prevent multiple triggers
      const counts = goal.saveToLocalStorage(player);
      console.log("Level Complete!", counts);

      // Calculate total collected
      const total = counts.papel + counts.vidro + counts.plastico + counts.lixo;

      // Update stats in the popup
      document.getElementById("stat-papel").textContent = counts.papel;
      document.getElementById("stat-vidro").textContent = counts.vidro;
      document.getElementById("stat-plastico").textContent = counts.plastico;
      document.getElementById("stat-lixo").textContent = counts.lixo;
      document.getElementById("stat-total").querySelector("span").textContent =
        total;

      // Show "Keep Collecting" button only if not all residuos collected
      if (total < 24) {
        keepCollectingBtn.style.display = "block";
      } else {
        keepCollectingBtn.style.display = "none";
      }

      // Show victory popup
      victoryOverlay.classList.add("show");
    }
  }

  // Always render (even when paused)
  // Apply camera transform
  ctx.save();
  camera.apply(ctx);

  platforms.forEach((p) => {
    if (!isPaused) p.update(dt);
    p.render(ctx);
  });

  // Render goal
  goal.render(ctx);

  residuos.forEach((r) => {
    if (!isPaused) r.update(dt);
    r.render(ctx);
  });
  boxes.forEach((b) => {
    if (!isPaused) b.update(dt, platforms, boxes);
    b.render(ctx, residuos); // Pass residuos for glow effect
  });
  if (!isPaused) {
    player.update(dt, keys, platforms, residuos, boxes);
  }
  player.render(ctx);

  // Update the residuo counter UI
  updateResiduoUI();

  // Restore camera transform (world space ends)
  ctx.restore();

  // === DEBUG RENDERING (Screen space) ===
  if (DEBUG_MODE) {
    // Re-apply camera for world-space debug rendering
    ctx.save();
    camera.apply(ctx);

    ctx.lineWidth = 2;

    // Draw platform hitboxes (green)
    ctx.strokeStyle = "#00FF00";
    platforms.forEach((p) => {
      const aabb = p.getAABB();
      ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
      // Label platform type
      ctx.fillStyle = "#00FF00";
      ctx.font = "10px monospace";
      ctx.fillText(p.type, aabb.x + 2, aabb.y + 10);
    });

    // Draw box hitboxes (yellow)
    ctx.strokeStyle = "#FFFF00";
    boxes.forEach((b) => {
      const aabb = b.getAABB();
      ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
    });

    // Draw residuo hitboxes (cyan) with type labels
    ctx.strokeStyle = "#00FFFF";
    residuos.forEach((r) => {
      if (!r.collected || r.popUpTimer < r.popUpDuration) {
        const aabb = r.getAABB();
        ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
        // Label residuo type
        ctx.fillStyle = r.type.color;
        ctx.font = "8px monospace";
        ctx.fillText(r.type.name.substring(0, 4), aabb.x + 2, aabb.y + 10);
      }
    });

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    // Vertical lines
    for (let x = 0; x <= camera.worldWidth; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, camera.worldHeight);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y <= camera.worldHeight; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y - 24);
      ctx.lineTo(camera.worldWidth, y - 24);
      ctx.stroke();
    }
    ctx.lineWidth = 2;

    // Draw player hitbox (red)
    ctx.strokeStyle = "#FF0000";
    const playerHB = player.getHitbox();
    ctx.strokeRect(playerHB.x, playerHB.y, playerHB.w, playerHB.h);

    // Draw goal hitbox (magenta)
    ctx.strokeStyle = goal.isActive ? "#FF00FF" : "#663366";
    const goalAABB = goal.getAABB();
    ctx.strokeRect(goalAABB.x, goalAABB.y, goalAABB.w, goalAABB.h);
    ctx.fillStyle = goal.isActive ? "#FF00FF" : "#663366";
    ctx.font = "10px monospace";
    ctx.fillText("GOAL", goalAABB.x + 2, goalAABB.y + 10);

    // Draw player center point
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player.pos.x - 2, player.pos.y - 2, 4, 4);

    // Draw ground line
    ctx.strokeStyle = "#FF00FF";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(W, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore(); // End world-space debug rendering

    // Screen-space debug info (fixed to screen)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px monospace";
    ctx.fillText(`DEBUG MODE (Press 'D' to toggle)`, 10, 20);
    ctx.fillText(
      `Grid: ${GRID_COLS}x${GRID_ROWS} (${GRID_SIZE}px cells)`,
      10,
      35
    );
    ctx.fillText(
      `Player Pos: (${Math.round(player.pos.x)}, ${Math.round(
        player.pos.y
      )}) Grid: (${Math.floor(player.pos.x / GRID_SIZE)}, ${Math.floor(
        player.pos.y / GRID_SIZE
      )})`,
      10,
      50
    );
    ctx.fillText(
      `Player Vel: (${Math.round(player.vel.x)}, ${Math.round(player.vel.y)})`,
      10,
      65
    );
    ctx.fillText(`On Ground: ${player.onGround}`, 10, 80);

    // Count residuos by type
    const typeCounts = player.getResiduoCounts();
    const totalCollected =
      typeCounts.papel +
      typeCounts.vidro +
      typeCounts.plastico +
      typeCounts.lixo;
    ctx.fillText(`Collected: ${totalCollected}/${residuos.length}`, 10, 95);
    ctx.fillText(
      `  Papel: ${typeCounts.papel} Vidro: ${typeCounts.vidro}`,
      10,
      110
    );
    ctx.fillText(
      `  Plástico: ${typeCounts.plastico} Lixo: ${typeCounts.lixo}`,
      10,
      125
    );
    ctx.fillText(`Camera X: ${Math.round(camera.x)}`, 10, 140);
    ctx.fillText(`Goal Active: ${goal.isActive}`, 10, 155);
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Reding Inputs
document.onkeyup = (e) => {
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key] = false;
  }
};
document.onkeydown = (e) => {
  if (e.key in keys) {
    e.preventDefault();
    // Toggle debug mode with 'd' key
    if (e.key === "d") {
      DEBUG_MODE = !DEBUG_MODE;
      console.log("DEBUG_MODE:", DEBUG_MODE);
    }
    keys[e.key] = true;
  }
};
