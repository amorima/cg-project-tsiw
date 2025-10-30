/**
 * Importação da classe Vector para cálculos de posição
 */
import Vector from './Vector.js';

/**
 * Classe Goal - Representa a meta do jogo
 * O jogador deve coletar resíduos suficientes para ativar e entrar na meta
 */
export default class Goal {
    /** Tamanho de cada célula da grade (em pixels) */
    static GRID_SIZE = 48;
    
    /**
     * Cria uma meta
     * @param {number} gridX - Posição X na grade (padrão: 0)
     * @param {number} gridY - Posição Y na grade (padrão: 0)
     * @param {number} gridW - Largura em células da grade (padrão: 1)
     * @param {number} gridH - Altura em células da grade (padrão: 1.5)
     */
    constructor(gridX = 0, gridY = 0, gridW = 1, gridH = 1.5) {
        // Converte coordenadas da grade para pixels
        this.pos = new Vector(gridX * Goal.GRID_SIZE, gridY * Goal.GRID_SIZE);
        this.w = gridW * Goal.GRID_SIZE;
        this.h = gridH * Goal.GRID_SIZE;
        
        // Estado e animação
        this.isActive = false;           // Se a meta está ativo (pronto para completar)
        this.animationTimer = 0;         // Timer para animações de pulso
        this.pulseSpeed = 2;             // Velocidade da animação de pulso
        this.completed = false;          // Se a meta foi completado
        this.playerWasInside = false;    // Se o jogador estava dentro no frame anterior
        this.hasTriggeredThisEntry = false;  // Se já foi acionado nesta entrada
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
     * Verifica se duas AABBs estão colidindo
     * @param {Object} aabb1 - Primeira AABB {x, y, w, h}
     * @param {Object} aabb2 - Segunda AABB {x, y, w, h}
     * @returns {boolean} True se houver colisão
     * @private
     */
    _checkAABBCollision(aabb1, aabb2) {
        return !(aabb1.x + aabb1.w < aabb2.x ||
                 aabb1.x > aabb2.x + aabb2.w ||
                 aabb1.y + aabb1.h < aabb2.y ||
                 aabb1.y > aabb2.y + aabb2.h);
    }

    /**
     * Atualiza o estado da meta
     * @param {number} dt - Delta time (tempo desde o último frame em segundos)
     * @param {Player} player - Referência ao jogador
     */
    update(dt, player) {
        this.animationTimer += dt;
        
        // Verifica se o jogador coletou resíduos suficientes
        const counts = player.getResiduoCounts();
        const total = counts.papel + counts.vidro + counts.plastico + counts.lixo;
        const hasAllTypes = counts.papel > 0 && counts.vidro > 0 &&
                           counts.plastico > 0 && counts.lixo > 0;
        
        // Meta ativa quando o jogador tem 12+ resíduos com pelo menos um de cada tipo
        this.isActive = total >= 12 && hasAllTypes;
        
        // Verifica se o jogador está atualmente dentro da meta
        const playerAABB = player.getHitbox();
        const goalAABB = this.getAABB();
        const isCurrentlyInside = this._checkAABBCollision(playerAABB, goalAABB);
        
        // Reset para continue quando o jogador sai da meta
        if (!isCurrentlyInside && this.playerWasInside) {
            this.hasTriggeredThisEntry = false;
            this.completed = false;  // Permite reentrar apos sair da meta
            console.log('Jogador saiu do objetivo - flags resetadas');
        }
        
        this.playerWasInside = isCurrentlyInside;
    }

    /**
     * Verifica se há colisão com o jogador e se a meta foi atingida
     * @param {Player} player - Referência ao jogador
     * @returns {boolean} True se houve colisão e a objetiva está ativo
     */
    checkCollision(player) {
        // Não verifica se já completado ou já acionado nesta entrada
        if (!this.isActive || this.completed || this.hasTriggeredThisEntry) {
            return false;
        }
        
        const playerAABB = player.getHitbox();
        const goalAABB = this.getAABB();
        
        const collision = this._checkAABBCollision(playerAABB, goalAABB);
        
        if (collision) {
            console.log('Colisão com objetivo detectada! isActive:', this.isActive, 'completed:', this.completed);
            this.hasTriggeredThisEntry = true;  // Marca como acionado nesta entrada
        }
        
        return collision;
    }

    /**
     * Renderiza o objetivo no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto de renderização
     */
    render(ctx) {
        ctx.save();
        
        // Efeito de pulso (usando seno para oscilar)
        const pulse = Math.sin(this.animationTimer * this.pulseSpeed) * 0.3 + 0.7;
        
        if (this.isActive) {
            // Objetivo ativo - brilho verde com pulso
            ctx.shadowBlur = 30 * pulse;
            ctx.shadowColor = '#00FF00';
            ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + pulse * 0.3})`;
        } else {
            // Objetivo inativo - cinza
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        }
        
        // Desenha marcador do objetivo
        ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        
        // Desenha borda
        ctx.strokeStyle = this.isActive ? '#00FF00' : '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        
        // Desenha símbolo de bandeira/marcador
        ctx.fillStyle = this.isActive ? '#FFFFFF' : '#333333';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', this.pos.x + this.w / 2, this.pos.y + this.h / 2);
        
        ctx.restore();
    }

    /**
     * Salva as contagens de resíduos no localStorage
     * @param {Player} player - Referência ao jogador
     * @returns {Object} Objeto com as contagens salvas
     */
    saveToLocalStorage(player) {
        const counts = player.getResiduoCounts();
        localStorage.setItem('residuos_papel', counts.papel.toString());
        localStorage.setItem('residuos_vidro', counts.vidro.toString());
        localStorage.setItem('residuos_plastico', counts.plastico.toString());
        localStorage.setItem('residuos_lixo', counts.lixo.toString());
        
        console.log('Resíduos salvos no localStorage:', counts);
        return counts;
    }
}
