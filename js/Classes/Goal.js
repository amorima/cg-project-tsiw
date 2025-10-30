import Vector from './Vector.js';

export default class Goal {
    static GRID_SIZE = 48; // Grid cell size in pixels
    
    constructor(gridX = 0, gridY = 0, gridW = 1, gridH = 1.5) {
        // Convert grid coordinates to pixels
        this.pos = new Vector(gridX * Goal.GRID_SIZE, gridY * Goal.GRID_SIZE);
        this.w = gridW * Goal.GRID_SIZE;
        this.h = gridH * Goal.GRID_SIZE;
        this.isActive = false;
        this.animationTimer = 0;
        this.pulseSpeed = 2; // Pulse animation speed
    }

    getAABB() {
        return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
    }

    update(dt, player) {
        this.animationTimer += dt;
        
        // Check if player has collected enough residuos (12+, at least one of each type)
        const counts = player.getResiduoCounts();
        const total = counts.papel + counts.vidro + counts.plastico + counts.lixo;
        const hasAllTypes = counts.papel > 0 && counts.vidro > 0 && counts.plastico > 0 && counts.lixo > 0;
        
        // Goal becomes active when player has 12 or more residuos with at least one of each type
        this.isActive = total >= 12 && hasAllTypes;
    }

    checkCollision(player) {
        if (!this.isActive) return false;
        
        const playerAABB = player.getHitbox();
        const goalAABB = this.getAABB();
        
        return !(playerAABB.x + playerAABB.w < goalAABB.x || 
                 playerAABB.x > goalAABB.x + goalAABB.w ||
                 playerAABB.y + playerAABB.h < goalAABB.y || 
                 playerAABB.y > goalAABB.y + goalAABB.h);
    }

    render(ctx) {
        ctx.save();
        
        // Pulse effect
        const pulse = Math.sin(this.animationTimer * this.pulseSpeed) * 0.3 + 0.7;
        
        if (this.isActive) {
            // Active goal - glowing green with pulse
            ctx.shadowBlur = 30 * pulse;
            ctx.shadowColor = '#00FF00';
            ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + pulse * 0.3})`;
        } else {
            // Inactive goal - gray
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        }
        
        // Draw goal marker
        ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        
        // Draw border
        ctx.strokeStyle = this.isActive ? '#00FF00' : '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        
        // Draw flag/marker symbol
        ctx.fillStyle = this.isActive ? '#FFFFFF' : '#333333';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', this.pos.x + this.w / 2, this.pos.y + this.h / 2);
        
        ctx.restore();
    }

    saveToLocalStorage(player) {
        const counts = player.getResiduoCounts();
        localStorage.setItem('residuos_papel', counts.papel.toString());
        localStorage.setItem('residuos_vidro', counts.vidro.toString());
        localStorage.setItem('residuos_plastico', counts.plastico.toString());
        localStorage.setItem('residuos_lixo', counts.lixo.toString());
        
        console.log('Residuos saved to localStorage:', counts);
        return counts;
    }
}
