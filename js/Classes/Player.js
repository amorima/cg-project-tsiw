/**
 * Importação da classe Vector para cálculos de posição e movimento
 */
import Vector from './Vector.js'

/**
 * Constantes físicas do ambiente do jogo
 */
const DRAG = 6.0;        // Atrito no movimento horizontal
const GRAVITY = 1200;    // Força da gravidade (pixels/segundo²)
const GROUND_Y = 600;    // Altura do chão do mundo

/**
 * Classe Player - Representa o jogador no jogo
 * Gere a física, a animação, os sons e o inventário do jogador
 */
export default class Player {
    /** Tamanho de cada célula da grade (em pixels) */
    static GRID_SIZE = 48;
    
    /**
     * Construtor do jogador
     * @param {number} gridX - Posição inicial X na grade (padrão: 2)
     * @param {number} gridY - Posição inicial Y na grade (padrão: 10.5)
     * @param {number} gridW - Largura em células da grade (padrão: 0.67)
     * @param {number} gridH - Altura em células da grade (padrão: 1.17)
     * @param {Image} sprite - Imagem do sprite (opcional)
     */
    constructor(gridX = 2, gridY = 10.5, gridW = 0.67, gridH = 1.17, sprite = null) {
        // === FÍSICA E MOVIMENTO ===
        // Converte coordenadas da grade para pixels
        this.pos = new Vector(gridX * Player.GRID_SIZE, gridY * Player.GRID_SIZE);
        this.prevPos = this.pos.clone();  // Posição do frame anterior (para detecção de colisões)
        this.vel = new Vector(0, 0);      // Velocidade (pixels/segundo)
        this.acc = new Vector(0, 0);      // Aceleração (pixels/segundo²)

        // === VISUAL E ANIMAÇÃO ===
        // Configuração da folha de sprites
        this.sheet = {
            tileW: 24,        // Largura de cada frame na imagem
            tileH: 24,        // Altura de cada frame na imagem
            cols: 8,          // Número de colunas na folha de sprites
            rows: 6,          // Número de linhas na folha de sprites
            scale: 2.5,       // Escala de renderização
            image: null,      // Imagem carregada
            loaded: false     // Estado de carregamento
        };
        
        this.width = gridW * Player.GRID_SIZE || this.sheet.tileW * this.sheet.scale;
        this.height = gridH * Player.GRID_SIZE || this.sheet.tileH * this.sheet.scale;
        this.sprite = sprite;
        this.facing = 1;  // Direção que o jogador está virado (1 = direita, -1 = esquerda)
        
        // Definição das animações disponíveis
        this.animations = {
            idle:  { frames: [0, 1],                    fps: 4,  loop: true  },
            walk:  { frames: [8, 9, 10, 11],            fps: 8,  loop: true  },
            run:   { frames: [12, 13, 14, 15],          fps: 12, loop: true  },
            push:  { frames: [16, 17, 18, 19],          fps: 4,  loop: false },
            jump:  { frames: [24, 25, 26, 27, 28, 29, 30, 31], fps: 10, loop: false },
            sit:   { frames: [40, 41],                  fps: 2,  loop: true  },
        };
        this.currentAnim = 'idle';
        this.frameIndex = 0;
        this.frameTimer = 0;

        // === ÁUDIO ===
        this.sounds = {};  // Armazena os sons

        // === CONFIGURAÇÕES DE MOVIMENTO ===
        this.moveForce = 1500;           // Força de movimento horizontal
        this.maxSpeedX = 300;            // Velocidade máxima horizontal
        this.jumpImpulse = -500;         // Impulso do salto (negativo = para cima)
        this.onGround = false;           // Se o jogador está no chão
        this.isPushing = false;          // Se o jogador está a empurrar uma caixa
        this.jumpCooldown = 0;           // Cooldown de salto
        this.jumpCooldownTime = 0.30;    // Configuração do Cooldown do Salto (300ms)
        this.standingOnPlatform = null;  // Plataforma onde o jogador está em pé //!Importante para o player não cair das plataformas semisolidas :( 

        // === INVENTÁRIO ===
        this.colected = [];  // Lista de itens coletados
    }

