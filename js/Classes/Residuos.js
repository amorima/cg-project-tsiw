import Vector from './Vector.js';
export default class Residuos {
    constructor(x = 0, y = 0, width = 8, height = 8){
        this.pos = new Vector(x, y);
        this.w = width;
        this.h = height;
        this.collected = false;
    }

    getAABB() {
        return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
    }

    render(ctx, color = '#8B4513') {
        if (this.collected) return;
        ctx.fillStyle = color;
        ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
    }

    collect(){
        this.collected = true;
    }
}