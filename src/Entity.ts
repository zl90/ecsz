import { Component, ComponentCtor } from "./Component";
import { EntityManager } from "./EntityManager";
import { ObjectPool } from "./ObjectPool";
import { Query } from "./Query";

export class Entity {
    public id: number;
    public name: string = "";
    public _pool: ObjectPool<Entity> | undefined;
    public cclasses: ComponentCtor<any>[] = [];
    public queries: Query[] = [];
    public alive = false;

    public _entityManager: EntityManager;
    public _components: Component[] = [];
    public _componentsToRemove: Component[] = [];
    public _cclasses: ComponentCtor<any>[] = [];
    public _cclassesToRemove: ComponentCtor<any>[] = [];

    constructor(entityManager: EntityManager) {
        this._entityManager = entityManager || null;
        this.id = entityManager._nextEntityId++;
    }

    // COMPONENTS

    public getComponent<T extends Component<any>>(cclass: ComponentCtor<T>, includeRemoved = false): T | undefined {
        var component = this._components[cclass._typeId];
        if (!component && includeRemoved === true) {
            component = this._componentsToRemove[cclass._typeId];
        }
        return component as T;
    }

    public getComponentOrThrow<T extends Component<any>>(cclass: ComponentCtor<T>, includeRemoved = false): T {
        const component = this.getComponent(cclass, includeRemoved);
        if (!component) {
            throw new Error(`Component ${cclass.name} not found`);
        }
        return component;
    }

    public getRemovedComponent<T extends Component<any>>(cclass: ComponentCtor<T>): T | undefined {
        return this._componentsToRemove[cclass._typeId] as T;
    }

    public getComponents(): Component[] {
        return this._components;
    }

    public getComponentsToRemove(): Component[] {
        return this._componentsToRemove;
    }

    public getComponentTypes(): ComponentCtor<any>[] {
        return this._cclasses;
    }

    public addComponent<T extends Component<any>>(
        cclass: ComponentCtor<T>,
        initializer?: T["__initializersType"]
    ): Entity {
        this._entityManager.entityAddComponent(this, cclass, initializer);
        return this;
    }

    public removeComponent(cclass: ComponentCtor<any>, forceImmediate = false): Entity {
        this._entityManager.entityRemoveComponent(this, cclass, forceImmediate);
        return this;
    }

    public hasComponent(cclass: ComponentCtor<any>, includeRemoved = false): boolean {
        return !!~this._cclasses.indexOf(cclass) || (includeRemoved === true && this.hasRemovedComponent(cclass));
    }

    public hasRemovedComponent(cclass: ComponentCtor<any>): boolean {
        return !!~this._cclassesToRemove.indexOf(cclass);
    }

    public hasAllComponents(classes: ComponentCtor<any>[]): boolean {
        for (var i = 0; i < classes.length; i++) {
            if (!this.hasComponent(classes[i])) return false;
        }
        return true;
    }

    public hasAnyComponents(classes: ComponentCtor<any>[]): boolean {
        for (var i = 0; i < classes.length; i++) {
            if (this.hasComponent(classes[i])) return true;
        }
        return false;
    }

    public removeAllComponents(forceImmediate = false): Entity {
        this._entityManager.entityRemoveAllComponents(this, forceImmediate);
        return this;
    }

    public copy(src: Entity): Entity {
        // TODO: This can definitely be optimized
        for (var ecsyComponentId in src._components) {
            var srcComponent = src._components[ecsyComponentId];
            this.addComponent(srcComponent.constructor as ComponentCtor<any>);
            var component = this.getComponent(srcComponent.constructor as ComponentCtor<any>);
            component.copy(srcComponent);
        }
        return this;
    }

    public clone(): Entity {
        return new Entity(this._entityManager).copy(this);
    }

    public reset(): void {
        this.id = this._entityManager._nextEntityId++;
        this._cclasses.length = 0;
        this.queries.length = 0;

        for (const ecsyComponentId in this._components) {
            delete this._components[ecsyComponentId];
        }
    }

    public remove(forceImmediate = false): void {
        this._entityManager.removeEntity(this, forceImmediate);
    }
}
