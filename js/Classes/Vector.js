export default class Vec {
    constructor(x=0,y=0){
        this.x = x;
        this.y = y;
    }
    //===================== BASIC UTILITIES =======================
    clone(){
        return new Vec(this.x, this.y);
    }
    toArray() {
        return [this.x, this.y];
    }
    toString() {
        return `Vector(${this.x}, ${this.y})`;
    }
    set(vector = {x:this.x, y:this.y}){
        this.x = vector.x;
        this.y = vector.y
    }
    //================== PROPERTIES ===============================
    get length() {
        return Math.sqrt((this.x**2)+ (this.y**2));
    }
    get isZero() {
        return this.x === 0 && this.y === 0;
    }
    //================= MUTATIONS =================================
    add(vector = {x:0, y:0}){
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    sub(vector = {x:0, y:0}){
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
    scale(scalar){
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    normalize(){ // limita o vetor a raio 1
        const len = this.length;
        if(len === 0) return this;
        this.x /= len;
        this.y /= len;
        return this;
    }
    rotate(angleRad) {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }
    // ============== NON-MUTATING ============================
    added(vector) {
        return this.clone().add(vector);
    }
    subbed(vector) {
        return this.clone().sub(vector);
    }
    scaled(scalar) {
        return this.clone().scale(scalar);
    }
    negated() {
        return this.clone().negate();
    }
    normalized() {
        return this.clone().normalize();
    }
    rotated(angleRad) {
        return this.clone().rotate(angleRad);
    }
    // =============== VECTOR MATH =============================
    dot(vector){
        return this.x*vector.x + this.y*vector.y
    }
    distanceTo(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt((dx**2) + (dy**2))
    }
    // =============== STATIC HELPERS ==========================
    static zero() { 
        return new Vec(0, 0); 
    }
    static fromArray(arr) {
        return new Vec(arr[0],arr[1]);
    }
    static add(vector1, vector2){
        return new Vec(vector1.x + vector2.x, vector1.y + vector2.y);
    }
    static sub(vector1, vector2){
        return new Vec(vector1.x - vector2.x, vector1.y - vector2.y);
    }
    static distance(vector1, vector2){
        return vector1.distanceTo(vector2)
    }
    static random(scalar = 1){
        const angle = Math.random() * Math.PI * 2;
        return new Vec(Math.cos(angle) * scalar, Math.sin(angle) * scalar);
    }
}