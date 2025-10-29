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
        this.sourceTileSize = 16;
        this.displayTileSize = 48;
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
        const srcSize = this.sourceTileSize;
        const dstSize = this.displayTileSize;
        const tilesX = Math.ceil(this.w / dstSize);
        const tilesY = Math.ceil(this.h / dstSize);

        if (this.type === 'oneway') {
            // Semi-solid platforms: use top-left 8x8 of tile 10, tiled 2x1 per display tile
            const tileIndex = 9; // Tile 10 (index 9)
            const sx = (tileIndex % 16) * srcSize;
            const sy = Math.floor(tileIndex / 16) * srcSize;
            
            for (let i = 0; i < tilesX; i++) {
                // Draw two 8x8 tiles side by side in the top row only
                ctx.drawImage(tileset, sx, sy, 8, 8, this.x + i * dstSize, this.y, 24, 24);
                ctx.drawImage(tileset, sx, sy, 8, 8, this.x + i * dstSize + 24, this.y, 24, 24);
            }
        } else {
            // Solid platforms: tile 0 (row 1) for top, tile 16 (row 2) for fill
            for (let j = 0; j < tilesY; j++) {
                for (let i = 0; i < tilesX; i++) {
                    const sy = j === 0 ? 0 : srcSize;
                    ctx.drawImage(tileset, 0, sy, srcSize, srcSize, this.x + i * dstSize, this.y + j * dstSize, dstSize, dstSize);
                }
            }
        }
    }
}