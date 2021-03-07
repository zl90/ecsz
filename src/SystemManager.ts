import { Attributes, System, SystemCtor } from "./System";
import { now } from "./Utils";
import { World } from "./World";

export class SystemManager {
    public world: World;
    public lastExecutedSystem: System | undefined = undefined;

    public _systems: System[] = [];

    public constructor(world: World) {
        this.world = world;
    }

    public registerSystem<T extends System>(sclass: SystemCtor<T>, attributes?: Attributes) {
        if (this.getSystem(sclass) !== undefined) {
            console.warn(`System '${sclass.name}' already registered.`);
            return this;
        }

        let system = new sclass(this.world, attributes);
        system.init(attributes);
        this._systems.push(system);
        return this;
    }

    public unregisterSystem(sclass: SystemCtor<any>): SystemManager {
        let system = this.getSystem(sclass);
        if (system === undefined) {
            return this;
        }

        this._systems.splice(this._systems.indexOf(system), 1);

        return this;
    }

    public getSystem<T extends System>(sclass: SystemCtor<T>): T | undefined {
        return this._systems.find((s) => s instanceof sclass) as T;
    }

    public getSystems(): System[] {
        return this._systems;
    }

    public removeSystem(sclass: SystemCtor<any>): void {
        let index = -1;
        for (let i = 0; i < this._systems.length; ++i) {
            if (this._systems[i] instanceof sclass) {
                index = i;
                break;
            }
        }

        if (index == -1) return;

        this._systems.splice(index, 1);
    }

    public executeSystem(system: System, delta: number, time: number) {
        if (system.initialized) {
            if (system.canExecute()) {
                let startTime = now();
                system.execute(delta, time);
                system.executeTime = now() - startTime;
                this.lastExecutedSystem = system;
            }
        }
    }

    public stop(): void {
        this._systems.forEach((system) => system.stop());
    }

    public execute(delta: number, time: number, forcePlay = false): void {
        this._systems.forEach((system) => (forcePlay || system.enabled) && this.executeSystem(system, delta, time));
    }
}
