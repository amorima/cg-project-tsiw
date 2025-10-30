import Platform from './Classes/Platform.js';
import Player from './Classes/Player.js';
import Residuo from './Classes/Residuos.js';
import Box from './Classes/Box.js';
import Goal from './Classes/Goal.js';

// Canvas Elements
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const keys = {'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false,' ':false, 'x':false, 'z':false};

// === GRID SYSTEM ===
const GRID_COLS = 48;  // 48 columns
const GRID_ROWS = 28;  // 28 rows
const GRID_SIZE = 48;  // Each grid cell is 24x24 pixels (800/d48 ≈ 16.67, 600/28 ≈ 21.43, using 24 for clean division)

// === DEBUG MODE ===
let DEBUG_MODE = false;
keys['d'] = false; // Toggle debug with 'd' key

// === CAMERA SYSTEM ===
const camera = {
    x: 0,
    y: 0,
    deadZoneX: W * 0.3,        // Player can move 30% from center before camera moves
    deadZoneWidth: W * 0.4,    // Dead zone is 40% of screen width
    smoothness: 0.1,           // Camera lerp factor (lower = smoother)
    worldWidth: 2016,          // Total world width (matches right boundary)
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
    }
};

// Game Creation
const MUSIC = new Audio('../assets/audio/time_for_adventure.mp3');
MUSIC.loop = true;
MUSIC.play()

const player = new Player(96, 504);
await player.loadAudio('../assets/audio/jump.wav', 'jump');
await player.loadAudio('../assets/audio/power_up.wav', 'power_up');
await player.loadSprite('../assets/img/Player.png');

// Load residuo images
await Residuo.loadImages();

// Load tileset for platforms and boxes
const tileset = new Image();
tileset.src = '../assets/img/Ground.png';
Platform.setTileset(tileset);
Box.setTileset(tileset);

const platforms = [
    // === SECTION 1: STARTING AREA (0-800) ===
    // Ground layer
    new Platform(0, 552, 384, 40),
    new Platform(432, 552, 384, 40),
    
    // Lower platforms
    new Platform(144, 456, 144, 40),
    new Platform(528, 456, 192, 40),
    
    // Mid platforms
    new Platform(0, 360, 96, 40),
    new Platform(240, 360, 192, 40),
    new Platform(528, 336, 144, 40),
    new Platform(720, 408, 96, 40),
    
    // High platforms
    new Platform(96, 264, 144, 40),
    new Platform(432, 240, 192, 40),
    new Platform(672, 288, 144, 40),
    
    // Moving platform
    new Platform(288, 168, 96, 40, {vx: 80, maxX: 480, minX: 96}),
    
    // One-way platforms
    new Platform(144, 120, 144, 24, {type: 'oneway'}),
    new Platform(480, 144, 144, 24, {type: 'oneway'}),
    new Platform(336, 480, 96, 24, {type: 'oneway'}),
    
    // Walls
    new Platform(0, 600, 48, 240),
    new Platform(768, 336, 48, 240),
    
    // === SECTION 2: MIDDLE AREA (800-1600) ===
    // Ground continuation
    new Platform(816, 552, 384, 40),
    new Platform(1248, 552, 336, 40),
    
    // Staircase section
    new Platform(864, 504, 96, 40),
    new Platform(960, 456, 96, 40),
    new Platform(1056, 408, 96, 40),
    new Platform(1152, 360, 96, 40),
    
    // Mid platforms
    new Platform(816, 384, 144, 40),
    new Platform(1008, 336, 192, 40),
    new Platform(1296, 384, 144, 40),
    new Platform(1488, 432, 96, 40),
    
    // High platforms
    new Platform(864, 240, 144, 40),
    new Platform(1104, 192, 192, 40),
    new Platform(1392, 264, 144, 40),
    
    // Moving platform
    new Platform(1200, 168, 96, 40, {vx: 60, maxX: 1392, minX: 1008}),
    
    // One-way platforms
    new Platform(912, 120, 144, 24, {type: 'oneway'}),
    new Platform(1248, 144, 144, 24, {type: 'oneway'}),
    new Platform(1440, 480, 96, 24, {type: 'oneway'}),
    
    // Tower
    new Platform(1584, 336, 48, 240),
    
    // === SECTION 3: END AREA (1600-2016) ===
    // Ground
    new Platform(1632, 552, 384, 40),
    
    // Challenge platforms (gaps)
    new Platform(1680, 456, 96, 40),
    new Platform(1824, 408, 96, 40),
    new Platform(1968, 360, 48, 40),
    
    // Final area platforms
    new Platform(1680, 336, 192, 40),
    new Platform(1920, 288, 96, 40),
    
    // High secret area
    new Platform(1776, 192, 144, 40),
    new Platform(1968, 144, 48, 40),
    
    // Moving platform
    new Platform(1872, 168, 96, 40, {vx: 70, maxX: 1968, minX: 1680}),
    
    // One-way platforms
    new Platform(1728, 120, 144, 24, {type: 'oneway'}),
    new Platform(1920, 96, 96, 24, {type: 'oneway'}),
    new Platform(1680, 480, 144, 24, {type: 'oneway'}),
    
    // End wall
    new Platform(1968, 240, 48, 336),
];

