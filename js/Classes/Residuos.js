import Vector from './Vector.js';

export default class Residuos {
    static TYPES = {
        PLASTIC: { name: 'plastic', color: '#FFD700' },      // Gold/Yellow
        PAPER: { name: 'paper', color: '#4169E1' },          // Royal Blue
        GLASS: { name: 'glass', color: '#32CD32' },          // Lime Green
        INDEFERENCIADO: { name: 'indeferenciado', color: '#808080' } // Gray
    };

    constructor(x = 0, y = 0, width = 24, height = 24, type = 'PLASTIC'){
        this.pos = new Vector(x, y);
        this.w = width;
        this.h = height;
        this.collected = false;
        this.type = Residuos.TYPES[type] || Residuos.TYPES.PLASTIC;
        
        // Pop-up animation properties
        this.popUpTimer = 0;
        this.popUpDuration = 0.6; // seconds
        this.popUpDistance = 40;   // pixels to move up
        this.originalY = y;
    }

    getAABB() {
        return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
    }

    update(dt) {
        if (this.collected && this.popUpTimer < this.popUpDuration) {
            this.popUpTimer += dt;
            // Move up and fade out
            const progress = this.popUpTimer / this.popUpDuration;
            this.pos.y = this.originalY - (this.popUpDistance * progress);
        }
    }

    render(ctx) {
        if (this.collected && this.popUpTimer >= this.popUpDuration) return;
        
        const alpha = this.collected ? (1 - (this.popUpTimer / this.popUpDuration)) : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        
        // Add a border for better visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        ctx.restore();
    }

    collect(){
        this.collected = true;
        this.popUpTimer = 0;
    }
}