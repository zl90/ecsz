import { Component } from "./Component";
import { PropType, Types } from "./Types";

export function type<T>(type: PropType<T>, defaultValue?: T) {
    return (target: Component, name: string): void => {
        const ctor = target.constructor as typeof Component;
        ctor.schema[name] = {
            type: type,
            default: defaultValue,
        };
    };
}

class B extends Component {
    @type(Types.String, "testing")
    public word = "a";
}
