import { ComponentCtor } from "./Component";

export function getName(cclass: ComponentCtor<any>) {
    return cclass.name;
}

export function componentPropertyName(cclass: ComponentCtor<any>) {
    return getName(cclass);
}

export function queryKey(cclasses: ComponentCtor<any>[]) {
    var ids = [];
    for (var n = 0; n < cclasses.length; n++) {
        ids.push(cclasses[n]._typeId);
    }

    return ids.sort().join("-");
}

// Detector for browser's "window"
export const hasWindow = typeof window !== "undefined";

// performance.now() "polyfill"
export const now =
    hasWindow && typeof window.performance !== "undefined" ? performance.now.bind(performance) : Date.now.bind(Date);
