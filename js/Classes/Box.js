import Vector from './Vector.js';
const GRAVITY = 1200, DRAG = 8.0, GROUND_Y = 600;
export default class Box {
    static GRID_SIZE = 48; // Grid cell size in pixels
    
    constructor(gridX = 0, gridY = 0, gridW = 1, gridH = 1) {
        // Convert grid coordinates to pixels
        this.pos = new Vector(gridX * Box.GRID_SIZE, gridY * Box.GRID_SIZE);
        this.vel = new Vector(0, 0);
        this.width = gridW * Box.GRID_SIZE;
        this.height = gridH * Box.GRID_SIZE;
        this.onGround = false;
        this.beingPushed = false;
        this.tileSize = 16;
    }

    static setTileset(image) {
        Box.sharedTileset = image;
    }

    update(dt, platforms = [], boxes = []) {
        if (!dt) return;
        this.onGround = false;
        this.beingPushed = false;

        this.vel.y += GRAVITY * dt;
        this.vel.x *= Math.max(0, 1 - DRAG * dt);
        this.pos.add({ x: this.vel.x * dt, y: this.vel.y * dt });

        const halfH = this.height / 2;
        if (this.pos.y + halfH >= GROUND_Y) {
            this.pos.y = GROUND_Y - halfH;
            this.vel.y = 0;
            this.onGround = true;
        }

        platforms.forEach(p => this.resolvePlatformCollision(p, dt));
        boxes.forEach(b => { if (b !== this) this.resolveBoxCollision(b); });
    }

    resolvePlatformCollision(platform, dt) {
        const hb = this.getAABB();
        const p = platform.getAABB ? platform.getAABB() : platform;
        if (!(hb.x < p.x + p.w && hb.x + hb.w > p.x && hb.y < p.y + p.h && hb.y + hb.h > p.y)) return;

        const oL = hb.x + hb.w - p.x, oR = p.x + p.w - hb.x;
        const oT = hb.y + hb.h - p.y, oB = p.y + p.h - hb.y;
        const oX = Math.min(oL, oR), oY = Math.min(oT, oB);

        if (oX < oY) {
            this.pos.x += oL < oR ? -oL : oR;
            this.vel.x = 0;
        } else {
            this.pos.y += oT < oB ? -oT : oB;
            this.vel.y = 0;
            if (oT < oB) {
                this.onGround = true;
                // Move with platform
                if (platform.vx) this.pos.x += platform.vx * dt;
                if (platform.vy) this.pos.y += platform.vy * dt;
            }
        }
    }

    resolveBoxCollision(box) {
        const hb = this.getAABB();
        const b = box.getAABB();
        if (!(hb.x < b.x + b.w && hb.x + hb.w > b.x && hb.y < b.y + b.h && hb.y + hb.h > b.y)) return;

        const oL = hb.x + hb.w - b.x, oR = b.x + b.w - hb.x;
        const oT = hb.y + hb.h - b.y, oB = b.y + b.h - hb.y;
        const oX = Math.min(oL, oR), oY = Math.min(oT, oB);

        if (oX < oY) {
            const push = oL < oR ? -oX / 2 : oX / 2;
            this.pos.x += push;
            box.pos.x -= push;
            // Transfer momentum
            const avgVel = (this.vel.x + box.vel.x) / 2;
            this.vel.x = avgVel;
            box.vel.x = avgVel;
        } else {
            if (oT < oB) {
                this.pos.y -= oY;
                this.vel.y = 0;
                this.onGround = true;
            } else {
                this.pos.y += oY;
                this.vel.y = 0;
            }
        }
    }

    push(forceX) {
        if (this.onGround) {
            this.vel.x += forceX;
            this.beingPushed = true;
        }
    }

    getAABB() {
        return { x: this.pos.x - this.width / 2, y: this.pos.y - this.height / 2, w: this.width, h: this.height };
    }

    render(ctx, residuos = []) {
        const tileset = Box.sharedTileset;
        const { x, y, w, h } = this.getAABB();

        // Check if any uncollected residuos are behind this box (overlapping position)
        let hasResiduoBehind = false;
        if (residuos && residuos.length) {
            for (const r of residuos) {
                if (!r.collected) {
                    const rAABB = r.getAABB();
                    // Check if residuo overlaps with box
                    if (!(rAABB.x + rAABB.w < x || rAABB.x > x + w || 
                          rAABB.y + rAABB.h < y || rAABB.y > y + h)) {
                        hasResiduoBehind = true;
                        break;
                    }
                }
            }
        }

        ctx.save();

        // Apply glow effect if residuo is behind
        if (hasResiduoBehind) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700'; // Gold glow
        }

        if (!tileset) {
            // Fallback to colored rectangle
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(x, y, w, h);
            ctx.restore();
            return;
        }

        ctx.imageSmoothingEnabled = false;
        const ts = this.tileSize;
        // Tile 8 of row 4 = index 7 + (3 * 16) = 55
        const tileIndex = 55;
        const sx = (tileIndex % 16) * ts;
        const sy = Math.floor(tileIndex / 16) * ts;

        // Draw single tile scaled to box size
        ctx.drawImage(tileset, sx, sy, ts, ts, x, y, w, h);
        
        ctx.restore();
    }
}