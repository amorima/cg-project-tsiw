/**
 * Classe Vector - Representa um vetor 2D para operações matemáticas
 * Utilizada para posições, velocidades e acelerações no jogo
 */
export default class Vec {
    /**
     * Cria um novo vetor 2D
     * @param {number} x - Componente horizontal (padrão: 0)
     * @param {number} y - Componente vertical (padrão: 0)
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // ===================== UTILIDADES BÁSICAS =======================
    
    /**
     * Cria uma cópia independente deste vetor
     * @returns {Vec} Novo vetor com os mesmos valores
     */
    clone() {
        return new Vec(this.x, this.y);
    }

    /**
     * Converte o vetor para um array [x, y]
     * @returns {number[]} Array com os componentes do vetor
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Converte o vetor para string legível
     * @returns {string} Representação em texto do vetor
     */
    toString() {
        return `Vector(${this.x}, ${this.y})`;
    }

    /**
     * Define os valores deste vetor a partir de outro vetor
     * @param {Object} vector - Objeto com propriedades x e y
     */
    set(vector = { x: this.x, y: this.y }) {
        this.x = vector.x;
        this.y = vector.y;
    }

    // ================== PROPRIEDADES COMPUTADAS ===============================
    
    /**
     * Calcula o comprimento (magnitude) do vetor
     * @returns {number} Distância da origem ao ponto (x, y)
     */
    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    /**
     * Verifica se o vetor é zero (ambos componentes são 0)
     * @returns {boolean} True se x e y forem zero
     */
    get isZero() {
        return this.x === 0 && this.y === 0;
    }

    // ================= MÉTODOS MUTÁVEIS (MODIFICAM O VETOR) =================================
    
    /**
     * Adiciona outro vetor a este (modifica este vetor)
     * @param {Object} vector - Vetor a adicionar (padrão: {x:0, y:0})
     * @returns {Vec} Este vetor (para encadeamento)
     */
    add(vector = { x: 0, y: 0 }) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
     * Subtrai outro vetor deste (modifica este vetor)
     * @param {Object} vector - Vetor a subtrair (padrão: {x:0, y:0})
     * @returns {Vec} Este vetor (para encadeamento)
     */
    sub(vector = { x: 0, y: 0 }) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
     * Multiplica o vetor por um escalar (modifica este vetor)
     * @param {number} scalar - Valor para multiplicar
     * @returns {Vec} Este vetor (para encadeamento)
     */
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Inverte a direção do vetor (multiplica por -1)
     * @returns {Vec} Este vetor (para encadeamento)
     */
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    /**
     * Normaliza o vetor (torna o comprimento igual a 1, mantendo a direção)
     * @returns {Vec} Este vetor (para encadeamento)
     */
    normalize() {
        const len = this.length;
        if (len === 0) return this;
        this.x /= len;
        this.y /= len;
        return this;
    }

    /**
     * Rotaciona o vetor por um ângulo em radianos
     * @param {number} angleRad - Ângulo em radianos
     * @returns {Vec} Este vetor (para encadeamento)
     */
    rotate(angleRad) {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    // ============== MÉTODOS NÃO-MUTÁVEIS (RETORNAM NOVO VETOR) ============================
    
    /**
     * Retorna um novo vetor que é a soma deste com outro
     * @param {Object} vector - Vetor a adicionar
     * @returns {Vec} Novo vetor resultado
     */
    added(vector) {
        return this.clone().add(vector);
    }

    /**
     * Retorna um novo vetor que é a subtração de outro deste
     * @param {Object} vector - Vetor a subtrair
     * @returns {Vec} Novo vetor resultado
     */
    subbed(vector) {
        return this.clone().sub(vector);
    }

    /**
     * Retorna um novo vetor escalado
     * @param {number} scalar - Valor para multiplicar
     * @returns {Vec} Novo vetor resultado
     */
    scaled(scalar) {
        return this.clone().scale(scalar);
    }

    /**
     * Retorna um novo vetor com direção invertida
     * @returns {Vec} Novo vetor resultado
     */
    negated() {
        return this.clone().negate();
    }

    /**
     * Retorna um novo vetor normalizado
     * @returns {Vec} Novo vetor resultado
     */
    normalized() {
        return this.clone().normalize();
    }

    /**
     * Retorna um novo vetor rotacionado
     * @param {number} angleRad - Ângulo em radianos
     * @returns {Vec} Novo vetor resultado
     */
    rotated(angleRad) {
        return this.clone().rotate(angleRad);
    }

    // =============== MATEMÁTICA VETORIAL =============================
    
    /**
     * Calcula o produto escalar (dot product) com outro vetor
     * @param {Object} vector - Vetor para o produto escalar
     * @returns {number} Resultado do produto escalar
     */
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    /**
     * Calcula a distância até outro vetor
     * @param {Object} vector - Vetor de destino
     * @returns {number} Distância entre os dois vetores
     */
    distanceTo(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    // =============== MÉTODOS ESTÁTICOS (HELPERS) ==========================
    
    /**
     * Cria um vetor zero (0, 0)
     * @returns {Vec} Novo vetor zero
     */
    static zero() {
        return new Vec(0, 0);
    }

    /**
     * Cria um vetor a partir de um array [x, y]
     * @param {number[]} arr - Array com dois números
     * @returns {Vec} Novo vetor
     */
    static fromArray(arr) {
        return new Vec(arr[0], arr[1]);
    }

    /**
     * Soma dois vetores e retorna um novo vetor
     * @param {Object} vector1 - Primeiro vetor
     * @param {Object} vector2 - Segundo vetor
     * @returns {Vec} Novo vetor resultado da soma
     */
    static add(vector1, vector2) {
        return new Vec(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    /**
     * Subtrai dois vetores e retorna um novo vetor
     * @param {Object} vector1 - Primeiro vetor
     * @param {Object} vector2 - Segundo vetor
     * @returns {Vec} Novo vetor resultado da subtração
     */
    static sub(vector1, vector2) {
        return new Vec(vector1.x - vector2.x, vector1.y - vector2.y);
    }

    /**
     * Calcula a distância entre dois vetores
     * @param {Object} vector1 - Primeiro vetor
     * @param {Object} vector2 - Segundo vetor
     * @returns {number} Distância entre os vetores
     */
    static distance(vector1, vector2) {
        return vector1.distanceTo(vector2);
    }

    /**
     * Cria um vetor aleatório com direção aleatória e magnitude especificada
     * @param {number} scalar - Magnitude do vetor (padrão: 1)
     * @returns {Vec} Novo vetor aleatório
     */
    static random(scalar = 1) {
        const angle = Math.random() * Math.PI * 2;
        return new Vec(Math.cos(angle) * scalar, Math.sin(angle) * scalar);
    }
}