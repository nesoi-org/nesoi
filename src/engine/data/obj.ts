/*
    Types
*/


export type NesoiObjId = number | string

export interface NesoiObj {
    id: NesoiObjId
}

export type NewOrOldObj<T extends NesoiObj> = { id?: T['id'] } & Omit<T,'id'>

/*
    Utility Types
*/

type DefinedKeys<T> = {
    [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never
}[keyof T]
type DefinedProps<T> = Pick<T, DefinedKeys<T>>

export type UndefinedToOptional<T> = Partial<T> & DefinedProps<T>

export type DeepUndefinedToOptional<T> = {
    [P in keyof T]?: T[P] extends object ? DeepUndefinedToOptional<T[P]> : T[P]
} & DefinedProps<T>;
