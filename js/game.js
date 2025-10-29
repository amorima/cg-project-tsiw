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

// === DEBUG MODE ===
let DEBUG_MODE = false;
keys['d'] = false; // Toggle debug with 'd' key

// Game Creation
const player = new Player();
await player.loadSprite('../assets/img/Player.png');

// Load tileset for platforms and boxes
const tileset = new Image();
tileset.src = '../assets/img/Ground.png'; // Update path as needed
Platform.setTileset(tileset);
Box.setTileset(tileset);

// Enhanced Game Scene - Level 1: "The Recycling Facility"
const platforms = [
    // === GROUND LAYER ===
    new Platform(0, 552, 336, 48),              // Left ground section
    new Platform(480, 552, 320, 48),            // Right ground section
    
    // === LOWER PLATFORMS (easy access) ===
    new Platform(120, 456, 144, 48),            // Left lower step
    new Platform(560, 456, 144, 48),            // Right lower step
    
    // === MID PLATFORMS (medium challenge) ===
    new Platform(0, 360, 96, 48),               // Left wall platform
    new Platform(240, 384, 192, 48),            // Center mid platform
    new Platform(528, 336, 144, 48),            // Right mid platform
    new Platform(704, 408, 96, 48),             // Far right platform
    
    // === HIGH PLATFORMS (harder to reach) ===
    new Platform(96, 264, 144, 48),             // Left high platform
    new Platform(432, 240, 192, 48),            // Center high platform
    new Platform(672, 288, 128, 48),            // Right high platform
    
    // === MOVING PLATFORM (timing challenge) ===
    new Platform(288, 168, 96, 48, {vx: 80, maxX: 480, minX: 96}),
    
    // === ONE-WAY PLATFORMS (advanced mechanics) ===
    new Platform(144, 120, 144, 48, {type: 'oneway'}),  // Top left secret
    new Platform(480, 144, 144, 48, {type: 'oneway'}),  // Top center
    new Platform(336, 480, 96, 48, {type: 'oneway'}),   // Gap bridge
    
    // === VERTICAL STRUCTURES ===
    new Platform(0, 168, 48, 192),              // Left wall
    new Platform(752, 336, 48, 216),            // Right wall tower
];

const residuos = [
    // === GROUND COLLECTIBLES (Tutorial area) ===
    new Residuo(48, 524, 24, 24),               // Starting area
    new Residuo(280, 524, 24, 24),              // Before gap
    new Residuo(520, 524, 24, 24),              // After gap
    new Residuo(700, 524, 24, 24),              // Far right
    
    // === LOWER PLATFORM REWARDS ===
    new Residuo(170, 428, 24, 24),              // Left lower
    new Residuo(620, 428, 24, 24),              // Right lower
    
    // === MID LEVEL COLLECTIBLES ===
    new Residuo(30, 332, 24, 24),               // Wall platform
    new Residuo(315, 356, 24, 24),              // Center mid
    new Residuo(590, 308, 24, 24),              // Right mid
    new Residuo(740, 380, 24, 24),              // Tower platform
    
    // === HIGH LEVEL REWARDS ===
    new Residuo(150, 236, 24, 24),              // Left high
    new Residuo(510, 212, 24, 24),              // Center high
    new Residuo(720, 260, 24, 24),              // Right high
    
    // === BONUS COLLECTIBLES (hard to reach) ===
    new Residuo(200, 92, 24, 24),               // Top one-way left
    new Residuo(540, 116, 24, 24),              // Top one-way center
    new Residuo(380, 140, 24, 24),              // Moving platform (timed!)
    
    // === SECRET COLLECTIBLES ===
    new Residuo(390, 452, 24, 24),              // Under one-way bridge
    new Residuo(24, 140, 24, 24),               // In wall gap
];

const boxes = [
    // === GROUND BOXES (Basic pushing practice) ===
    new Box(160, 528, 48, 48),                  // Left ground
    new Box(380, 528, 48, 48),                  // Center ground
    new Box(640, 528, 48, 48),                  // Right ground
    
    // === PUZZLE BOXES (Create paths) ===
    new Box(200, 432, 48, 48),                  // Can push to reach mid platform
    new Box(600, 432, 48, 48),                  // Create stepping stone
    
    // === STACKED BOXES (Climbing challenge) ===
    new Box(680, 312, 48, 48),                  // Right mid base
    new Box(680, 264, 48, 48),                  // Stacked box 1
    
    // === ELEVATED BOXES (Advanced puzzles) ===
    new Box(300, 360, 48, 48),                  // Center mid platform
    new Box(130, 240, 48, 48),                  // Left high platform
    new Box(500, 216, 48, 48),                  // Center high platform
    
    // === TOWER BOXES (Vertical challenge) ===
    new Box(776, 528, 48, 48),                  // Tower base
    new Box(776, 480, 48, 48),                  // Tower level 2
    new Box(776, 432, 48, 48),                  // Tower level 3
]
// Event Loop
let last = performance.now();
function loop (now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    ctx.clearRect(0, 0, W, H);

    platforms.forEach(p => {
        p.update(dt);
        p.render(ctx);
    });
    residuos.forEach(r => {
        if (!r.collected) r.render(ctx);
    });
    boxes.forEach(b => {
        b.update(dt, platforms, boxes);
        b.render(ctx);
    });
    player.update(dt, keys, platforms, residuos, boxes);
    player.render(ctx);

    // === DEBUG RENDERING ===
    if (DEBUG_MODE) {
        ctx.save();
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
        
        // Draw residuo hitboxes (cyan)
        ctx.strokeStyle = '#00FFFF';
        residuos.forEach(r => {
            if (!r.collected) {
                const aabb = r.getAABB();
                ctx.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
            }
        });
        
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
        
        // Debug info text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.fillText(`DEBUG MODE (Press 'D' to toggle)`, 10, 20);
        ctx.fillText(`Player Pos: (${Math.round(player.pos.x)}, ${Math.round(player.pos.y)})`, 10, 35);
        ctx.fillText(`Player Vel: (${Math.round(player.vel.x)}, ${Math.round(player.vel.y)})`, 10, 50);
        ctx.fillText(`On Ground: ${player.onGround}`, 10, 65);
        ctx.fillText(`Collected: ${player.colected.length}`, 10, 80);
        
        ctx.restore();
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