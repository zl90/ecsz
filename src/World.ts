import { ComponentCtor } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";
import { ObjectPool } from "./ObjectPool";
import { Attributes, System, SystemCtor } from "./System";
import { SystemManager } from "./SystemManager";
import { now } from "./Utils";

export interface WorldOptions {
    entityPoolSize?: number;
    [propName: string]: any;
}

const DEFAULT_OPTIONS = {
    entityPoolSize: 0,
    entityClass: Entity,
};

export class World<EntityType extends Entity = Entity> {
    public readonly options: WorldOptions;
    public readonly componentsManager: ComponentManager;
    public readonly entityManager: EntityManager;
    public readonly systemManager: SystemManager;
    public enabled = true;
    public lastTime: number;

    constructor(options: WorldOptions = {}) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);

        this.componentsManager = new ComponentManager();
        this.entityManager = new EntityManager(this);
        this.systemManager = new SystemManager(this);

        this.enabled = true;

        this.lastTime = now() / 1000;
    }

    public registerComponent(cclass: ComponentCtor<any>, objectPool?: ObjectPool<any> | false): World {
        this.componentsManager.registerComponent(cclass, objectPool);
        return this;
    }

    public registerSystem(sclass: SystemCtor<any>, attributes?: Attributes): World {
        this.systemManager.registerSystem(sclass, attributes);
        return this;
    }

    public hasRegisteredComponent(cclass: ComponentCtor<any>): boolean {
        return this.componentsManager.hasComponent(cclass);
    }

    public unregisterSystem(sclass: SystemCtor<any>): World {
        this.systemManager.unregisterSystem(sclass);
        return this;
    }

    public getSystem<T extends System<any>>(sclass: SystemCtor<T>): T {
        return this.systemManager.getSystem(sclass) as T;
    }

    public getSystems(): System[] {
        return this.systemManager.getSystems();
    }

    public execute(delta: number, time: number): void {
        if (!delta) {
            time = now() / 1000;
            delta = time - this.lastTime;
            this.lastTime = time;
        }

        if (this.enabled) {
            this.systemManager.execute(delta, time);
            this.entityManager.processDeferredRemoval();
        }
    }

    public stop(): void {
        this.enabled = false;
    }

    public play(): void {
        this.enabled = true;
    }

    public createEntity(name?: string): Entity {
        return this.entityManager.createEntity(name);
    }
}
