import Vector from './Vector.js';

export default class Residuos {
    static TYPES = {
        PLASTIC: { name: 'plastico', color: '#FFD700', image: null, imagePath: '../assets/img/residuos/plástico.png' },
        PAPER: { name: 'papel', color: '#4169E1', image: null, imagePath: '../assets/img/residuos/papel.png' },
        GLASS: { name: 'vidro', color: '#32CD32', image: null, imagePath: '../assets/img/residuos/vidro.png' },
        INDEFERENCIADO: { name: 'lixo', color: '#808080', image: null, imagePath: '../assets/img/residuos/lixo.png' }
    };

    static imagesLoaded = false;
    static GRID_SIZE = 48; // Grid cell size in pixels

    static async loadImages() {
        if (this.imagesLoaded) return;
        
        const loadPromises = Object.values(Residuos.TYPES).map(type => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    type.image = img;
                    resolve();
                };
                img.onerror = () => reject(new Error(`Failed to load ${type.imagePath}`));
                img.src = type.imagePath;
            });
        });

        await Promise.all(loadPromises);
        this.imagesLoaded = true;
    }

    constructor(gridX = 0, gridY = 0, gridW = 0.67, gridH = 0.67, type = 'PLASTIC'){
        // Convert grid coordinates to pixels
        const pixelX = gridX * Residuos.GRID_SIZE;
        const pixelY = gridY * Residuos.GRID_SIZE;
        this.pos = new Vector(pixelX + 9, pixelY - 16);
        this.w = gridW * Residuos.GRID_SIZE;
        this.h = gridH * Residuos.GRID_SIZE;
        this.collected = false;
        this.type = Residuos.TYPES[type] || Residuos.TYPES.PLASTIC;
        
        // Pop-up animation properties
        this.popUpTimer = 0;
        this.popUpDuration = 0.6; // seconds
        this.popUpDistance = 40;   // pixels to move up
        this.originalY = pixelY;
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
        
        // Draw image if loaded, otherwise fallback to colored rectangle
        if (this.type.image) {
            // Maintain aspect ratio - fit image within the bounds
            const img = this.type.image;
            const imgAspect = img.width / img.height;
            const targetAspect = this.w / this.h;
            
            let drawWidth = this.w;
            let drawHeight = this.h;
            let offsetX = 0;
            let offsetY = 0;
            
            // Fit image maintaining aspect ratio
            if (imgAspect > targetAspect) {
                // Image is wider - fit to width
                drawHeight = this.w / imgAspect;
                offsetY = (this.h - drawHeight) / 2;
            } else {
                // Image is taller - fit to height
                drawWidth = this.h * imgAspect;
                offsetX = (this.w - drawWidth) / 2;
            }
            
            ctx.imageSmoothingEnabled = true; // Use smooth rendering for better quality
            ctx.drawImage(
                this.type.image, 
                this.pos.x + offsetX, 
                this.pos.y + offsetY, 
                drawWidth, 
                drawHeight
            );
        } else {
            ctx.fillStyle = this.type.color;
            ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
            
            // Add a border for better visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        }
        
        ctx.restore();
    }

    collect(){
        this.collected = true;
        this.popUpTimer = 0;
    }
}