// === RESIDUO SPAWN SYSTEM ===

// 80 possible residuo positions (chosen to not overlap with platforms)
const possibleResiduoPositions = [
    // Section 1 (0-800) - 30 positions
    { x: 50, y: 520 }, { x: 100, y: 520 }, { x: 200, y: 520 }, { x: 250, y: 520 },
    { x: 300, y: 520 }, { x: 350, y: 520 }, { x: 500, y: 520 }, { x: 550, y: 520 },
    { x: 650, y: 520 }, { x: 700, y: 520 }, { x: 100, y: 420 }, { x: 200, y: 420 },
    { x: 250, y: 420 }, { x: 550, y: 420 }, { x: 650, y: 420 }, { x: 50, y: 330 },
    { x: 260, y: 330 }, { x: 350, y: 330 }, { x: 550, y: 300 }, { x: 600, y: 300 },
    { x: 700, y: 250 }, { x: 750, y: 250 }, { x: 120, y: 230 }, { x: 180, y: 230 },
    { x: 450, y: 210 }, { x: 520, y: 210 }, { x: 700, y: 380 }, { x: 360, y: 480 },
    { x: 480, y: 330 }, { x: 620, y: 380 },
    
    // Section 2 (800-1600) - 30 positions
    { x: 850, y: 520 }, { x: 900, y: 520 }, { x: 950, y: 520 }, { x: 1050, y: 520 },
    { x: 1100, y: 520 }, { x: 1200, y: 520 }, { x: 1270, y: 520 }, { x: 1320, y: 520 },
    { x: 1380, y: 520 }, { x: 1450, y: 520 }, { x: 1520, y: 520 }, { x: 900, y: 470 },
    { x: 1000, y: 470 }, { x: 1450, y: 470 }, { x: 1000, y: 420 }, { x: 1450, y: 400 },
    { x: 1080, y: 370 }, { x: 1180, y: 370 }, { x: 850, y: 350 }, { x: 930, y: 350 },
    { x: 1030, y: 300 }, { x: 1130, y: 300 }, { x: 1180, y: 300 }, { x: 1320, y: 350 },
    { x: 1380, y: 350 }, { x: 1420, y: 350 }, { x: 890, y: 210 }, { x: 950, y: 210 },
    { x: 1130, y: 160 }, { x: 1200, y: 160 },
    
    // Section 3 (1600-2016) - 20 positions
    { x: 1650, y: 520 }, { x: 1700, y: 520 }, { x: 1800, y: 520 }, { x: 1870, y: 520 },
    { x: 1930, y: 520 }, { x: 1700, y: 420 }, { x: 1750, y: 420 }, { x: 1850, y: 470 },
    { x: 1900, y: 470 }, { x: 1700, y: 300 }, { x: 1800, y: 300 }, { x: 1700, y: 380 },
    { x: 1730, y: 300 }, { x: 1850, y: 380 }, { x: 1930, y: 330 }, { x: 1800, y: 250 },
    { x: 1850, y: 250 }, { x: 1930, y: 250 }, { x: 1800, y: 160 }, { x: 1900, y: 160 }
];

