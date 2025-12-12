
type A = {
    name: string
    list: string[]
    obj: { // obj
        a: {
            prop1: number[] // list
            prop2: {        // obj
                c: boolean
            }
            prop3: {        // dict
                [x: string]: number
            }
            prop4: {        // list of obj
                d: number
            }[]
            prop5: {        // list of dict
                [x: string]: boolean
            }[]
        },
        b: {
            prop6: string
            prop7: boolean
        }
    }
}

// New Method

type DoList<T extends any[], K> = K extends '*'|`$${number}`
    ? T[number]
    : never

type DoNoList<T, K> = K extends '*'|`$${number}`
    ? T[keyof T]
    : T[K & keyof T]

type Do<T, X> =
    T extends any[] ? DoList<T, X>
    : T extends object ? DoNoList<T, X>
    : never

type QueryModelpath<T, K> =
    K extends `${infer X}.${infer Y}`
        ? QueryModelpath<Do<T, X>, Y>
        : Do<T, K>

function model_new<P extends string>(p: P): QueryModelpath<A, P> {
    return {} as never
}

// Old Method

type Modelpath = 
    { 'name': string }
    & { 'list': string[] }
    & { 'list.*': string }
    & { [x: `list.$${number}`]: string }
    & { 'obj': { a: { prop1: number[], prop2: { c: boolean }, prop3: { [x: string]: number }, prop4: { d: number }[], prop5: { [x: string]: boolean }[] }, b: { prop6: string, prop7: boolean } } }
    & { 'obj.a': { prop1: number[], prop2: { c: boolean }, prop3: { [x: string]: number }, prop4: { d: number }[], prop5: { [x: string]: boolean }[] } }
    & { 'obj.a.prop1': number[] }
    & { 'obj.a.prop1.*': number }
    & { [x: `obj.a.prop1.$${number}`]: number }
    & { 'obj.a.prop2': { c: boolean } }
    & { 'obj.a.prop2.*': boolean }
    & { [x: `obj.a.prop2.$${number}`]: boolean }
    & { 'obj.a.prop3': { c: number } }
    & { 'obj.a.prop3.*': number }
    & { [x: `obj.a.prop3.$${number}`]: number }
    & { 'obj.a.prop4': { d: number }[] }
    & { 'obj.a.prop4.*': { d: number } }
    & { [x: `obj.a.prop4.$${number}`]: { d: number } }
    & { 'obj.a.prop4.*.*': number }
    & { [x: `obj.a.prop4.*.$${number}`]: number }
    & { [x: `obj.a.prop4.$${number}.*`]: number }
    & { [x: `obj.a.prop4.$${number}.$${number}`]: number }
    & { 'obj.a.prop5': { [x: string]: boolean }[] }
    & { 'obj.a.prop5.*': { [x: string]: boolean } }
    & { [x: `obj.a.prop5.$${number}`]: { [x: string]: boolean } }
    & { 'obj.a.prop5.*.*': boolean }
    & { [x: `obj.a.prop5.*.$${number}`]: boolean }
    & { [x: `obj.a.prop5.$${number}.*`]: boolean }
    & { [x: `obj.a.prop5.$${number}.$${number}`]: boolean }
    & { 'obj.b': { prop6: string, prop7: boolean } }
    & { 'obj.b.prop6': string }
    & { 'obj.b.prop7': string }
    
    & { 'obj.*': { prop1: number[], prop2: { c: boolean }, prop3: { [x: string]: number }, prop4: { d: number }[], prop5: { [x: string]: boolean }[] } | { prop4: string, prop5: boolean } }
    & { 'obj.*.prop1.*': number }
    & { [x: `obj.*.prop1.$${number}`]: number }
    & { 'obj.*.prop2': { c: boolean } }
    & { 'obj.*.prop2.*': boolean }
    & { [x: `obj.*.prop2.$${number}`]: boolean }
    & { 'obj.*.prop3': { c: number } }
    & { 'obj.*.prop3.*': number }
    & { [x: `obj.*.prop3.$${number}`]: number }
    & { 'obj.*.prop4': { d: number }[] }
    & { 'obj.*.prop4.*': { d: number } }
    & { [x: `obj.*.prop4.$${number}`]: { d: number } }
    & { 'obj.*.prop4.*.*': number }
    & { [x: `obj.*.prop4.*.$${number}`]: number }
    & { [x: `obj.*.prop4.$${number}.*`]: number }
    & { [x: `obj.*.prop4.$${number}.$${number}`]: number }
    & { 'obj.*.prop5': { [x: string]: boolean }[] }
    & { 'obj.*.prop5.*': { [x: string]: boolean } }
    & { [x: `obj.*.prop5.$${number}`]: { [x: string]: boolean } }
    & { 'obj.*.prop5.*.*': boolean }
    & { [x: `obj.*.prop5.*.$${number}`]: boolean }
    & { [x: `obj.*.prop5.$${number}.*`]: boolean }
    & { [x: `obj.*.prop5.$${number}.$${number}`]: boolean }
    & { 'obj.*.prop6': string }
    & { 'obj.*.prop7': string }
    
    & { [x: `obj.$${number}`]: { prop1: number[], prop2: { c: boolean }, prop3: { [x: string]: number }, prop4: { d: number }[], prop5: { [x: string]: boolean }[] } | { prop4: string, prop5: boolean } }
    & { [x: `obj.$${number}.prop1.*`]: number }
    & { [x: `obj.$${number}.prop1.$${number}`]: number }
    & { [x: `obj.$${number}.prop2`]: { c: boolean } }
    & { [x: `obj.$${number}.prop2.*`]: boolean }
    & { [x: `obj.$${number}.prop2.$${number}`]: boolean }
    & { [x: `obj.$${number}.prop3`]: { c: number } }
    & { [x: `obj.$${number}.prop3.*`]: number }
    & { [x: `obj.$${number}.prop3.$${number}`]: number }
    & { [x: `obj.$${number}.prop4`]: { d: number }[] }
    & { [x: `obj.$${number}.prop4.*`]: { d: number } }
    & { [x: `obj.$${number}.prop4.$${number}`]: { d: number } }
    & { [x: `obj.$${number}.prop4.*.*`]: number }
    & { [x: `obj.$${number}.prop4.*.$${number}`]: number }
    & { [x: `obj.$${number}.prop4.$${number}.*`]: number }
    & { [x: `obj.$${number}.prop4.$${number}.$${number}`]: number }
    & { [x: `obj.$${number}.prop5`]: { [x: string]: boolean }[] }
    & { [x: `obj.$${number}.prop5.*`]: { [x: string]: boolean } }
    & { [x: `obj.$${number}.prop5.$${number}`]: { [x: string]: boolean } }
    & { [x: `obj.$${number}.prop5.*.*`]: boolean }
    & { [x: `obj.$${number}.prop5.*.$${number}`]: boolean }
    & { [x: `obj.$${number}.prop5.$${number}.*`]: boolean }
    & { [x: `obj.$${number}.prop5.$${number}.$${number}`]: boolean }
    & { [x: `obj.$${number}.prop6`]: string }
    & { [x: `obj.$${number}.prop7`]: string }

function model_old<P extends keyof Modelpath>(p: P): Modelpath[P] {
    return {} as never
}

// Test

const old = model_old('obj.*.prop5.*.*');
// @ts-benchmark(old)
type OldModel = typeof old;

const _new = model_new('obj.*.prop5.*.*');
// @ts-benchmark(new)
type NewModel = typeof _new;