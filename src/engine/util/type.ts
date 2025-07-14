// Type used to replace properties on a type

// This should be used when adding properties to a type that must
// invalidate a previous property with the same name, such as overriding
// the module messages with inline messages in a BlockBuilder

export type Overlay<To, From> = Omit<To, keyof From> & From


// "keyof { a: any } | { b: any }" returns "never"
// This is required instead
export type KeysOfUnion<T> = T extends T ? keyof T: never;

export type MergeUnion<T> = {
    [K in T extends T ? keyof T : never]:
        T extends { [J in K]: any } ? T[K] : never
}

export type UnionToIntersection<T> = { [K in T as K & string]: K }[any]
