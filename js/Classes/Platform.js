export default class Platform {
    constructor(x, y, w, h, { type = 'solid', vx = 0, vy = 0, minX = 0, maxX = 0, minY = 0, maxY = 0 } = {}) {
        this.x = x;
        this.y = y;
        this.w = Math.max(1, w);
        this.h = Math.max(1, h);
        this.type = type; // 'solid' | 'oneway'
        this.vx = vx;
        this.vy = vy;
        this.minX = minX || x;
        this.maxX = maxX || x;
        this.minY = minY || y;
        this.maxY = maxY || y;
    }

    update(dt) {
        if (!dt) return;
        
        // Reverse direction at boundaries
        if ((this.vx > 0 && this.x >= this.maxX) || (this.vx < 0 && this.x <= this.minX)) {
            this.vx = -this.vx;
        }
        if ((this.vy > 0 && this.y >= this.maxY) || (this.vy < 0 && this.y <= this.minY)) {
            this.vy = -this.vy;
        }
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    getAABB() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    isOneWay() {
        return this.type === 'oneway';
    }

    // ADDED: Essential for game.js rendering
    render(ctx, color = '#8B4513') {
        ctx.fillStyle = this.type === 'oneway' ? 'rgba(139, 69, 19, 0.5)' : color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}