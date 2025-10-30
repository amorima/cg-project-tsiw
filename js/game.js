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

const player = new Player(2, 10.5); // Grid coordinates: x=2, y=10.5 -> pixels: x=96, y=504
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
    new Platform(0, 11.5, 8, 0.83),
    new Platform(9, 11.5, 8, 0.83),
    
    // Lower platforms
    new Platform(3, 9.5, 3, 0.83),
    new Platform(11, 9.5, 4, 0.83),
    
    // Mid platforms
    new Platform(0, 7.5, 2, 0.83),
    new Platform(5, 7.5, 4, 0.83),
    new Platform(11, 7.5, 3, 0.83),
    new Platform(15, 8.5, 2, 0.83),
    
    // High platforms
    new Platform(2, 5.5, 3, 0.83),
    new Platform(9, 5.5, 4, 0.83),
    new Platform(14, 6.5, 3, 0.83),
    
    // Moving platform
    new Platform(6, 3.5, 2, 0.83, {vx: 80, maxGridX: 10, minGridX: 2}),
    
    // One-way platforms
    new Platform(3, 2.5, 3, 0.5, {type: 'oneway'}),
    new Platform(10, 2.5, 3, 0.5, {type: 'oneway'}),
    new Platform(7, 9.5, 2, 0.5, {type: 'oneway'}),
    
    // Walls
    new Platform(0, 12.5, 1, 5),
    new Platform(16, 7.5, 1, 5),
    
    // === SECTION 2: MIDDLE AREA (800-1600) ===
    // Ground continuation
    new Platform(17, 11.5, 8, 0.83),
    new Platform(26, 11.5, 7, 0.83),
    
    // Staircase section
    new Platform(18, 10.5, 2, 0.83),
    new Platform(20, 9.5, 2, 0.83),
    new Platform(22, 8.5, 2, 0.83),
    new Platform(24, 7.5, 2, 0.83),
    
    // Mid platforms
    new Platform(17, 8.5, 3, 0.83),
    new Platform(21, 7.5, 4, 0.83),
    new Platform(27, 8.5, 3, 0.83),
    new Platform(31, 9.5, 2, 0.83),
    
    // High platforms
    new Platform(18, 5.5, 3, 0.83),
    new Platform(23, 4.5, 4, 0.83),
    new Platform(29, 5.5, 3, 0.83),
    
    // Moving platform
    new Platform(25, 3.5, 2, 0.83, {vx: 60, maxGridX: 29, minGridX: 21}),
    
    // One-way platforms
    new Platform(19, 2.5, 3, 0.5, {type: 'oneway'}),
    new Platform(26, 2.5, 3, 0.5, {type: 'oneway'}),
    new Platform(30, 10.5, 2, 0.5, {type: 'oneway'}),
    
    // Tower
    new Platform(33, 7.5, 1, 5),
    
    // === SECTION 3: END AREA (1600-2016) ===
    // Ground
    new Platform(34, 11.5, 8, 0.83),
    
    // Challenge platforms (gaps)
    new Platform(35, 9.5, 2, 0.83),
    new Platform(38, 8.5, 2, 0.83),
    new Platform(41, 7.5, 1, 0.83),
    
    // Final area platforms
    new Platform(35, 7.5, 4, 0.83),
    new Platform(40, 6.5, 2, 0.83),
    
    // High secret area
    new Platform(37, 4.5, 3, 0.83),
    new Platform(41, 3.5, 1, 0.83),
    
    // Moving platform
    new Platform(39, 3.5, 2, 0.83, {vx: 70, maxGridX: 41, minGridX: 35}),
    
    // One-way platforms
    new Platform(36, 2.5, 3, 0.5, {type: 'oneway'}),
    new Platform(40, 1.5, 2, 0.5, {type: 'oneway'}),
    new Platform(35, 9.5, 3, 0.5, {type: 'oneway'}),
    
    // End wall
    new Platform(41, 5.5, 1, 7),
];

// === RESIDUO SPAWN SYSTEM ===

