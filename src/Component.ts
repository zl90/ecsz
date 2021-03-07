import { ObjectPool } from "./ObjectPool";
import { PropType } from "./Types";

export type ComponentSchemaProp = {
    default?: any;
    type: PropType<any>;
};

export type ComponentSchema = {
    [propName: string]: ComponentSchemaProp;
};

export interface ComponentCommon {
    schema: ComponentSchema;
    getName(): string;
}

export interface ComponentCtor<T extends Component<any>> {
    schema: ComponentSchema;
    getName(): string;
    new (props?: Partial<Omit<T["__initializersType"], keyof Component<any>>>): T;
    _typeId: number;
}

export class Component<T> {
    public __initializersType?: T;

    public static schema: ComponentSchema = {};

    public static getName(): string {
        return this.name;
    }

    public static _typeId = 0;

    public _pool: ObjectPool<this> | undefined;

    public constructor(props?: Partial<T>) {
        const schema = (this.constructor as ComponentCtor<this>).schema;
        for (const key in schema) {
            if (props && props.hasOwnProperty(key)) {
                (this as any)[key] = (props as any)[key];
            } else {
                const schemaProp = schema[key];
                if (schemaProp.hasOwnProperty("default")) {
                    (this as any)[key] = schemaProp.type.clone(schemaProp.default);
                } else {
                    const type = schemaProp.type;
                    (this as any)[key] = type.clone(type.default);
                }
            }
        }

        this._pool = undefined;
    }

    public copy(source: this): this {
        const schema = this.ctor.schema;

        for (const key in schema) {
            const prop = schema[key];

            if (source.hasOwnProperty(key)) {
                (this as any)[key] = prop.type.copy((source as any)[key], (this as any)[key]);
            }
        }

        return this;
    }

    public clone(): this {
        return new this.ctor().copy(this);
    }

    public reset(): void {
        const schema = this.ctor.schema;

        for (const key in schema) {
            const schemaProp = schema[key];

            if (schemaProp.hasOwnProperty("default")) {
                (this as any)[key] = schemaProp.type.copy(schemaProp.default, (this as any)[key]);
            } else {
                const type = schemaProp.type;
                (this as any)[key] = type.copy(type.default, (this as any)[key]);
            }
        }
    }

    public dispose(): void {
        if (this._pool) {
            this._pool.release(this);
        }
    }

    public getName(): string {
        return this.ctor.getName();
    }

    public get ctor(): ComponentCtor<this> {
        return this.constructor as ComponentCtor<this>;
    }
}
