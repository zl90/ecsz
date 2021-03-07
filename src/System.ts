import { ComponentCtor } from "./Component";
import { ComponentManager } from "./ComponentManager";
import { Entity } from "./Entity";
import { Query } from "./Query.js";
import { World } from "./World";

export interface Attributes {
    priority?: number;
    [propName: string]: any;
}

export interface SystemQueries {
    [queryName: string]: {
        components: ComponentCtor<any>[];
        mandatory?: boolean;
    };
}

export interface SystemCtor<T extends System> {
    queries?: SystemQueries;
    new (...args: any): T;
}

export abstract class System<T extends Entity = Entity> {
    public static getName(): string {
        return this.name;
    }

    public world: World<T>;
    public componentManager: ComponentManager;
    public enabled = true;
    public queries: {
        [queryName: string]: {
            results: T[];
        };
    } = {};
    public priority = 0;
    public executeTime = 0;
    public initialized = false;

    private _mandatoryQueries: Query[] = [];
    private _queries: { [name: string]: Query } = {};

    public canExecute(): boolean {
        if (this._mandatoryQueries.length === 0) return true;

        for (let i = 0; i < this._mandatoryQueries.length; i++) {
            var query = this._mandatoryQueries[i];
            if (query.entities.length === 0) {
                return false;
            }
        }

        return true;
    }

    public getName(): string {
        return this.constructor.name;
    }

    public execute(delta: number, time: number): void {}

    constructor(world: World<T>, attributes?: Attributes) {
        this.world = world;
        this.componentManager = world.componentsManager;

        if (attributes && attributes.priority) {
            this.priority = attributes.priority;
        }

        this.initialized = true;

        const queries = this.constructor ? (this.constructor as SystemCtor<this>).queries : undefined;
        if (queries) {
            for (var queryName in queries) {
                var queryConfig = queries[queryName];
                var cclasses = queryConfig.components;
                if (!cclasses || cclasses.length === 0) {
                    throw new Error("'components' attribute can't be empty in a query");
                }

                // Detect if the components have already been registered
                let unregisteredComponents = cclasses.filter((cclass) => !this.componentManager.hasComponent(cclass));

                if (unregisteredComponents.length > 0) {
                    throw new Error(
                        `Tried to create a query '${
                            this.constructor.name
                        }.${queryName}' with unregistered components: [${unregisteredComponents
                            .map((c) => c.getName())
                            .join(", ")}]`
                    );
                }

                var query = this.world.entityManager.queryComponents(cclasses);

                this._queries[queryName] = query;
                if (queryConfig.mandatory === true) {
                    this._mandatoryQueries.push(query);
                }
                this.queries[queryName] = {
                    results: query.entities as T[],
                };
            }
        }
    }

    public init(attributes?: Attributes): void {}

    public stop(): void {
        this.executeTime = 0;
        this.enabled = false;
    }

    public play(): void {
        this.enabled = true;
    }
}
