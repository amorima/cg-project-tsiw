/**
 * Importação da classe Vector para cálculos de posição
 */
import Vector from './Vector.js';

/**
 * Classe Residuos - Representa um item de resíduo coletável no jogo
 * Diferentes tipos de resíduos para reciclagem (plástico, papel, vidro, lixo)
 */
export default class Residuos {
    /**
     * Definição dos tipos de resíduos disponíveis
     * Cada tipo tem nome, cor e caminho da imagem
     */
    static TYPES = {
        PLASTIC: {
            name: 'plastico',
            color: '#FFD700',
            image: null,
            imagePath: '../assets/img/residuos/plástico.png'
        },
        PAPER: {
            name: 'papel',
            color: '#4169E1',
            image: null,
            imagePath: '../assets/img/residuos/papel.png'
        },
        GLASS: {
            name: 'vidro',
            color: '#32CD32',
            image: null,
            imagePath: '../assets/img/residuos/vidro.png'
        },
        INDEFERENCIADO: {
            name: 'lixo',
            color: '#808080',
            image: null,
            imagePath: '../assets/img/residuos/lixo.png'
        }
    };

    /** Flag indicando se as imagens foram carregadas */
    static imagesLoaded = false;
    
    /** Tamanho de cada célula da grade (em pixels) */
    static GRID_SIZE = 48;

    /**
     * Carrega todas as imagens dos tipos de resíduos
     * @returns {Promise<void>} Promise que resolve quando todas as imagens carregam
     * @static
     */
    static async loadImages() {
        if (this.imagesLoaded) return;
        
        const loadPromises = Object.values(Residuos.TYPES).map(type => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    type.image = img;
                    resolve();
                };
                img.onerror = () => reject(new Error(`Falha ao carregar ${type.imagePath}`));
                img.src = type.imagePath;
            });
        });

        await Promise.all(loadPromises);
        this.imagesLoaded = true;
    }

    /**
     * Cria um novo resíduo coletável
     * @param {number} gridX - Posição X na grade (padrão: 0)
     * @param {number} gridY - Posição Y na grade (padrão: 0)
     * @param {number} gridW - Largura em células da grade (padrão: 0.67)
     * @param {number} gridH - Altura em células da grade (padrão: 0.67)
     * @param {string} type - Tipo do resíduo ('PLASTIC', 'PAPER', 'GLASS', 'INDEFERENCIADO')
     */
    constructor(gridX = 0, gridY = 0, gridW = 0.67, gridH = 0.67, type = 'PLASTIC') {
        // Converte coordenadas da grade para pixels
        const pixelX = gridX * Residuos.GRID_SIZE;
        const pixelY = gridY * Residuos.GRID_SIZE;
        
        // Ajusta posição com offset para melhor alinhamento
        this.pos = new Vector(pixelX + 9, pixelY - 16);
        this.w = gridW * Residuos.GRID_SIZE;
        this.h = gridH * Residuos.GRID_SIZE;
        this.collected = false;
        this.type = Residuos.TYPES[type] || Residuos.TYPES.PLASTIC;
        
        // Propriedades da animação de coleta (pop-up)
        this.popUpTimer = 0;           // Tempo decorrido da animação
        this.popUpDuration = 0.6;      // Duração total da animação (segundos)
        this.popUpDistance = 40;       // Distância a subir (pixels)
        this.originalY = pixelY;       // Posição Y original
    }

    /**
     * Retorna a caixa delimitadora alinhada aos eixos (AABB)
     * @returns {Object} Objeto com x, y, w, h
     */
    getAABB() {
        return {
            x: this.pos.x,
            y: this.pos.y,
            w: this.w,
            h: this.h
        };
    }

    /**
     * Atualiza a animação do resíduo (principalmente animação de coleta)
     * @param {number} dt - Delta time (tempo desde o último frame em segundos)
     */
    update(dt) {
        if (this.collected && this.popUpTimer < this.popUpDuration) {
            this.popUpTimer += dt;
            // Move para cima e desvanece
            const progress = this.popUpTimer / this.popUpDuration;
            this.pos.y = this.originalY - (this.popUpDistance * progress);
        }
    }

    /**
     * Renderiza o resíduo no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto de renderização
     */
    render(ctx) {
        // Não renderiza se já foi coletado e a animação terminou
        if (this.collected && this.popUpTimer >= this.popUpDuration) return;
        
        // Calcula opacidade (desvanece quando coletado)
        const alpha = this.collected ? (1 - (this.popUpTimer / this.popUpDuration)) : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Desenha imagem se carregada, senão usa retângulo colorido como fallback
        if (this.type.image) {
            // Mantém proporção da imagem - ajusta para caber nos limites
            const img = this.type.image;
            const imgAspect = img.width / img.height;
            const targetAspect = this.w / this.h;
            
            let drawWidth = this.w;
            let drawHeight = this.h;
            let offsetX = 0;
            let offsetY = 0;
            
            // Ajusta dimensões mantendo proporção
            if (imgAspect > targetAspect) {
                // Imagem é mais larga - ajusta à largura
                drawHeight = this.w / imgAspect;
                offsetY = (this.h - drawHeight) / 2;
            } else {
                // Imagem é mais alta - ajusta à altura
                drawWidth = this.h * imgAspect;
                offsetX = (this.w - drawWidth) / 2;
            }
            
            ctx.drawImage(
                this.type.image,
                this.pos.x + offsetX,
                this.pos.y + offsetY,
                drawWidth,
                drawHeight
            );
        } else {
            // Fallback: retângulo colorido com borda
            ctx.fillStyle = this.type.color;
            ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        }
        
        ctx.restore();
    }

    /**
     * Marca o resíduo como coletado e inicia a animação de coleta
     */
    collect() {
        this.collected = true;
        this.popUpTimer = 0;
    }
}