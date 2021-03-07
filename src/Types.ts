export type TypeNewFunction<T> = () => T;
export type TypeCopyFunction<T> = (src: T, dest: T) => T;
export type TypeCloneFunction<T> = (value: T) => T;

export interface PropTypeDefinition<T> {
    name: string;
    default: T | TypeNewFunction<T>;
    copy: TypeCopyFunction<T>;
    clone: TypeCloneFunction<T>;
}

export interface PropType<T> extends PropTypeDefinition<T> {
    isType: true;
}

export function copyValue<T>(src: T, dest: T): T {
    return src;
}
export function cloneValue<T>(value: T): T {
    return value;
}

export function copyArray<T extends Array<any>>(src: T, dest: T): T {
    if (!src) {
        return src;
    }

    if (!dest) {
        return src.slice() as T;
    }

    dest.length = 0;

    for (let i = 0; i < src.length; i++) {
        dest.push(src[i]);
    }

    return dest;
}

export function cloneArray<T extends Array<any>>(value: T): T {
    return value.slice(0) as T;
}

export function copyJSON(src: any, dest: any): any {
    return JSON.parse(JSON.stringify(src));
}

export function cloneJSON(value: any): any {
    return JSON.parse(JSON.stringify(value));
}

export function copyCopyable<T extends { clone: () => any; copy: (src: any) => any } = any>(src: T, dest: T): T {
    if (!src) {
        return src;
    }

    if (!dest) {
        return src.clone();
    }

    return dest.copy(src);
}

export function cloneClonable<T extends { clone: () => any } = any>(value: T): T {
    return value.clone();
}

export function createType<T>(typeDefinition: PropTypeDefinition<T>): PropType<T> {
    var mandatoryProperties = ["name", "default", "copy", "clone"];

    var undefinedProperties = mandatoryProperties.filter((p) => {
        return !typeDefinition.hasOwnProperty(p);
    });

    if (undefinedProperties.length > 0) {
        throw new Error(
            `createType expects a type definition with the following properties: ${undefinedProperties.join(", ")}`
        );
    }

    (typeDefinition as PropType<T>).isType = true;

    return typeDefinition as PropType<T>;
}

/**
 * Standard types
 */
export const Types = {
    Number: createType({
        name: "Number",
        default: 0,
        copy: copyValue,
        clone: cloneValue,
    }),

    Boolean: createType({
        name: "Boolean",
        default: false,
        copy: copyValue,
        clone: cloneValue,
    }),

    String: createType({
        name: "String",
        default: "",
        copy: copyValue,
        clone: cloneValue,
    }),

    Array: createType<[]>({
        name: "Array",
        default: [],
        copy: copyArray,
        clone: cloneArray,
    }),

    Ref: createType({
        name: "Ref",
        default: undefined,
        copy: copyValue,
        clone: cloneValue,
    }),

    JSON: createType({
        name: "JSON",
        default: null,
        copy: copyJSON,
        clone: cloneJSON,
    }),
};