    /**
     * Carrega o sprite sheet do jogador
     * @param {string} src - Caminho da imagem
     * @returns {Promise<Image>} Promise que resolve quando a imagem carrega
     */
    loadSprite(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sheet.image = img;
                this.sheet.loaded = true;
                resolve(img);
            };
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }
    
    /**
     * Carrega um arquivo de áudio
     * @param {string} src - Caminho do arquivo de áudio
     * @param {string} key - Chave para identificar e associar o som (padrão: 'default')
     * @returns {Promise<Audio>} Promise que resolve quando o áudio carrega
     */
    loadAudio(src, key = 'default') {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.addEventListener('canplaythrough', () => {
                this.sounds[key] = audio;
                resolve(audio);
            }, { once: true });
            audio.addEventListener('error', (e) => reject(e), { once: true });
            audio.src = src;
            audio.load();
        });
    }

    /**
     * Reproduz um som carregado
     * @param {string} key - Chave do som a reproduzir
     * @param {number} volume - Volume de 0.0 a 1.0 (padrão: 1.0)
     * @param {boolean} restart - Se deve reiniciar o som do início (padrão: true)
     */
    playSound(key, volume = 1.0, restart = true) {
        if (!this.sounds[key]) return;
        const audio = this.sounds[key];
        if (restart) audio.currentTime = 0;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(e => console.warn(`Falha ao reproduzir som "${key}":`, e));
    }

    /**
     * Define a animação atual
     * @param {string} name - Nome da animação
     * @param {boolean} reset - Se deve reiniciar a animação (padrão: true)
     */
    setAnimation(name, reset = true) {
        if (this.currentAnim === name) return;  // Não reinicia a mesma animação
        if (!this.animations[name]) return;
        this.currentAnim = name;
        if (reset) {
            this.frameIndex = 0;
            this.frameTimer = 0;
        }
    }

    /**
     * Atualiza o estado do jogador (física, colisões, animações)
     * @param {number} dt - Delta time (tempo desde o último frame em segundos)
     * @param {Object} input - Objeto com teclas pressionadas
     * @param {Platform[]} platforms - Array de plataformas
     * @param {Residuos[]} residuos - Array de resíduos coletáveis
     * @param {Box[]} boxes - Array de caixas
     */
    update(dt, input = {}, platforms = [], residuos = [], boxes = []) {
        if (dt <= 0) return;
        
        // Guarda a posição anterior para detecção de colisões
        this.prevPos.set(this.pos);
        
        // Estado anterior
        const wasOnGround = this.onGround;
        const prevPlatform = this.standingOnPlatform;
        
        // Reset de estados a cada frame
        this.onGround = false;
        this.isPushing = false;
        this.standingOnPlatform = null;
        this.onMovingPlatform = null;

        // Atualiza cooldown do salto
        if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

        // === PROCESSAMENTO DE INPUT ===
        const left = !!input['ArrowLeft']; //* Duplo !! Garante um Boleano mesmo para valore truthy and falsy sem mudar o valor logico
        const right = !!input['ArrowRight'];
        const jump = !!input['ArrowUp'] || !!input[' '];
        const attack = !!input['x'] || !!input['z'];

        // Calcula a aceleração baseada no input
        this.acc.x = (right ? this.moveForce : 0) - (left ? this.moveForce : 0);
        this.acc.y = GRAVITY;
        
        // Atualiza a direção do jogador
        if (left) this.facing = -1;
        if (right) this.facing = 1;
        
        // Salto (apenas se no chão e sem cooldown)
        if (jump && wasOnGround && this.jumpCooldown <= 0) {
            this.vel.y = this.jumpImpulse;
            this.setAnimation('jump', true);
            this.playSound('jump', 0.2);
            this.jumpCooldown = this.jumpCooldownTime;
            this.standingOnPlatform = null;
        }
        
        if (attack) this.setAnimation('attack', true);

        // === INTEGRAÇÃO FÍSICA (EULER) ===
        // position = position + velocity * dt;
        // velocity = velocity + ( force / mass ) * dt; //* Não havendo massa podemos reduzir a acelaração
        // Atualiza velocidade
        this.vel.x += this.acc.x * dt;
        this.vel.y += this.acc.y * dt;
        
        // Aplicar DRAG horizontal quando não há input
        if (Math.abs(this.acc.x) < 1e-6) {
            this.vel.x *= Math.max(0, 1 - Math.min(1, DRAG * dt));
        }
        
        // Limitar a velocidade horizontal
        this.vel.x = Math.max(-this.maxSpeedX, Math.min(this.maxSpeedX, this.vel.x));
        
        // Atualizar a posição
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // === LIMITES DO MUNDO ===
        const halfWidth = this.width / 2;
        if (this.pos.x - halfWidth < 0) {
            this.pos.x = halfWidth;
            this.vel.x = 0;
        } else if (this.pos.x + halfWidth > 2016) {
            this.pos.x = 2016 - halfWidth;
            this.vel.x = 0;
        }

        // Colisão com o chão (Apenas Fallback o jogo possui um plataforma com a função de chão)
        const halfH = this.height / 2;
        if (this.pos.y + halfH >= GROUND_Y) {
            this.pos.y = GROUND_Y - halfH;
            this.vel.y = 0;
            this.onGround = true;
        }

        // === RESOLUÇÃO DE COLISÕES ===
        if (platforms && platforms.length) {
            for (const p of platforms) this.resolvePlatformCollision(p, dt);
        }
        if (boxes && boxes.length) {
            for (const b of boxes) this.resolveBoxCollision(b);
        }
        if (residuos && residuos.length) {
            for (const r of residuos) this.itemColision(r);
        }

        // === ESCOLHA DE ANIMAÇÃO ===
        const anim = this.animations[this.currentAnim];
        const nonLoopingActive = anim && !anim.loop && this.frameIndex < anim.frames.length - 1;
        
        if (!nonLoopingActive) {
            // Prioridade: jump > push > run > walk > idle
            if (!this.onGround) {
                // Mantém animação de salto no ar
                if (this.currentAnim !== 'jump') this.setAnimation('jump', false);
            } else if (this.isPushing) {
                this.setAnimation('push');
            } else if (Math.abs(this.vel.x) > 100) {
                this.setAnimation('run');
            } else if (Math.abs(this.vel.x) > 10) {
                this.setAnimation('walk');
            } else {
                this.setAnimation('idle');
            }
        }

        this._updateAnimation(dt);
    }

    /**
     * Retorna a hitbox (caixa de colisão) do jogador
     * @returns {Object} Objeto com x, y, w, h
     */
    getHitbox() {
        return {
            x: this.pos.x - this.width / 2,
            y: this.pos.y - this.height / 2 + 10,
            w: this.width,
            h: this.height - 10
        };
    }

    /**
     * Resolve colisão com uma plataforma
     * @param {Platform} platform - A plataforma para verificar colisão
     * @param {number} dt - Delta time
     */
    resolvePlatformCollision(platform, dt) {
        const hb = this.getHitbox();
        const p = platform.getAABB ? platform.getAABB() : {
            x: platform.x,
            y: platform.y,
            w: platform.w,
            h: platform.h
        };
        
        // Verifica se há colisão
        if (!(hb.x < p.x + p.w && hb.x + hb.w > p.x &&
              hb.y < p.y + p.h && hb.y + hb.h > p.y)) return;

        // Para plataformas semi-sólidas
        if (platform.isOneWay && platform.isOneWay()) {
            const prevBottom = this.prevPos.y + this.height / 2;
            const platformVel = platform.vy || 0;
            const relativeVelY = this.vel.y - platformVel;
            
            // Permite pousar se:
            // 1. Jogador estava acima da plataforma no frame anterior
            // 2. Jogador está se movendo para baixo em relação à plataforma
            const tolerance = 10;
            if (prevBottom > p.y + tolerance) return;  // Garente Colisão Normal caso jogador estja acime deixa atravessar caso abaixo
            if (relativeVelY < -10) return;  // Garente que o jogador continua o salto sem ficar colado a platforma
        }

        // Calcula sobreposições
        const oR = p.x + p.w - hb.x;
        const oL = hb.x + hb.w - p.x;
        const oB = p.y + p.h - hb.y;
        const oT = hb.y + hb.h - p.y;
        const oX = Math.min(oL, oR);
        const oY = Math.min(oT, oB);

        if (oX < oY) {
            // Colisão horizontal
            this.pos.x = oL < oR ? p.x - this.width / 2 : p.x + p.w + this.width / 2;
            this.vel.x = 0;
            if (platform.vx) this.pos.x += platform.vx * dt;
        } else {
            // Colisão vertical
            if (oT < oB) {
                // Pousar na plataforma
                this.pos.y = p.y - this.height / 2;
                this.onGround = true;
                this.standingOnPlatform = platform;
                this.onMovingPlatform = platform;
                
                // Herda velocidade da plataforma
                if (platform.vy !== undefined && platform.vy !== 0) {
                    this.vel.y = platform.vy;
                } else {
                    this.vel.y = 0;
                }
                
                // Aplica movimento horizontal da plataforma
                if (platform.vx) {
                    this.pos.x += platform.vx * dt;
                }
            } else {
                // Bater a cabeça na plataforma
                this.pos.y = p.y + p.h + this.height / 2;
                this.vel.y = Math.max(0, platform.vy || 0);
            }
        }
    }

    /**
     * Resolve colisão com uma caixa (empurrar)
     * @param {Box} box - A caixa para verificar colisão
     */
    resolveBoxCollision(box) {
        const hb = this.getHitbox();
        const b = box.getAABB();
        
        // Verifica se há colisão
        if (!(hb.x < b.x + b.w && hb.x + hb.w > b.x &&
              hb.y < b.y + b.h && hb.y + hb.h > b.y)) return;

        // Calcula sobreposições
        const oL = hb.x + hb.w - b.x;
        const oR = b.x + b.w - hb.x;
        const oT = hb.y + hb.h - b.y;
        const oB = b.y + b.h - hb.y;
        const oX = Math.min(oL, oR);
        const oY = Math.min(oT, oB);

        if (oX < oY) {
            // Colisão horizontal - jogador está empurrando
            const pushForce = this.vel.x * 0.5;
            if (Math.abs(pushForce) > 10) {
                this.isPushing = true;
            }
            box.push(pushForce);
            this.pos.x += oL < oR ? -oL : oR;
            this.vel.x *= 0.3;
        } else {
            // Colisão vertical
            this.pos.y += oT < oB ? -oT : oB;
            this.vel.y = 0;
            if (oT < oB) this.onGround = true;
        }
    }

    /**
     * Verifica e processa colisão com um item coletável
     * @param {Residuos} item - O item para verificar colisão
     */
    itemColision(item) {
        if (item.collected) return;
        
        const hb = this.getHitbox();
        const i = item.getAABB();
        
        // Verifica se há colisão
        if (!(hb.x < i.x + i.w && hb.x + hb.w > i.x &&
              hb.y < i.y + i.h && hb.y + hb.h > i.y)) return;
        
        // Coleta o item
        item.collect();
        this.colected.push({ ...item });
        this.playSound('power_up', 0.6);
    }

    /**
     * Conta quantos resíduos de cada tipo foram coletados
     * @returns {Object} Objeto com contagens por tipo {papel, vidro, plastico, lixo}
     * ! Função para tranferir dados entre paginas
     */
    getResiduoCounts() {
        const counts = { papel: 0, vidro: 0, plastico: 0, lixo: 0 };
        for (const item of this.colected) {
            if (item.type && item.type.name) {
                const name = item.type.name;
                if (name in counts) {
                    counts[name]++;
                }
            }
        }
        return counts;
    }

    /**
     * Atualiza a animação atual (progresso dos frames)
     * @param {number} dt - Delta time
     * @private
     */
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

    /**
     * Renderiza o jogador no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto de renderização
     */
    render(ctx) {
        if (!this.sheet.loaded || !this.sheet.image) return;
        
        const anim = this.animations[this.currentAnim];
        if (!anim) return;
        
        // Obter o frame atual
        const ti = anim.frames[Math.min(this.frameIndex, anim.frames.length - 1)];
        const sx = (ti % this.sheet.cols) * this.sheet.tileW;
        const sy = Math.floor(ti / this.sheet.cols) * this.sheet.tileH;
        const sw = this.sheet.tileW;
        const sh = this.sheet.tileH;
        const dw = Math.round(sw * this.sheet.scale);
        const dh = Math.round(sh * this.sheet.scale);
        const dx = Math.round(this.pos.x - dw / 2);
        const dy = Math.round(this.pos.y - dh / 2) - 4;

        ctx.save();
        
        // Espelhar horizontalmente se esquerda
        if (this.facing < 0) {
            ctx.translate(dx + dw / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(dx + dw / 2), 0);
        }
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.sheet.image, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
    }
}