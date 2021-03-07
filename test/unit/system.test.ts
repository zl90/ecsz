import test from "ava";
import { World, System, Component } from "../../src/index";
import { FooComponent, BarComponent, EmptyComponent } from "../helpers/components";
/*
test("Initialize", t => {
  var world = new World();

  class SystemA extends System {}
  class SystemB extends System {}
  class SystemC extends System {}
  class SystemD extends System {}
  class SystemE extends System {}

  // Register empty system
  world
    .registerSystem(SystemA)
    .registerSystem(SystemB)
    .registerSystem(SystemC)
    .registerSystem(SystemD)
    .registerSystem(SystemE);

  t.deepEqual(
    world.systemManager.getSystems().map(s => {
      return s.getName();
    }),
    ["SystemA", "SystemB", "SystemC", "SystemD", "SystemE"]
  );

  world = new World();
  world
    .registerSystem(SystemA)
    .registerSystem(SystemB, { priority: 2 })
    .registerSystem(SystemC, { priority: -1 })
    .registerSystem(SystemD)
    .registerSystem(SystemE);

  t.deepEqual(
    world.systemManager.getSystems().map(s => {
      return s.getName();
    }),
    ["SystemC", "SystemA", "SystemD", "SystemE", "SystemB"]
  );
  world.execute();
});
*/

test("Empty queries", (t: any) => {
    var world = new World();

    // System 1
    class SystemEmpty1 extends System {}

    // System 2
    class SystemEmpty2 extends System {
        static queries = {};
    }

    // System 3
    class SystemEmpty3 extends System {
        static queries = {
            entities: {},
        };
    }

    // System 4
    class SystemEmpty4 extends System {
        static queries = {
            entities: { components: [] },
        };
    }

    // Register empty system
    world.registerSystem(SystemEmpty1).registerSystem(SystemEmpty2);

    t.deepEqual((world.systemManager.getSystem(SystemEmpty1) as any).queries, {});
    t.deepEqual((world.systemManager.getSystem(SystemEmpty2) as any).queries, {});

    const error = t.throws(() => {
        world.registerSystem(SystemEmpty3 as any);
    });

    t.is(error.message, "'components' attribute can't be empty in a query");
    const error2 = t.throws(() => {
        world.registerSystem(SystemEmpty4);
    });
    t.is(error2.message, "'components' attribute can't be empty in a query");
});

test("Queries", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent).registerComponent(EmptyComponent);

    for (var i = 0; i < 15; i++) {
        var entity = world.createEntity();
        if (i < 10) entity.addComponent(FooComponent);
        if (i >= 5) entity.addComponent(BarComponent);
        entity.addComponent(EmptyComponent);
    }

    class SystemFoo extends System {
        static queries = {
            entities: { components: [FooComponent] },
        };
    }

    class SystemBar extends System {
        static queries = {
            entities: { components: [BarComponent] },
        };
    }

    class SystemBoth extends System {
        static queries = {
            entities: { components: [FooComponent, BarComponent] },
        };
    }

    world.registerSystem(SystemFoo).registerSystem(SystemBar).registerSystem(SystemBoth);

    // Foo
    t.is((world.systemManager.getSystem(SystemFoo) as any).queries.entities.results.length, 10);
    // Bar
    t.is((world.systemManager.getSystem(SystemBar) as any).queries.entities.results.length, 10);
    // Both
    t.is((world.systemManager.getSystem(SystemBoth) as any).queries.entities.results.length, 5);
});

