import { Component, ComponentCtor } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { Entity } from "./Entity";
import { ObjectPool } from "./ObjectPool";
import { Query } from "./Query";
import QueryManager from "./QueryManager";
import { World } from "./World";

class EntityPool extends ObjectPool<Entity> {
    public entityManager: EntityManager;

    constructor(entityManager: EntityManager, entityClass: { new (): Entity }, initialSize?: number) {
        super(entityClass, undefined);
        this.entityManager = entityManager;

        if (typeof initialSize !== "undefined") {
            this.expand(initialSize);
        }
    }

    public expand(count: number): void {
        for (var n = 0; n < count; n++) {
            var clone = new this.ctor(this.entityManager);
            clone._pool = this;
            this.freeList.push(clone);
        }
        this.count += count;
    }
}

/**
 * @private
 * @class EntityManager
 */
export class EntityManager {
    public readonly world: World;
    public readonly componentsManager: ComponentManager;
    public readonly _entities: Entity[] = [];
    public _nextEntityId = 0;
    public entitiesWithComponentsToRemove: Entity[] = [];
    public entitiesToRemove: Entity[] = [];
    public deferredRemovalEnabled = true;

    public _entitiesByNames: { [name: string]: Entity } = {};
    public _queryManager: QueryManager;
    public _entityPool: EntityPool;

    constructor(world: World) {
        this.world = world;
        this.componentsManager = world.componentsManager;

        this._queryManager = new QueryManager(this);
        this._entityPool = new EntityPool(this, this.world.options.entityClass, this.world.options.entityPoolSize);
    }

    public getEntityByName(name: string): Entity {
        return this._entitiesByNames[name];
    }

    public createEntity(name?: string): Entity {
        let entity = this._entityPool.acquire();
        entity.alive = true;
        entity.name = name || "";
        if (name) {
            if (this._entitiesByNames[name]) {
                console.warn(`Entity name '${name}' already exist`);
            } else {
                this._entitiesByNames[name] = entity;
            }
        }

        this._entities.push(entity);
        return entity;
    }

    public entityAddComponent<T extends Component<any>>(
        entity: Entity,
        cclass: ComponentCtor<T>,
        values?: T["__initializersType"]
    ) {
        if (!this.world.componentsManager.hasComponent(cclass)) {
            throw new Error(`Attempted to add unregistered component "${Component.getName()}"`);
        }

        if (~entity._cclasses.indexOf(cclass)) {
            return;
        }

        entity._cclasses.push(cclass);

        let componentPool = this.world.componentsManager.getComponentsPool(cclass);

        let component = componentPool ? componentPool.acquire() : new cclass(values);

        if (componentPool && values) {
            component.copy(values);
        }

        entity._components[cclass._typeId] = component;

        this._queryManager.onEntityComponentAdded(entity, cclass);
        this.world.componentsManager.componentAddedToEntity(cclass);
    }

    public entityRemoveComponent(entity: Entity, cclass: ComponentCtor<any>, immediately = false) {
        let index = entity._cclasses.indexOf(cclass);
        if (!~index) return;

        if (immediately) {
            this._entityRemoveComponentSync(entity, cclass, index);
        } else {
            if (entity._cclassesToRemove.length === 0) this.entitiesWithComponentsToRemove.push(entity);

            entity._cclasses.splice(index, 1);
            entity._cclassesToRemove.push(cclass);

            entity._componentsToRemove[cclass._typeId] = entity._components[cclass._typeId];
            delete entity._components[cclass._typeId];
        }

        // Check each indexed query to see if we need to remove it
        this._queryManager.onEntityComponentRemoved(entity, cclass);
    }

    private _entityRemoveComponentSync(entity: Entity, cclass: ComponentCtor<any>, index: number) {
        // Remove T listing on entity and property ref, then free the component.
        entity._cclasses.splice(index, 1);
        let component = entity._components[cclass._typeId];
        delete entity._components[cclass._typeId];
        component.dispose();
        this.world.componentsManager.componentRemovedFromEntity(cclass);
    }

    public entityRemoveAllComponents(entity: Entity, immediately = false) {
        let cclasses = entity._cclasses;

        for (let j = cclasses.length - 1; j >= 0; j--) {
            this.entityRemoveComponent(entity, cclasses[j], immediately);
        }
    }

    public removeEntity(entity: Entity, immediately = false) {
        var index = this._entities.indexOf(entity);

        if (!~index) throw new Error("Tried to remove entity not in list");

        entity.alive = false;
        this.entityRemoveAllComponents(entity, immediately);

        // Remove from entity list
        this._queryManager.onEntityRemoved(entity);
        if (immediately === true) {
            this._releaseEntity(entity, index);
        } else {
            this.entitiesToRemove.push(entity);
        }
    }

    private _releaseEntity(entity: Entity, index: number) {
        this._entities.splice(index, 1);

        if (this._entitiesByNames[entity.name]) {
            delete this._entitiesByNames[entity.name];
        }

        if (entity && entity._pool) {
            entity._pool.release(entity);
        }
    }

    public removeAllEntities(): void {
        for (var i = this._entities.length - 1; i >= 0; i--) {
            this.removeEntity(this._entities[i]);
        }
    }

    public processDeferredRemoval(): void {
        if (!this.deferredRemovalEnabled) {
            return;
        }

        for (let i = 0; i < this.entitiesToRemove.length; i++) {
            let entity = this.entitiesToRemove[i];
            let index = this._entities.indexOf(entity);
            this._releaseEntity(entity, index);
        }
        this.entitiesToRemove.length = 0;

        for (let i = 0; i < this.entitiesWithComponentsToRemove.length; i++) {
            let entity = this.entitiesWithComponentsToRemove[i];
            while (entity._cclassesToRemove.length > 0) {
                let cclass = entity._cclassesToRemove.pop();
                if (cclass) {
                    var component = entity._componentsToRemove[cclass._typeId];
                    delete entity._componentsToRemove[cclass._typeId];
                    component.dispose();
                    this.world.componentsManager.componentRemovedFromEntity(cclass);
                }

                //this._entityRemoveComponentSync(entity, Component, index);
            }
        }

        this.entitiesWithComponentsToRemove.length = 0;
    }

    public queryComponents(cclass: ComponentCtor<any>[]): Query {
        return this._queryManager.getQuery(cclass);
    }

    public count(): number {
        return this._entities.length;
    }
}
