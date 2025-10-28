import Vector from './Vector';
export default class Box {
    constructor(x = 0, y = 0, width = 8, height = 8){
        this.pos = new Vector(x, y)
        this.width = width;
        this.height = height;
    }
}