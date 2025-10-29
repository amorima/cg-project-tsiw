// VECTOR IMPORT
import Vector from './Vector.js'

// ENVOREMENTAL VARIABLES
const DRAG = 6.0, GRAVITY = 1200, GROUND_Y = 600;

export default class Player {
    constructor(x = 50, y = 50, width = 32, height = 56, sprite = null) {
        // PLAYER MOVEMENT 
        this.pos = new Vector(x, y);
        this.prevPos = this.pos.clone();
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);

        // VISUAL
        this.sheet = { tileW: 24, tileH: 24, cols: 8, rows: 6, scale: 2.5, image: null, loaded: false };
        this.width = width || this.sheet.tileW * this.sheet.scale;
        this.height = height || this.sheet.tileH * this.sheet.scale;
        this.sprite = sprite;
        this.facing = 1;
        this.animations = {
            idle:  { frames: [0, 1],                    fps: 4,  loop: true  },
            walk:  { frames: [8,9,10,11],               fps: 8,  loop: true  },
            run:   { frames: [12,13,14,15],             fps: 12, loop: true  },
            push:  { frames: [16,17,18,19],             fps: 4,  loop: false  },
            jump:  { frames: [24,25,26,27,28,29,30,31], fps: 10, loop: false },
            sit:   { frames: [40,41],                   fps: 2,  loop: true  },
        };
        this.currentAnim = 'idle';
        this.frameIndex = 0;
        this.frameTimer = 0;

        // MOVEMENT CONFIG
        this.moveForce = 1500;
        this.maxSpeedX = 300;
        this.jumpImpulse = -500;
        this.onGround = false;
        this.isPushing = false;

