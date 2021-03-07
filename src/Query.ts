import { ComponentCtor } from "./Component";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";
import { queryKey } from "./Utils";

export class Query {
    public cclasses: ComponentCtor<any>[] = [];
    public entities: Entity[] = [];
    public queryKey: string;

    constructor(cclasses: ComponentCtor<any>[], manager: EntityManager) {
        this.cclasses = cclasses.slice(0);

        if (this.cclasses.length === 0) {
            throw new Error("Can't create a query without components");
        }

        this.entities = [];

        this.queryKey = queryKey(this.cclasses);

        // Fill the query with the existing entities
        for (var i = 0; i < manager._entities.length; i++) {
            var entity = manager._entities[i];
            if (this.match(entity)) {
                entity.queries.push(this);
                this.entities.push(entity);
            }
        }
    }

    public addEntity(entity: Entity): void {
        entity.queries.push(this);
        this.entities.push(entity);
    }

    public removeEntity(entity: Entity): void {
        let index = this.entities.indexOf(entity);
        if (~index) {
            this.entities.splice(index, 1);

            index = entity.queries.indexOf(this);
            entity.queries.splice(index, 1);
        }
    }

    public match(entity: Entity): boolean {
        return entity.hasAllComponents(this.cclasses);
    }
}