// Function to randomly select 24 positions with at least one of each type
function spawnRandomResiduos() {
    const types = ['PLASTIC', 'PAPER', 'GLASS', 'INDEFERENCIADO'];
    const selectedPositions = [];
    const residuos = [];
    
    // Shuffle the possible positions
    const shuffledPositions = [...possibleResiduoPositions].sort(() => Math.random() - 0.5);
    
    // Select 24 positions
    for (let i = 0; i < 24 && i < shuffledPositions.length; i++) {
        selectedPositions.push(shuffledPositions[i]);
    }
    
    // Ensure at least one of each type
    for (let i = 0; i < types.length; i++) {
        const pos = selectedPositions[i];
        residuos.push(new Residuo(pos.x, pos.y, 32, 32, types[i]));
    }
    
    // Fill remaining with random types
    for (let i = types.length; i < selectedPositions.length; i++) {
        const pos = selectedPositions[i];
        const randomType = types[Math.floor(Math.random() * types.length)];
        residuos.push(new Residuo(pos.x, pos.y, 32, 32, randomType));
    }
    
    return residuos;
}

// Create residuos with random selection
const residuos = spawnRandomResiduos();
console.log(`Spawned ${residuos.length} residuos`);

// Create Goal at the start of the level
const goal = new Goal(0, 480, 48, 72);

const boxes = [
    // === SECTION 1 (0-800) ===
    new Box(144, 528, 48, 48),
    new Box(384, 528, 48, 48),
    new Box(624, 528, 48, 48),
    new Box(192, 432, 48, 48),
    new Box(624, 432, 48, 48),
    new Box(672, 312, 48, 48),
    new Box(672, 264, 48, 48),
    new Box(288, 336, 48, 48),
    new Box(144, 240, 48, 48),
    new Box(480, 216, 48, 48),
    new Box(768, 528, 48, 48),
    new Box(768, 480, 48, 48),
    new Box(768, 432, 48, 48),
    
    // === SECTION 2 (800-1600) ===
    new Box(864, 528, 48, 48),
    new Box(1152, 528, 48, 48),
    new Box(1392, 528, 48, 48),
    new Box(1008, 480, 48, 48),
    new Box(1104, 432, 48, 48),
    new Box(912, 360, 48, 48),
    new Box(1104, 312, 48, 48),
    new Box(1344, 360, 48, 48),
    new Box(960, 216, 48, 48),
    new Box(1200, 168, 48, 48),
    new Box(1440, 240, 48, 48),
    new Box(1584, 528, 48, 48),
    new Box(1584, 480, 48, 48),
    
    // === SECTION 3 (1600-2016) ===
    new Box(1680, 528, 48, 48),
    new Box(1920, 528, 48, 48),
    new Box(1776, 432, 48, 48),
    new Box(1920, 384, 48, 48),
    new Box(1776, 312, 48, 48),
    new Box(1968, 264, 48, 48),
    new Box(1824, 168, 48, 48),
    new Box(1968, 120, 48, 48),
    new Box(1968, 528, 48, 48),
    new Box(1968, 480, 48, 48),
    new Box(1968, 432, 48, 48),
];