        // INVENTORYS
        this.colected = []
    }

    loadSprite(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { this.sheet.image = img; this.sheet.loaded = true; resolve(img); };
            img.onerror = reject;
            img.src = src;
        });
    }

    setAnimation(name, reset = true) {
        if (this.currentAnim === name) return; // Don't restart same animation
        if (!this.animations[name]) return;
        this.currentAnim = name;
        if (reset) { this.frameIndex = 0; this.frameTimer = 0; }
    }

    update(dt, input = {}, platforms = [], residuos = [], boxes = []) {
        if (dt <= 0) return;
        this.prevPos.set(this.pos);
        const wasOnGround = this.onGround;
        this.onGround = false;
        this.isPushing = false;

        // handleInput + integrate merged
        const left = !!input['ArrowLeft'], right = !!input['ArrowRight'];
        const jump = !!input['ArrowUp'] || !!input[' '];
        const attack = !!input['x'] || !!input['z'];

        this.acc.x = (right ? this.moveForce : 0) - (left ? this.moveForce : 0);
        this.acc.y = GRAVITY;
        if (left) this.facing = -1;
        if (right) this.facing = 1;
        if (jump && wasOnGround) { this.vel.y = this.jumpImpulse; this.setAnimation('jump', true); }
        if (attack) this.setAnimation('attack', true);

        this.vel.x += this.acc.x * dt;
        this.vel.y += this.acc.y * dt;
        if (Math.abs(this.acc.x) < 1e-6) this.vel.x *= Math.max(0, 1 - Math.min(1, DRAG * dt));
        this.vel.x = Math.max(-this.maxSpeedX, Math.min(this.maxSpeedX, this.vel.x));
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // ground constraint inline
        const halfH = this.height / 2;
        if (this.pos.y + halfH >= GROUND_Y) {
            this.pos.y = GROUND_Y - halfH;
            this.vel.y = 0;
            this.onGround = true;
        }

        if (platforms && platforms.length) {
            for (const p of platforms) this.resolvePlatformCollision(p, dt);
        }
        if (boxes && boxes.length) {
            for (const b of boxes) this.resolveBoxCollision(b);
        }
        if(residuos && residuos.length){
            for (const r of residuos) this.itemColision(r);
        }

        // choose animation
        const anim = this.animations[this.currentAnim];
        const nonLoopingActive = anim && !anim.loop && this.frameIndex < anim.frames.length - 1;
        if (!nonLoopingActive) {
            // Priority: jump > push > run > walk > idle
            if (!this.onGround) {
                // Keep jump animation while in air
                if (this.currentAnim !== 'jump') this.setAnimation('jump', false);
            }
            else if (this.isPushing) this.setAnimation('push');
            else if (Math.abs(this.vel.x) > 100) this.setAnimation('run');
            else if (Math.abs(this.vel.x) > 10) this.setAnimation('walk');
            else this.setAnimation('idle');
        }

        this._updateAnimation(dt);
    }

    getHitbox() {
        return { x: this.pos.x - this.width / 2, y: this.pos.y - this.height / 2  + 10 , w: this.width, h: this.height -10 };
    }

    resolvePlatformCollision(platform, dt) {
        const hb = this.getHitbox();
        const p = platform.getAABB ? platform.getAABB() : { x: platform.x, y: platform.y, w: platform.w, h: platform.h };
        if (!(hb.x < p.x + p.w && hb.x + hb.w > p.x && hb.y < p.y + p.h && hb.y + hb.h > p.y)) return;

        if (platform.isOneWay && platform.isOneWay()) {
            if (!(this.prevPos.y + this.height / 2 <= p.y && this.vel.y >= 0)) return;
        }

        const oR = p.x + p.w - hb.x, oL = hb.x + hb.w - p.x, oB = p.y + p.h - hb.y, oT = hb.y + hb.h - p.y;
        const oX = Math.min(oL, oR), oY = Math.min(oT, oB);

        if (platform.vx) this.pos.x += platform.vx * dt;
        if (platform.vy) this.pos.y += platform.vy * dt;

        if (oX < oY) {
            this.pos.x = oL < oR ? p.x - this.width / 2 : p.x + p.w + this.width / 2;
            this.vel.x = 0;
        } else {
            if (oT < oB) { this.pos.y = p.y - this.height / 2; this.vel.y = 0; this.onGround = true; }
            else { this.pos.y = p.y + p.h + this.height / 2; this.vel.y = 0; }
        }
    }

    resolveBoxCollision(box) {
        const hb = this.getHitbox();
        const b = box.getAABB();
        if (!(hb.x < b.x + b.w && hb.x + hb.w > b.x && hb.y < b.y + b.h && hb.y + hb.h > b.y)) return;

        const oL = hb.x + hb.w - b.x, oR = b.x + b.w - hb.x;
        const oT = hb.y + hb.h - b.y, oB = b.y + b.h - hb.y;
        const oX = Math.min(oL, oR), oY = Math.min(oT, oB);

        if (oX < oY) {
            // Horizontal collision - player is pushing
            const pushForce = this.vel.x * 0.5;
            if (Math.abs(pushForce) > 10) {
                this.isPushing = true;
            }
            box.push(pushForce);
            this.pos.x += oL < oR ? -oL : oR;
            this.vel.x *= 0.3;
        } else {
            this.pos.y += oT < oB ? -oT : oB;
            this.vel.y = 0;
            if (oT < oB) this.onGround = true;
        }
    }

    itemColision(item){
        if (item.collected) return;
        const hb = this.getHitbox();
        const i = item.getAABB();
        if (!(hb.x < i.x + i.w && hb.x + hb.w > i.x && hb.y < i.y + i.h && hb.y + hb.h > i.y)) return;
        item.collect();
        this.colected.push({...item});
    }

    _updateAnimation(dt) {
        const anim = this.animations[this.currentAnim];
        if (!anim || !anim.frames.length) return;
        const frameDuration = 1 / (anim.fps || 10);
        this.frameTimer += dt;
        while (this.frameTimer >= frameDuration) {
            this.frameTimer -= frameDuration;
            this.frameIndex++;
            if (this.frameIndex >= anim.frames.length) {
                this.frameIndex = anim.loop ? 0 : anim.frames.length - 1;
            }
        }
    }

    render(ctx) {
        if (!this.sheet.loaded || !this.sheet.image) return;
        const anim = this.animations[this.currentAnim];
        if (!anim) return;
        const ti = anim.frames[Math.min(this.frameIndex, anim.frames.length - 1)];
        const sx = (ti % this.sheet.cols) * this.sheet.tileW, sy = Math.floor(ti / this.sheet.cols) * this.sheet.tileH;
        const sw = this.sheet.tileW, sh = this.sheet.tileH;
        const dw = Math.round(sw * this.sheet.scale), dh = Math.round(sh * this.sheet.scale);
        const dx = Math.round(this.pos.x - dw / 2), dy = Math.round(this.pos.y - dh / 2) - 4;

        ctx.save();
        if (this.facing < 0) { ctx.translate(dx + dw / 2, 0); ctx.scale(-1, 1); ctx.translate(-(dx + dw / 2), 0); }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.sheet.image, sx, sy, sw, sh, dx, dy, dw, dh); 
        ctx.restore();
    }
}