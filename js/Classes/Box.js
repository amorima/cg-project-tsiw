import Vector from './Vector.js';
const GRAVITY = 1200, DRAG = 6.0, GROUND_Y = 600;
export default class Box {
    constructor(x = 0, y = 0, width = 40, height = 40) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.width = width;
        this.height = height;
        this.onGround = false;
        this.beingPushed = false;
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

    render(ctx, color = '#D2691E') {
        const { x, y, w, h } = this.getAABB();
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
}