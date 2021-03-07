import test from "ava";
import { World, Component } from "../../src/index";
import { FooComponent, BarComponent } from "../helpers/components";

test("registerComponents", (t: any) => {
    var world = new World();

    world.registerComponent(FooComponent);
    t.is(Object.keys(world.componentsManager._componentClasses).length, 1);
    world.registerComponent(BarComponent);
    t.is(Object.keys(world.componentsManager._componentClasses).length, 2);

    // Can't register the same component twice
    world.registerComponent(FooComponent);
    t.is(Object.keys(world.componentsManager._componentClasses).length, 2);
});

test("Register two components with the same name", (t: any) => {
    var world = new World();

    {
        class ComponentA extends Component<any> {}
        world.registerComponent(ComponentA);
    }

    {
        class ComponentA extends Component<any> {}
        world.registerComponent(ComponentA);
    }

    t.is(Object.keys(world.componentsManager._componentClasses).length, 2);
});
