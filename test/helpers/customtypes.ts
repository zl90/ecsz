export class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x?: number, y?: number, z?: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    public set(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toArray(): number[] {
        return [this.x, this.y, this.z];
    }

    public copy(src: Vector3): Vector3 {
        this.x = src.x;
        this.y = src.y;
        this.z = src.z;
        return this;
    }

    public clone(): Vector3 {
        return new Vector3().copy(this);
    }

    public equals(other: Vector3): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }
}