test("Queries with sync removal", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent);

    // 10 Foo
    // 10 Bar
    for (var i = 0; i < 10; i++) {
        var entity = world.createEntity();
        entity.addComponent(FooComponent);
    }

    class SystemA extends System {
        execute() {
            var entities = this.queries.entities.results;
            for (var i = 0; i < entities.length; i++) {
                entities[i].remove(true);
            }
        }

        static queries = {
            entities: {
                components: [FooComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    class SystemB extends System {
        execute() {
            var entities = this.queries.entities.results;
            for (var i = 0, l = entities.length; i < l; i++) {
                entities[i].remove(true);
            }
        }

        static queries = {
            entities: {
                components: [FooComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    world.registerSystem(SystemA).registerSystem(SystemB);

    var systemA = world.systemManager.getSystems()[0];
    var systemB = world.systemManager.getSystems()[1];

    var entitiesA = systemA.queries.entities.results;
    var entitiesB = systemA.queries.entities.results;

    // Sync standard remove invalid loop
    t.is(entitiesA.length, 10);

    systemA.execute(0, 0);

    // Just removed half because of the sync update of the array that throws an exception
    t.is(entitiesA.length, 5);

    // Sync standard remove with stored length on invalid loop
    t.is(entitiesB.length, 5);
    const error = t.throws(() => {
        systemB.execute(0, 0);
    });

    t.is(error.message, "Cannot read property 'remove' of undefined");

    // Just removed half because of the sync update of the array that throws an exception
    t.is(entitiesB.length, 2);
});

test("Queries with deferred removal", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent).registerComponent(EmptyComponent);

    for (var i = 0; i < 6; i++) {
        var entity = world.createEntity();
        if (i < 4) entity.addComponent(FooComponent);
        if (i >= 2) entity.addComponent(BarComponent);
    }

    class SystemF extends System {
        execute() {
            this.queries.entities.results[1].remove();
            this.queries.entities.results[0].remove();
        }

        static queries = {
            entities: {
                components: [FooComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    class SystemFB extends System {
        execute() {
            // @todo Instead of removing backward should it work also forward?
            var entities = this.queries.entities.results;
            for (let i = entities.length - 1; i >= 0; i--) {
                entities[i].remove();
            }
        }

        static queries = {
            entities: {
                components: [FooComponent, BarComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    class SystemB extends System {
        static queries = {
            entities: {
                components: [BarComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    world.registerSystem(SystemF).registerSystem(SystemFB).registerSystem(SystemB);

    var systemF = world.systemManager.getSystem(SystemF) as any;
    var systemFB = world.systemManager.getSystem(SystemFB) as any;
    var systemB = world.systemManager.getSystem(SystemB) as any;

    var entitiesF = systemF.queries.entities.results;
    var entitiesFB = systemFB.queries.entities.results;
    var entitiesB = systemB.queries.entities.results;

    // [F,F,FB,FB,B,B]
    t.is(entitiesF.length, 4);
    t.is(entitiesFB.length, 2);
    t.is(entitiesB.length, 4);

    //world.execute();
    systemF.execute();

    // [-F,-F,FB,FB,B,B]
    // [FB,FB,B, B]
    t.is(entitiesF.length, 2);
    t.is(entitiesFB.length, 2);
    t.is(entitiesB.length, 4);

    // Force remove on systemB
    // [-FB,-FB, B, B]
    // [B, B]
    systemFB.execute();
    t.is(entitiesF.length, 0);
    t.is(entitiesFB.length, 0);
    t.is(entitiesB.length, 2);

    // Process the deferred removals of entities
    t.is(world.entityManager._entities.length, 6);
    t.is(world.entityManager._entityPool.totalUsed(), 6);
    world.entityManager.processDeferredRemoval();
    t.is(world.entityManager._entityPool.totalUsed(), 2);
    t.is(world.entityManager._entities.length, 2);
});

test("Queries removing multiple components", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent).registerComponent(EmptyComponent);

    for (var i = 0; i < 6; i++) {
        var entity = world.createEntity();
        entity.addComponent(FooComponent).addComponent(BarComponent);
    }

    class SystemA extends System {
        execute() {}

        static queries = {
            entities: {
                components: [FooComponent, BarComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    world.registerSystem(SystemA);

    var systemA = world.systemManager.getSystem(SystemA) as any;
    var query = (systemA as any).queries.entities;
    var entitiesA = query.results;

    // Remove one entity => entityRemoved x1
    t.is(entitiesA.length, 6);
    world.entityManager._entities[0].remove();
    t.is(entitiesA.length, 5);
    systemA.execute(0, 0);

    // Remove both components => entityRemoved x1
    world.entityManager._entities[1].removeComponent(FooComponent);
    t.is(entitiesA.length, 4);
    systemA.execute();
    // Remove second component => It will be the same result
    world.entityManager._entities[1].removeComponent(BarComponent);
    t.is(entitiesA.length, 4);
    systemA.execute();

    // Remove entity and component deferred
    world.entityManager._entities[2].remove();
    world.entityManager._entities[2].removeComponent(FooComponent);
    world.entityManager._entities[2].removeComponent(BarComponent);
    t.is(entitiesA.length, 3);
    systemA.execute();

    // Check deferred queues
    t.is(world.entityManager._entities.length, 6);
    t.is(world.entityManager.entitiesToRemove.length, 2);
    t.is(world.entityManager.entitiesWithComponentsToRemove.length, 3);

    t.is(world.entityManager._entityPool.totalUsed(), 6);
    world.entityManager.processDeferredRemoval();
    t.is(world.entityManager.entitiesWithComponentsToRemove.length, 0);
    t.is(world.entityManager._entityPool.totalUsed(), 4);
    t.is(world.entityManager._entities.length, 4);
    t.is(world.entityManager.entitiesToRemove.length, 0);
});

test("Querries removing deferred components", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent);

    for (var i = 0; i < 6; i++) {
        var entity = world.createEntity();
        if (i < 4) entity.addComponent(FooComponent);
        if (i >= 2) entity.addComponent(BarComponent);
    }

    class SystemF extends System {
        execute() {
            this.queries.entities.results[0].removeComponent(FooComponent);
        }

        static queries = {
            entities: {
                components: [FooComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    class SystemFB extends System {
        execute() {
            // @todo Instead of removing backward should it work also forward?
            var entities = this.queries.entities.results;
            for (let i = entities.length - 1; i >= 0; i--) {
                entities[i].removeComponent(BarComponent);
            }
        }

        static queries = {
            entities: {
                components: [FooComponent, BarComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }

    class SystemB extends System {
        static queries = {
            entities: {
                components: [BarComponent],
                listen: {
                    removed: true,
                },
            },
        };
    }
    world.registerSystem(SystemF).registerSystem(SystemFB).registerSystem(SystemB);

    var systemF = world.systemManager.getSystems()[0];
    var systemFB = world.systemManager.getSystems()[1];
    var systemB = world.systemManager.getSystems()[2];

    var entitiesF = systemF.queries.entities.results;
    var entitiesFB = systemFB.queries.entities.results;
    var entitiesB = systemB.queries.entities.results;

    // [F,F,FB,FB,B,B]
    t.is(entitiesF.length, 4);
    t.is(entitiesFB.length, 2);
    t.is(entitiesB.length, 4);

    //world.execute();
    systemF.execute(0, 0);

    // [-F,F,FB,FB,B,B]
    // [F, FB,FB,B, B]
    t.is(entitiesF.length, 3);
    t.is(entitiesFB.length, 2);
    t.is(entitiesB.length, 4);

    // Force remove on systemB
    // [F, F-B,F-B, B, B]
    // [F, F, F]
    systemFB.execute(0, 0);

    t.is(entitiesF.length, 3);
    t.is(entitiesFB.length, 0);
    t.is(entitiesB.length, 2);

    // Process the deferred removals of components
    t.is(world.entityManager.entitiesWithComponentsToRemove.length, 3);
    world.entityManager.processDeferredRemoval();
    t.is(world.entityManager.entitiesWithComponentsToRemove.length, 0);
});

test("Queries with 'mandatory' parameter", (t: any) => {
    var counter = {
        a: 0,
        b: 0,
        c: 0,
    };

    class SystemA extends System {
        execute() {
            counter.a++;
        }

        static queries = {
            entities: { components: [FooComponent], mandatory: false },
        };
    }

    class SystemB extends System {
        execute() {
            counter.b++;
        }

        static queries = {
            entities: { components: [FooComponent], mandatory: true },
        };
    }

    class SystemC extends System {
        execute() {
            counter.c++;
        }

        static queries = {
            entities: { components: [BarComponent], mandatory: true },
        };
    }

    // -------
    var world = new World();

    world.registerComponent(FooComponent).registerComponent(BarComponent);

    var entity = world.createEntity();

    world
        .registerSystem(SystemA) // FooComponent
        .registerSystem(SystemB) // Mandatory FooComponent
        .registerSystem(SystemC); // Mandatory BarComponent

    world.execute(0, 0);
    t.deepEqual(counter, { a: 1, b: 0, c: 0 });

    entity.addComponent(FooComponent);

    world.execute(0, 0);
    t.deepEqual(counter, { a: 2, b: 1, c: 0 });

    entity.addComponent(BarComponent);

    world.execute(0, 0);
    t.deepEqual(counter, { a: 3, b: 2, c: 1 });

    entity.removeComponent(FooComponent);

    world.execute(0, 0);
    t.deepEqual(counter, { a: 4, b: 2, c: 2 });
});

test("Get Systems", (t: any) => {
    var world = new World();

    class SystemA extends System {}
    class SystemB extends System {}
    class SystemC extends System {}

    // Register empty system
    world.registerSystem(SystemA).registerSystem(SystemB);

    t.true(world.getSystem(SystemA) instanceof SystemA);
    t.true(world.getSystem(SystemB) instanceof SystemB);
    t.true(typeof world.getSystem(SystemC) === "undefined");

    var systems = world.getSystems();
    t.deepEqual(systems, world.systemManager._systems);
});

test("Systems without queries", (t: any) => {
    var world = new World();

    var counter = 0;
    class SystemA extends System {
        execute() {
            counter++;
        }
    }

    // Register empty system
    world.registerSystem(SystemA);

    t.is(counter, 0);
    for (var i = 0; i < 10; i++) {
        world.execute(0, 0);
    }
    t.is(counter, 10);
});

test("Systems with component case sensitive", (t: any) => {
    var world = new World();

    class A extends Component {}
    class a extends Component {}

    world.registerComponent(A).registerComponent(a);

    var counter = { a: 0, A: 0 };

    class System_A extends System {
        execute() {
            this.queries.A.results.forEach(() => counter.A++);
        }

        static queries = { A: { components: [A] } };
    }

    class System_a extends System {
        execute() {
            this.queries.a.results.forEach(() => counter.a++);
        }

        static queries = { a: { components: [a] } };
    }

    // Register empty system
    world.registerSystem(System_A);
    world.registerSystem(System_a);

    world.execute(0, 0);
    t.deepEqual(counter, { a: 0, A: 0 });
    let entity_A = world.createEntity();

    entity_A.addComponent(A);
    world.execute(0, 0);
    t.deepEqual(counter, { a: 0, A: 1 });

    let entity_a = world.createEntity();
    entity_a.addComponent(a);
    world.execute(0, 0);
    t.deepEqual(counter, { a: 1, A: 2 });

    entity_A.removeComponent(A);
    world.execute(0, 0);
    t.deepEqual(counter, { a: 2, A: 2 });
});

test("Components with the the same name in uppercase and lowercase", (t: any) => {
    class B extends Component {}

    class b extends Component {}

    class S extends System {
        execute() {
            this.queries.S.results.forEach((entity) => console.log(entity.getComponents()));
        }

        static queries = { S: { components: [B, b] } };
    }

    const world = new World();

    world.registerComponent(B).registerComponent(b);

    world.registerSystem(S);
    world.createEntity().addComponent(B).addComponent(b);

    let query = world.getSystem(S).queries.S;
    let entity = query.results[0];
    let components = entity.getComponents();

    t.deepEqual(
        Object.keys(components).map((c) => parseInt(c)),
        [B._typeId, b._typeId]
    );

    t.deepEqual(
        Object.values(components).map((c) => c.getName()),
        ["B", "b"]
    );
});

test("Unregister systems", (t: any) => {
    class SystemA extends System {}

    class SystemB extends System {
        execute() {}
    }

    const world = new World();
    world.registerSystem(SystemA).registerSystem(SystemB);

    t.is(world.systemManager._systems.length, 2);

    world.unregisterSystem(SystemA);
    t.is(world.systemManager._systems.length, 1);

    world.unregisterSystem(SystemB);
    t.is(world.systemManager._systems.length, 0);
});

test("Register a system that does not extend System", (t: any) => {
    class SystemA {}

    const world = new World();
    const error = t.throws(() => {
        world.registerSystem(SystemA);
    });

    t.true(!!error.message);
});
