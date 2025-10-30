/**
 * Importação da classe Vector para cálculos de posição e movimento
 */
import Vector from './Vector.js';

/**
 * Constantes físicas para as caixas
 */
const GRAVITY = 1200;    // Força da gravidade (pixels/segundo^2)
const DRAG = 8.0;        // Constante de Redução de Movimento
const GROUND_Y = 600;    // Altura do chão do mundo usado apenas caso não haja plataforma (aka:testing)

/**
 * Classe Box - Representa uma caixa empurrável no jogo
 * As caixas podem ser empurradas pelo jogador e são afetas pela gravidade
 * O jogador pode encontrar residuos escondidos atrás destas caso a caixa apresente um brilho amarelo
 */
export default class Box {
    /** Tamanho de cada célula na grelha (em pixels) usado pala simplicar os construtor */
    static GRID_SIZE = 48;
    
    /**
     * Cria uma nova caixa
     * @param {number} gridX - Posição inicial X na grelha (padrão: 0)
     * @param {number} gridY - Posição inicial Y na grelha (padrão: 0)
     * @param {number} gridW - Largura em células da grelha (padrão: 1)
     * @param {number} gridH - Altura em células da grelha (padrão: 1)
     */
    constructor(gridX = 0, gridY = 0, gridW = 1, gridH = 1) {
        // Converte coordenadas na grelha para pixels
        this.pos = new Vector(gridX * Box.GRID_SIZE, gridY * Box.GRID_SIZE);
        this.vel = new Vector(0, 0);  // Velocidade (pixels/segundo)
        this.width = gridW * Box.GRID_SIZE;
        this.height = gridH * Box.GRID_SIZE;
        this.onGround = false;        // Se a caixa está no chão
        this.beingPushed = false;     // Se a caixa está sendo empurrada
        this.tileSize = 16;           // Tamanho do tile na imagem original
    }

    /**
     * Define o tileset compartilhado para todas as caixas
     * @param {Image} image - Imagem do tileset
     * @static
     */
    static setTileset(image) {
        Box.sharedTileset = image;
    }

    /**
     * Atualiza a física da caixa e resolve colisões
     * @param {number} dt - Delta time (tempo desde o último frame em segundos)
     * @param {Platform[]} platforms - Array de plataformas
     * @param {Box[]} boxes - Array de outras caixas
     */
    update(dt, platforms = [], boxes = []) {
        if (!dt) return;
        
        // Reseta estados
        this.onGround = false;
        this.beingPushed = false;

        // === FÍSICA ===
        // Aplicar gravidade
        this.vel.y += GRAVITY * dt;
        
        // Aplicar DRAG
        this.vel.x *= Math.max(0, 1 - DRAG * dt);
        
        // Atualizar posição
        this.pos.add({ x: this.vel.x * dt, y: this.vel.y * dt });

        // Colisão Caixa-Chão
        const halfH = this.height / 2;
        if (this.pos.y + halfH >= GROUND_Y) {
            this.pos.y = GROUND_Y - halfH;
            this.vel.y = 0;
            this.onGround = true;
        }

        // Colisão Caixa-Plataforma
        platforms.forEach(p => this.resolvePlatformCollision(p, dt));
        
        // Resolve Caixa-Caixa
        boxes.forEach(b => {
            if (b !== this) this.resolveBoxCollision(b);
        });
    }

    /**
     * Calcula a sobreposição entre duas AABBs
     * @param {Object} aabb1 - Primeira AABB {x, y, w, h}
     * @param {Object} aabb2 - Segunda AABB {x, y, w, h}
     * @returns {Object} Objeto com sobreposições {oL, oR, oT, oB, oX, oY} ou null se não houver colisão
     * @private
     */
    _calculateOverlap(aabb1, aabb2) {
        // Verifica se há colisão
        if (!(aabb1.x < aabb2.x + aabb2.w && aabb1.x + aabb1.w > aabb2.x &&
              aabb1.y < aabb2.y + aabb2.h && aabb1.y + aabb1.h > aabb2.y)) {
            return null;
        }

        // Calcula sobreposições em cada direção
        const oL = aabb1.x + aabb1.w - aabb2.x;  // Sobreposição à esquerda
        const oR = aabb2.x + aabb2.w - aabb1.x;  // Sobreposição à direita
        const oT = aabb1.y + aabb1.h - aabb2.y;  // Sobreposição ao topo
        const oB = aabb2.y + aabb2.h - aabb1.y;  // Sobreposição abaixo
        const oX = Math.min(oL, oR);             // Menor sobreposição horizontal - para resolução de colisão
        const oY = Math.min(oT, oB);             // Menor sobreposição vertical - para resolução de colisão

        return { oL, oR, oT, oB, oX, oY };
    }

