/**
 * Classe Platform - Representa uma plataforma no jogo
 * Pode ser sólida ou semi-sólida (oneway) e pode se mover
 */
export default class Platform {
    /** Tamanho de cada célula da grelha (em pixels) */
    static GRID_SIZE = 48;
    
    /**
     * Cria uma nova plataforma
     * @param {number} gridX - Posição X inicial na grelha
     * @param {number} gridY - Posição Y inicial na grelha
     * @param {number} gridW - Largura em células da grelha
     * @param {number} gridH - Altura em células da grelha
     * @param {Object} config - Configuração adicional
     * @param {string} config.type - Tipo da plataforma ('solid' ou 'oneway')
     * @param {number} config.vx - Velocidade horizontal (pixels/segundo)
     * @param {number} config.vy - Velocidade vertical (pixels/segundo)
     * @param {number} config.minGridX - Limite mínimo X na grelha para movimento
     * @param {number} config.maxGridX - Limite máximo X na grelha para movimento
     * @param {number} config.minGridY - Limite mínimo Y na grelha para movimento
     * @param {number} config.maxGridY - Limite máximo Y na grelha para movimento
     */
    constructor(gridX, gridY, gridW, gridH, {
        type = 'solid',
        vx = 0,
        vy = 0,
        minGridX = 0,
        maxGridX = 0,
        minGridY = 0,
        maxGridY = 0
    } = {}) {
        // Converte coordenadas da grelha para pixels
        this.x = gridX * Platform.GRID_SIZE;
        this.y = gridY * Platform.GRID_SIZE;
        this.w = Math.max(1, gridW * Platform.GRID_SIZE);
        this.h = Math.max(1, gridH * Platform.GRID_SIZE);
        
        // Tipo e movimento
        this.type = type;  // 'solid' = sólida, 'oneway' = semi-sólida (atravessável por baixo)
        this.vx = vx;      // Velocidade horizontal
        this.vy = vy;      // Velocidade vertical
        
        // Limites de movimento (em pixels)
        this.minX = minGridX ? minGridX * Platform.GRID_SIZE : this.x;
        this.maxX = maxGridX ? maxGridX * Platform.GRID_SIZE : this.x;
        this.minY = minGridY ? minGridY * Platform.GRID_SIZE : this.y;
        this.maxY = maxGridY ? maxGridY * Platform.GRID_SIZE : this.y;
        
        // Configurações de renderização
        this.sourceTileSize = 16;    // Tamanho do tile na imagem original
        this.displayTileSize = 48;   // Tamanho do tile ao renderizar
        this.tileset = null;
    }

    /**
     * Define o tileset compartilhado para todas as plataformas
     * @param {Image} image - Imagem do tileset
     * @static
     */
    static setTileset(image) {
        Platform.sharedTileset = image;
    }

    /**
     * Atualiza a posição da plataforma (se estiver em movimento)
     * @param {number} dt - Delta time (tempo desde o último frame em segundos)
     */
    update(dt) {
        if (!dt) return;
        
        // Inverte direção horizontal ao atingir limites
        if ((this.vx > 0 && this.x >= this.maxX) || (this.vx < 0 && this.x <= this.minX)) {
            this.vx = -this.vx;
        }
        
        // Inverte direção vertical ao atingir limites
        if ((this.vy > 0 && this.y >= this.maxY) || (this.vy < 0 && this.y <= this.minY)) {
            this.vy = -this.vy;
        }
        
        // Atualiza posição
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    /**
     * Retorna a caixa delimitadora alinhada aos eixos (AABB)
     * @returns {Object} Objeto com x, y, w, h
     */
    getAABB() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    /**
     * Verifica se a plataforma é do tipo semi-sólida (oneway)
     * @returns {boolean} True se for semi-sólida
     */
    isOneWay() {
        return this.type === 'oneway';
    }

    /**
     * Renderiza a plataforma no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto de renderização
     */
    render(ctx) {
        const tileset = Platform.sharedTileset;
        
        // Se não há tileset, usa retângulos coloridos como fallback
        if (!tileset) {
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
            // Plataformas semi-sólidas: usa o tile 10 (8x8 pixels do canto superior esquerdo)
            const tileIndex = 9;  // Tile 10 (índice começa em 0)
            const sx = (tileIndex % 16) * srcSize;
            const sy = Math.floor(tileIndex / 16) * srcSize;
            
            // Desenha apenas a linha superior da plataforma
            for (let i = 0; i < tilesX; i++) {
                // Desenha dois tiles 8x8 lado a lado para preencher cada célula
                ctx.drawImage(tileset, sx, sy, 8, 8, this.x + i * dstSize, this.y, 24, 24);
                ctx.drawImage(tileset, sx, sy, 8, 8, this.x + i * dstSize + 24, this.y, 24, 24);
            }
        } else {
            // Plataformas sólidas: tile 0 (linha 1) para topo, tile 16 (linha 2) para preenchimento
            for (let j = 0; j < tilesY; j++) {
                for (let i = 0; i < tilesX; i++) {
                    const sy = j === 0 ? 0 : srcSize;  // Primeira linha usa tile do topo
                    ctx.drawImage(
                        tileset,
                        0, sy, srcSize, srcSize,
                        this.x + i * dstSize, this.y + j * dstSize,
                        dstSize, dstSize
                    );
                }
            }
        }
    }
}