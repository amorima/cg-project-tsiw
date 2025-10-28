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
        this.tileSize = 16;
        this.tileset = null;
    }

    static setTileset(image) {
        Platform.sharedTileset = image;
    }

    update(dt) {
        if (!dt) return;
        
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

    render(ctx) {
        const tileset = Platform.sharedTileset;
        if (!tileset) {
            // Fallback to colored rectangles
            ctx.fillStyle = this.type === 'oneway' ? 'rgba(139, 69, 19, 0.5)' : '#8B4513';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            return;
        }

        ctx.imageSmoothingEnabled = false;
        const ts = this.tileSize;
        const tilesX = Math.ceil(this.w / ts);
        const tilesY = Math.ceil(this.h / ts);

        if (this.type === 'oneway') {
            // Semi-solid platforms: tiles 10-12 of row 1 (indices 9-11)
            for (let i = 0; i < tilesX; i++) {
                const tileIndex = i === 0 ? 9 : (i === tilesX - 1 ? 11 : 10);
                const sx = (tileIndex % 16) * ts;
                const sy = Math.floor(tileIndex / 16) * ts;
                ctx.drawImage(tileset, sx, sy, ts, ts, this.x + i * ts, this.y, ts, ts);
            }
        } else {
            // Solid platforms: tile 0 (row 1) for top, tile 16 (row 2) for fill
            for (let j = 0; j < tilesY; j++) {
                for (let i = 0; i < tilesX; i++) {
                    if (j === 0) {
                        // Top layer: first tile of row 1
                        ctx.drawImage(tileset, 0, 0, ts, ts, this.x + i * ts, this.y + j * ts, ts, ts);
                    } else {
                        // Fill layers: first tile of row 2
                        ctx.drawImage(tileset, 0, ts, ts, ts, this.x + i * ts, this.y + j * ts, ts, ts);
                    }
                }
            }
        }
    }
}