import test from "ava";
import { Component, ComponentCtor, World } from "../../src";
import { type } from "../../src/decorator";
import { Types } from "../../src/Types";

test("decorator", (t: any) => {
    class A extends Component {
        @type(Types.String, "hello")
        public word?: string;
    }

    const a = new A();
    t.is(a.word, "hello");
});