    /**
     * Resolve colisão com uma plataforma
     * @param {Platform} platform - A plataforma para verificar colisão
     * @param {number} dt - Delta time
     */
    resolvePlatformCollision(platform, dt) {
        const hb = this.getAABB();
        const p = platform.getAABB ? platform.getAABB() : platform;
        
        const overlap = this._calculateOverlap(hb, p);
        if (!overlap) return;

        const { oL, oR, oT, oB, oX, oY } = overlap;

        if (oX < oY) {
            // Colisão horizontal
            this.pos.x += oL < oR ? -oL : oR;
            this.vel.x = 0;
        } else {
            // Colisão vertical
            this.pos.y += oT < oB ? -oT : oB;
            this.vel.y = 0;
            
            if (oT < oB) {
                // Caixa está em cima da plataforma
                this.onGround = true;
                // Mover com a plataforma
                if (platform.vx) this.pos.x += platform.vx * dt;
                if (platform.vy) this.pos.y += platform.vy * dt;
            }
        }
    }

    /**
     * Resolve colisão entre caixas
     * @param {Box} box - A outra caixa para verificar colisão
     */
    resolveBoxCollision(box) {
        const hb = this.getAABB();
        const b = box.getAABB();
        
        const overlap = this._calculateOverlap(hb, b);
        if (!overlap) return;

        const { oL, oR, oT, oB, oX, oY } = overlap;

        if (oX < oY) {
            // Colisão horizontal - empurra ambas as caixas
            const push = oL < oR ? -oX / 2 : oX / 2;
            this.pos.x += push;
            box.pos.x -= push;
            
            // Transfere momento (média das velocidades)
            const avgVel = (this.vel.x + box.vel.x) / 2;
            this.vel.x = avgVel;
            box.vel.x = avgVel;
        } else {
            // Colisão vertical
            if (oT < oB) {
                // Esta caixa está em cima da outra
                this.pos.y -= oY;
                this.vel.y = 0;
                this.onGround = true;
            } else {
                // Esta caixa está abaixo da outra
                this.pos.y += oY;
                this.vel.y = 0;
            }
        }
    }

    /**
     * Aplica uma força de empurrão à caixa
     * @param {number} forceX - Força horizontal a aplicar
     */
    push(forceX) {
        if (this.onGround) {
            this.vel.x += forceX;
            this.beingPushed = true;
        }
    }

    /**
     * Retorna a caixa delimitadora alinhada aos eixos (AABB) da caixa
     * @returns {Object} Objeto com x, y, w, h
     */
    getAABB() {
        return {
            x: this.pos.x - this.width / 2,
            y: this.pos.y - this.height / 2,
            w: this.width,
            h: this.height
        };
    }

    /**
     * Renderiza a caixa no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto de renderização
     * @param {Residuos[]} residuos - Array de resíduos (para efeito de brilho se houver item atrás)
     */
    render(ctx, residuos = []) {
        const tileset = Box.sharedTileset;
        const { x, y, w, h } = this.getAABB();

        // Verifica se há algum resíduo não coletado atrás desta caixa
        let hasResiduoBehind = false;
        if (residuos && residuos.length) {
            for (const r of residuos) {
                if (!r.collected) {
                    const rAABB = r.getAABB();
                    // Verifica se o resíduo sobrepõe a caixa
                    if (!(rAABB.x + rAABB.w < x || rAABB.x > x + w ||
                          rAABB.y + rAABB.h < y || rAABB.y > y + h)) {
                        hasResiduoBehind = true;
                        break;
                    }
                }
            }
        }

        ctx.save();

        // Aplica efeito de brilho se houver resíduo atrás
        if (hasResiduoBehind) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700';  // Brilho dourado
        }

        // Se não há tileset, usa retângulo colorido como fallback
        if (!tileset) {
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(x, y, w, h);
            ctx.restore();
            return;
        }

        ctx.imageSmoothingEnabled = false;
        const ts = this.tileSize;
        
        // Tile 8 da linha 4 = índice 7 + (3 * 16) = 55 (calculos de posição especificos da imagem)
        const tileIndex = 55;
        const sx = (tileIndex % 16) * ts;
        const sy = Math.floor(tileIndex / 16) * ts;

        // Desenha um unico tile, aumentando a escala para usar um unico sprite
        ctx.drawImage(tileset, sx, sy, ts, ts, x, y, w, h);
        
        ctx.restore();
    }
}