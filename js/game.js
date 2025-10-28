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

// Game Creation
const player = new Player();
await player.loadSprite('../assets/img/Player.png');

// Load tileset for platforms and boxes
const tileset = new Image();
tileset.src = '../assets/img/Ground.png'; // Update path as needed
Platform.setTileset(tileset);
Box.setTileset(tileset);

const platforms = [
    new Platform(110,550, 200 ,8 , {vx:20, maxX:200, minX: 25}),
    new Platform(600,550, 200 ,8 , {type: 'oneway'}),
    new Platform(400,550, 200 ,800)
];
const residuos = [
    new Residuo(50, 500, 30, 30)
];
const boxes = [
    new Box(300, 400, 40, 40),
    new Box(450, 500, 40, 40)
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
    boxes.forEach(b => {
        b.update(dt, platforms, boxes);
        b.render(ctx);
    });
    residuos.forEach(r => {
        if (!r.collected) r.render(ctx);
    });
    player.update(dt, keys, platforms, residuos, boxes);
    player.render(ctx);

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
        keys[e.key] = true;
    }
}