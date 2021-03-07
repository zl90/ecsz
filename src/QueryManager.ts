import { ComponentCtor } from "./Component";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";
import { Query } from "./Query";
import { queryKey } from "./Utils";

export default class QueryManager {
    private _entityManager: EntityManager;
    private _queries: { [name: string]: Query } = {};

    public constructor(entityManager: EntityManager) {
        this._entityManager = entityManager;

        // Queries indexed by a unique identifier for the components it has
        this._queries = {};
    }

    public onEntityRemoved(entity: Entity): void {
        for (var queryName in this._queries) {
            var query = this._queries[queryName];
            if (entity.queries.indexOf(query) !== -1) {
                query.removeEntity(entity);
            }
        }
    }

    public onEntityComponentAdded(entity: Entity, cclass: ComponentCtor<any>): void {
        // @todo Use bitmask for checking components?

        // Check each indexed query to see if we need to add this entity to the list
        for (const queryName in this._queries) {
            const query = this._queries[queryName];

            // Add the entity only if:
            // Component is in the query
            // and Entity has ALL the components of the query
            // and Entity is not already in the query
            if (!~query.cclasses.indexOf(cclass) || !query.match(entity) || ~query.entities.indexOf(entity)) continue;

            query.addEntity(entity);
        }
    }

    public onEntityComponentRemoved(entity: Entity, cclass: ComponentCtor<any>): void {
        for (var queryName in this._queries) {
            var query = this._queries[queryName];

            if (!!~query.cclasses.indexOf(cclass) && !!~query.entities.indexOf(entity) && !query.match(entity)) {
                query.removeEntity(entity);
                continue;
            }
        }
    }

    public getQuery(cclasses: ComponentCtor<any>[]): Query {
        var key = queryKey(cclasses);
        var query = this._queries[key];
        if (!query) {
            this._queries[key] = query = new Query(cclasses, this._entityManager);
        }
        return query;
    }
}
