import { Component } from "../../src/Component";
import { Types } from "../../src/Types";

export class FooComponent extends Component<any> {}

FooComponent.schema = {
    variableFoo: { type: Types.Number },
};

export class BarComponent extends Component<any> {}

BarComponent.schema = {
    variableBar: { type: Types.Number },
};

export class EmptyComponent extends Component<any> {}