// 80 possible residuo positions in grid coordinates (chosen to not overlap with platforms)
const possibleResiduoPositions = [
    // Section 1 (0-800) - 30 positions
    { x: 1, y: 10.8 }, { x: 2, y: 10.8 }, { x: 4.2, y: 10.8 }, { x: 5.2, y: 10.8 },
    { x: 6.2, y: 10.8 }, { x: 7.3, y: 10.8 }, { x: 10.4, y: 10.8 }, { x: 11.5, y: 10.8 },
    { x: 13.5, y: 10.8 }, { x: 14.6, y: 10.8 }, { x: 2.1, y: 8.75 }, { x: 4.2, y: 8.75 },
    { x: 5.2, y: 8.75 }, { x: 11.5, y: 8.75 }, { x: 13.5, y: 8.75 }, { x: 1, y: 6.9 },
    { x: 5.4, y: 6.9 }, { x: 7.3, y: 6.9 }, { x: 11.5, y: 6.25 }, { x: 12.5, y: 6.25 },
    { x: 14.6, y: 5.2 }, { x: 15.6, y: 5.2 }, { x: 2.5, y: 4.8 }, { x: 3.75, y: 4.8 },
    { x: 9.4, y: 4.4 }, { x: 10.8, y: 4.4 }, { x: 14.6, y: 7.9 }, { x: 7.5, y: 10 },
    { x: 10, y: 6.9 }, { x: 12.9, y: 7.9 },
    
    // Section 2 (800-1600) - 30 positions
    { x: 17.7, y: 10.8 }, { x: 18.75, y: 10.8 }, { x: 19.8, y: 10.8 }, { x: 21.9, y: 10.8 },
    { x: 22.9, y: 10.8 }, { x: 25, y: 10.8 }, { x: 26.5, y: 10.8 }, { x: 27.5, y: 10.8 },
    { x: 28.75, y: 10.8 }, { x: 30.2, y: 10.8 }, { x: 31.7, y: 10.8 }, { x: 18.75, y: 9.8 },
    { x: 20.8, y: 9.8 }, { x: 30.2, y: 9.8 }, { x: 20.8, y: 8.75 }, { x: 30.2, y: 8.3 },
    { x: 22.5, y: 7.7 }, { x: 24.6, y: 7.7 }, { x: 17.7, y: 7.3 }, { x: 19.4, y: 7.3 },
    { x: 21.5, y: 6.25 }, { x: 23.5, y: 6.25 }, { x: 24.6, y: 6.25 }, { x: 27.5, y: 7.3 },
    { x: 28.75, y: 7.3 }, { x: 29.6, y: 7.3 }, { x: 18.5, y: 4.4 }, { x: 19.8, y: 4.4 },
    { x: 23.5, y: 3.3 }, { x: 25, y: 3.3 },
    
    // Section 3 (1600-2016) - 20 positions
    { x: 34.4, y: 10.8 }, { x: 35.4, y: 10.8 }, { x: 37.5, y: 10.8 }, { x: 39, y: 10.8 },
    { x: 40.2, y: 10.8 }, { x: 35.4, y: 8.75 }, { x: 36.5, y: 8.75 }, { x: 38.5, y: 9.8 },
    { x: 39.6, y: 9.8 }, { x: 35.4, y: 6.25 }, { x: 37.5, y: 6.25 }, { x: 35.4, y: 7.9 },
    { x: 36, y: 6.25 }, { x: 38.5, y: 7.9 }, { x: 40.2, y: 6.9 }, { x: 37.5, y: 5.2 },
    { x: 38.5, y: 5.2 }, { x: 40.2, y: 5.2 }, { x: 37.5, y: 3.3 }, { x: 39.6, y: 3.3 }
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
console.log(`Spawned ${residuos.length} residuos`);

// Create Goal at the start of the level
const goal = new Goal(0, 10, 1, 1.5); // Grid: x=0, y=10, w=1, h=1.5 -> pixels: x=0, y=480, w=48, h=72

const boxes = [
    // === SECTION 1 (0-800) ===
    new Box(3, 11, 1, 1),
    new Box(8, 11, 1, 1),
    new Box(13, 11, 1, 1),
    new Box(4, 9, 1, 1),
    new Box(13, 9, 1, 1),
    new Box(14, 6.5, 1, 1),
    new Box(14, 5.5, 1, 1),
    new Box(6, 7, 1, 1),
    new Box(3, 5, 1, 1),
    new Box(10, 4.5, 1, 1),
    new Box(16, 11, 1, 1),
    new Box(16, 10, 1, 1),
    new Box(16, 9, 1, 1),
    
    // === SECTION 2 (800-1600) ===
    new Box(18, 11, 1, 1),
    new Box(24, 11, 1, 1),
    new Box(29, 11, 1, 1),
    new Box(21, 10, 1, 1),
    new Box(23, 9, 1, 1),
    new Box(19, 7.5, 1, 1),
    new Box(23, 6.5, 1, 1),
    new Box(28, 7.5, 1, 1),
    new Box(20, 4.5, 1, 1),
    new Box(25, 3.5, 1, 1),
    new Box(30, 5, 1, 1),
    new Box(33, 11, 1, 1),
    new Box(33, 10, 1, 1),
    
    // === SECTION 3 (1600-2016) ===
    new Box(35, 11, 1, 1),
    new Box(40, 11, 1, 1),
    new Box(37, 9, 1, 1),
    new Box(40, 8, 1, 1),
    new Box(37, 6.5, 1, 1),
    new Box(41, 5.5, 1, 1),
    new Box(38, 3.5, 1, 1),
    new Box(41, 2.5, 1, 1),
    new Box(41, 11, 1, 1),
    new Box(41, 10, 1, 1),
    new Box(41, 9, 1, 1),
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