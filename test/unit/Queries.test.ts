import test from "ava";
import { Entity } from "../../src/Entity";
import { World, System, Component } from "../../src/index";
import { FooComponent, BarComponent } from "../helpers/components";

function queriesLength(queries: any) {
    let result: any = {};
    Object.entries(queries).forEach((q) => {
        const name = q[0];
        const values = q[1];
        result[name] = (values as any).length;
    });

    return result;
}

test("Reactive queries with Not operator", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent);

    // System 1
    class SystemTest extends System {
        execute() {}

        static queries = {
            normal: {
                components: [FooComponent, BarComponent],
            },
        };
    }

    // Register empty system
    world.registerSystem(SystemTest);

    let system = world.systemManager.getSystem(SystemTest);

    // Both queries starts empty
    t.deepEqual(queriesLength((system as any).queries.normal), {
        results: 0,
    });

    //
    let entity = world.createEntity().addComponent(FooComponent);

    // It doesn't match the `BarComponent`
    t.deepEqual(queriesLength((system as any).queries.normal), {
        results: 0,
    });

    // clean up reactive queries
    world.execute(0, 0);

    entity.addComponent(BarComponent);

    // It matches the `BarComponent`
    t.deepEqual(queriesLength((system as any).queries.normal), {
        results: 1,
    });

    // clean up
    world.execute(0, 0);
    entity.removeComponent(BarComponent);

    // It doesn't match `BarComponent` anymore, so it's being removed
    t.deepEqual(queriesLength((system as any).queries.normal), {
        results: 0,
    });
});

test("Entity living just within the frame", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent);

    // System 1
    class SystemTest extends System {
        execute() {}
        static queries = {
            normal: {
                components: [FooComponent],
            },
        };
    }

    // Register empty system
    world.registerSystem(SystemTest);

    let system = world.systemManager.getSystem(SystemTest);
    let query = (system as any).queries.normal;

    // Query starts empty
    t.deepEqual(queriesLength(query), {
        results: 0,
    });

    let entity = world.createEntity().addComponent(FooComponent);

    // Adding `FooComponent` on frame #0 it's added and matches the results query too
    t.deepEqual(queriesLength(query), {
        results: 1,
    });

    let resultEntity = query ? query.results[0] : undefined;

    t.true(resultEntity.getComponent(FooComponent) !== undefined);

    entity.removeComponent(FooComponent);

    // After removing the component on the same frame #0, it's still in the `added` list
    // added also to the `remove` list, but removed from the `results`
    t.deepEqual(queriesLength(query), {
        results: 0,
    });

    // Advance 1 frame
    world.execute(0, 0);

    // Now it's not available anymore as it was purged
    t.deepEqual(queriesLength(query), {
        results: 0,
    });
});

test("Two components with the same name get unique queries", (t: any) => {
    const world = new World();

    // Create two components that have the same name.
    function createComponentClass() {
        return class TestComponent extends Component {};
    }
    const Component1 = createComponentClass();
    const Component2 = createComponentClass();
    world.registerComponent(Component1);
    world.registerComponent(Component2);
    t.is(Component1.name, Component2.name);

    // Create an entity for each component.
    const entity1 = world.createEntity().addComponent(Component1);
    const entity2 = world.createEntity().addComponent(Component2);

    // Define two queries, one for each entity.
    class SystemTest extends System {
        execute() {}
        static queries = {
            comp1: { components: [Component1] },
            comp2: { components: [Component2] },
        };
    }

    world.registerSystem(SystemTest);

    // Verify that the query system can identify them as unique components.
    const system = world.systemManager.getSystem(SystemTest);
    const query1Entity = (system as any).queries.comp1.results[0];
    const query2Entity = (system as any).queries.comp2.results[0];

    t.is(query1Entity.id, entity1.id);
    t.is(query2Entity.id, entity2.id);
});
