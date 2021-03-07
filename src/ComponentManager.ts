import { Component, ComponentCtor } from "./Component";
import { ObjectPool } from "./ObjectPool";

export class ComponentManager {
    public _componentClasses: ComponentCtor<any>[] = [];
    public _componentClassesMap: { [name: string]: ComponentCtor<any> } = {};
    public _componentPool: { [name: string]: ObjectPool<any> } = Object.create(null);
    public _numComponents: { [name: string]: number } = Object.create(null);
    public nextComponentId = 0;

    public hasComponent(cclass: ComponentCtor<any>) {
        return this._componentClasses.indexOf(cclass) !== -1;
    }

    public registerComponent<T extends Component<any>>(cclass: ComponentCtor<T>, pool?: ObjectPool<T> | boolean): void {
        if (this._componentClasses.indexOf(cclass) !== -1) {
            console.warn(`Component type: '${cclass.getName()}' already registered.`);
            return;
        }

        const schema = cclass.schema;

        if (!schema) {
            throw new Error(`Component "${cclass.getName()}" has no schema property.`);
        }

        for (const propName in schema) {
            const prop = schema[propName];

            if (!prop.type) {
                throw new Error(
                    `Invalid schema for component "${cclass.getName()}". Missing type for "${propName}" property.`
                );
            }
        }

        cclass._typeId = this.nextComponentId++;
        this._componentClasses.push(cclass);
        this._componentClassesMap[cclass._typeId] = cclass;
        this._numComponents[cclass._typeId] = 0;

        if (pool === undefined) {
            pool = new ObjectPool(cclass);
        } else if (pool === false) {
            pool = undefined;
        }

        this._componentPool[cclass._typeId] = pool as ObjectPool<T>;
    }

    public componentAddedToEntity(cclass: ComponentCtor<any>): void {
        this._numComponents[cclass._typeId]++;
    }

    public componentRemovedFromEntity(cclass: ComponentCtor<any>): void {
        this._numComponents[cclass._typeId]--;
    }

    public getComponentsPool<T extends Component<any>>(cclass: ComponentCtor<T>): ObjectPool<T> {
        return this._componentPool[cclass._typeId];
    }
}