// Event Loop
let last = performance.now();
function loop (now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    ctx.clearRect(0, 0, W, H);
    
    // Update camera to follow player
    camera.update(player.pos.x, player.pos.y);
    
    // Update goal
    goal.update(dt, player);
    
    // Check if player reached the goal
    if (goal.checkCollision(player)) {
        const counts = goal.saveToLocalStorage(player);
        window.location.href = '../html/jogo_ml5.html';
    }
    
    // Apply camera transform
    ctx.save();
    camera.apply(ctx);

    platforms.forEach(p => {
        p.update(dt);
        p.render(ctx);
    });
    
    // Render goal
    goal.render(ctx);
    
    residuos.forEach(r => {
        r.update(dt);
        r.render(ctx);
    });
    boxes.forEach(b => {
        b.update(dt, platforms, boxes);
        b.render(ctx, residuos); // Pass residuos for glow effect
    });
    player.update(dt, keys, platforms, residuos, boxes);
    player.render(ctx);
    
    // Restore camera transform (world space ends)
    ctx.restore();

    // === DEBUG RENDERING (Screen space) ===
    if (DEBUG_MODE) {
        // Re-apply camera for world-space debug rendering
        ctx.save();
        camera.apply(ctx);
        
        ctx.lineWidth = 2;
        
        // Draw platform hitboxes (green)
        ctx.strokeStyle = '#00FF00';
        platforms.forEach(p => {
            const aabb = p.getAABB();
            ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
            // Label platform type
            ctx.fillStyle = '#00FF00';
            ctx.font = '10px monospace';
            ctx.fillText(p.type, aabb.x + 2, aabb.y + 10);
        });
        
        // Draw box hitboxes (yellow)
        ctx.strokeStyle = '#FFFF00';
        boxes.forEach(b => {
            const aabb = b.getAABB();
            ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
        });
        
        // Draw residuo hitboxes (cyan) with type labels
        ctx.strokeStyle = '#00FFFF';
        residuos.forEach(r => {
            if (!r.collected || r.popUpTimer < r.popUpDuration) {
                const aabb = r.getAABB();
                ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
                // Label residuo type
                ctx.fillStyle = r.type.color;
                ctx.font = '8px monospace';
                ctx.fillText(r.type.name.substring(0, 4), aabb.x + 2, aabb.y + 10);
            }
        });
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
            ctx.moveTo(0, y-24);
            ctx.lineTo(camera.worldWidth, y-24);
            ctx.stroke();
        }
        ctx.lineWidth = 2;
        
        // Draw player hitbox (red)
        ctx.strokeStyle = '#FF0000';
        const playerHB = player.getHitbox();
        ctx.strokeRect(playerHB.x, playerHB.y, playerHB.w, playerHB.h);
        
        // Draw goal hitbox (magenta)
        ctx.strokeStyle = goal.isActive ? '#FF00FF' : '#663366';
        const goalAABB = goal.getAABB();
        ctx.strokeRect(goalAABB.x, goalAABB.y, goalAABB.w, goalAABB.h);
        ctx.fillStyle = goal.isActive ? '#FF00FF' : '#663366';
        ctx.font = '10px monospace';
        ctx.fillText('GOAL', goalAABB.x + 2, goalAABB.y + 10);
        
        // Draw player center point
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(player.pos.x - 2, player.pos.y - 2, 4, 4);
        
        // Draw ground line
        ctx.strokeStyle = '#FF00FF';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(W, 600);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore(); // End world-space debug rendering
        
        // Screen-space debug info (fixed to screen)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.fillText(`DEBUG MODE (Press 'D' to toggle)`, 10, 20);
        ctx.fillText(`Grid: ${GRID_COLS}x${GRID_ROWS} (${GRID_SIZE}px cells)`, 10, 35);
        ctx.fillText(`Player Pos: (${Math.round(player.pos.x)}, ${Math.round(player.pos.y)}) Grid: (${Math.floor(player.pos.x/GRID_SIZE)}, ${Math.floor(player.pos.y/GRID_SIZE)})`, 10, 50);
        ctx.fillText(`Player Vel: (${Math.round(player.vel.x)}, ${Math.round(player.vel.y)})`, 10, 65);
        ctx.fillText(`On Ground: ${player.onGround}`, 10, 80);
        
        // Count residuos by type
        const typeCounts = player.getResiduoCounts();
        const totalCollected = typeCounts.papel + typeCounts.vidro + typeCounts.plastico + typeCounts.lixo;
        ctx.fillText(`Collected: ${totalCollected}/${residuos.length}`, 10, 95);
        ctx.fillText(`  Papel: ${typeCounts.papel} Vidro: ${typeCounts.vidro}`, 10, 110);
        ctx.fillText(`  Plástico: ${typeCounts.plastico} Lixo: ${typeCounts.lixo}`, 10, 125);
        ctx.fillText(`Camera X: ${Math.round(camera.x)}`, 10, 140);
        ctx.fillText(`Goal Active: ${goal.isActive}`, 10, 155);
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Reding Inputs
document.onkeyup = (e) => {
    if(e.key in keys){
        e.preventDefault();
        keys[e.key] = false;
    }
}
document.onkeydown = (e) => {
    if(e.key in keys){
        e.preventDefault();
        // Toggle debug mode with 'd' key
        if(e.key === 'd') {
            DEBUG_MODE = !DEBUG_MODE;
            console.log('DEBUG_MODE:', DEBUG_MODE);
        }
        keys[e.key] = true;
    }
}