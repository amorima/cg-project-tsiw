import Platform from './Classes/Platform.js';
import Player from './Classes/Player.js';

// Canvas Elements
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const keys = {'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false,' ':false, 'x':false, 'z':false};

// Game Creation
const player = new Player();
await player.loadSprite('../assets/img/Player.png');

const platforms = [
    new Platform(50,550, 200 ,8 , {vx:20, maxX:200, minX: 25})
];
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
    player.update(dt, keys, platforms);
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