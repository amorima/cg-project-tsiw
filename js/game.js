import Platform from './Classes/Platform.js';
import Player from './Classes/Player.js';
import Residuo from './Classes/Residuos.js';
import Box from './Classes/Box.js';

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
 // 96x96 grid for easier platform alignment

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
// Player starts at grid-aligned position (96 = 4 grid cells, 504 = 21 grid cells)
const player = new Player(96, 504);
await player.loadAudio('../assets/audio/jump.wav', 'jump');
await player.loadAudio('../assets/audio/power_up.wav', 'power_up');
await player.loadSprite('../assets/img/Player.png');

// Load tileset for platforms and boxes
const tileset = new Image();
tileset.src = '../assets/img/Ground.png'; // Update path as needed
Platform.setTileset(tileset);
Box.setTileset(tileset);

// Enhanced Game Scene - Level 1: "The Recycling Facility" (Extended)
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

const residuos = [
    // === SECTION 1 (0-800) ===
    new Residuo(48, 528, 24, 24, 'PLASTIC'),
    new Residuo(288, 528, 24, 24, 'PAPER'),
    new Residuo(528, 528, 24, 24, 'GLASS'),
    new Residuo(696, 528, 24, 24, 'INDEFERENCIADO'),
    new Residuo(168, 432, 24, 24, 'PLASTIC'),
    new Residuo(624, 432, 24, 24, 'PAPER'),
    new Residuo(24, 336, 24, 24, 'GLASS'),
    new Residuo(312, 360, 24, 24, 'INDEFERENCIADO'),
    new Residuo(600, 312, 24, 24, 'PLASTIC'),
    new Residuo(744, 384, 24, 24, 'PAPER'),
    new Residuo(144, 240, 24, 24, 'GLASS'),
    new Residuo(504, 216, 24, 24, 'INDEFERENCIADO'),
    new Residuo(720, 264, 24, 24, 'PLASTIC'),
    new Residuo(192, 96, 24, 24, 'PAPER'),
    new Residuo(528, 120, 24, 24, 'GLASS'),
    new Residuo(384, 144, 24, 24, 'INDEFERENCIADO'),
    new Residuo(384, 456, 24, 24, 'PLASTIC'),
    new Residuo(24, 144, 24, 24, 'PAPER'),
    
    // === SECTION 2 (800-1600) ===
    new Residuo(888, 528, 24, 24, 'GLASS'),
    new Residuo(1104, 528, 24, 24, 'INDEFERENCIADO'),
    new Residuo(1392, 528, 24, 24, 'PLASTIC'),
    new Residuo(888, 480, 24, 24, 'PAPER'),
    new Residuo(984, 432, 24, 24, 'GLASS'),
    new Residuo(1080, 384, 24, 24, 'INDEFERENCIADO'),
    new Residuo(1176, 336, 24, 24, 'PLASTIC'),
    new Residuo(888, 360, 24, 24, 'PAPER'),
    new Residuo(1104, 312, 24, 24, 'GLASS'),
    new Residuo(1368, 360, 24, 24, 'INDEFERENCIADO'),
    new Residuo(936, 216, 24, 24, 'PLASTIC'),
    new Residuo(1176, 168, 24, 24, 'PAPER'),
    new Residuo(1416, 240, 24, 24, 'GLASS'),
    new Residuo(984, 96, 24, 24, 'INDEFERENCIADO'),
    new Residuo(1296, 120, 24, 24, 'PLASTIC'),
    new Residuo(1248, 144, 24, 24, 'PAPER'),
    
    // === SECTION 3 (1600-2400) ===
    new Residuo(1704, 528, 24, 24, 'GLASS'),
    new Residuo(1896, 528, 24, 24, 'INDEFERENCIADO'),
    new Residuo(2088, 528, 24, 24, 'PLASTIC'),
    new Residuo(2304, 528, 24, 24, 'PAPER'),
    new Residuo(1680, 432, 24, 24, 'GLASS'),
    new Residuo(1848, 384, 24, 24, 'INDEFERENCIADO'),
    new Residuo(1992, 336, 24, 24, 'PLASTIC'),
    new Residuo(2136, 432, 24, 24, 'PAPER'),
    new Residuo(2304, 480, 24, 24, 'GLASS'),
    new Residuo(1752, 312, 24, 24, 'INDEFERENCIADO'),
    new Residuo(1992, 264, 24, 24, 'PLASTIC'),
    new Residuo(2184, 312, 24, 24, 'PAPER'),
    new Residuo(1800, 168, 24, 24, 'GLASS'),
    new Residuo(2064, 120, 24, 24, 'INDEFERENCIADO'),
    new Residuo(2304, 168, 24, 24, 'PLASTIC'),
    new Residuo(1776, 96, 24, 24, 'PAPER'),
    new Residuo(2088, 72, 24, 24, 'GLASS'),
    new Residuo(2184, 144, 24, 24, 'INDEFERENCIADO'),
];

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
    
    // Apply camera transform
    ctx.save();
    camera.apply(ctx);

    platforms.forEach(p => {
        p.update(dt);
        p.render(ctx);
    });
    residuos.forEach(r => {
        r.update(dt);
        r.render(ctx);
    });
    boxes.forEach(b => {
        b.update(dt, platforms, boxes);
        b.render(ctx);
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
        const typeCounts = { plastic: 0, paper: 0, glass: 0, indeferenciado: 0 };
        residuos.forEach(r => {
            if (r.collected && r.popUpTimer >= r.popUpDuration) {
                typeCounts[r.type.name]++;
            }
        });
        ctx.fillText(`Collected: ${player.colected.length}/${residuos.length}`, 10, 95);
        ctx.fillText(`  Plastic: ${typeCounts.plastic} Paper: ${typeCounts.paper}`, 10, 110);
        ctx.fillText(`  Glass: ${typeCounts.glass} Indeferenciado: ${typeCounts.indeferenciado}`, 10, 125);
        ctx.fillText(`Camera X: ${Math.round(camera.x)}`, 10, 140);
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