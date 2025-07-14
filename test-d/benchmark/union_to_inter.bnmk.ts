
type FunctionUnion =
    (() => void)
    | ((a0: string) => void)
    | ((a0: string, b0: number) => { c0: boolean })
    | { b0: number, c0: string }
    | ({ d0: boolean, e0: Date } & { f0: number })
    | { g0: string[] }

    | ((a1: string) => void)
    | ((a1: string, b1: number) => { c1: boolean })
    | { b1: number, c1: string }
    | ({ d1: boolean, e1: Date } & { f1: number })
    | { g1: string[] }

    | ((a2: string) => void)
    | ((a2: string, b2: number) => { c2: boolean })
    | { b2: number, c2: string }
    | ({ d2: boolean, e2: Date } & { f2: number })
    | { g2: string[] }

    | ((a3: string) => void)
    | ((a3: string, b3: number) => { c3: boolean })
    | { b3: number, c3: string }
    | ({ d3: boolean, e3: Date } & { f3: number })
    | { g3: string[] }

    | ((a4: string) => void)
    | ((a4: string, b4: number) => { c4: boolean })
    | { b4: number, c4: string }
    | ({ d4: boolean, e4: Date } & { f4: number })
    | { g4: string[] }

    | ((a5: string) => void)
    | ((a5: string, b5: number) => { c5: boolean })
    | { b5: number, c5: string }
    | ({ d5: boolean, e5: Date } & { f5: number })
    | { g5: string[] }

    | ((a6: string) => void)
    | ((a6: string, b6: number) => { c6: boolean })
    | { b6: number, c6: string }
    | ({ d6: boolean, e6: Date } & { f6: number })
    | { g6: string[] }

    | ((a7: string) => void)
    | ((a7: string, b7: number) => { c7: boolean })
    | { b7: number, c7: string }
    | ({ d7: boolean, e7: Date } & { f7: number })
    | { g7: string[] }

    | ((a8: string) => void)
    | ((a8: string, b8: number) => { c8: boolean })
    | { b8: number, c8: string }
    | ({ d8: boolean, e8: Date } & { f8: number })
    | { g8: string[] }

    | ((a9: string) => void)
    | ((a9: string, b9: number) => { c9: boolean })
    | { b9: number, c9: string }
    | ({ d9: boolean, e9: Date } & { f9: number })
    | { g9: string[] }
    
    | ((a10: string) => void)
    | ((a10: string, b10: number) => { c10: boolean })
    | { b10: number, c10: string }
    | ({ d10: boolean, e10: Date } & { f10: number })
    | { g10: string[] }

    | ((a11: string) => void)
    | ((a11: string, b11: number) => { c11: boolean })
    | { b11: number, c11: string }
    | ({ d11: boolean, e11: Date } & { f11: number })
    | { g11: string[] }

    | ((a12: string) => void)
    | ((a12: string, b12: number) => { c12: boolean })
    | { b12: number, c12: string }
    | ({ d12: boolean, e12: Date } & { f12: number })
    | { g12: string[] }

    | ((a13: string) => void)
    | ((a13: string, b13: number) => { c13: boolean })
    | { b13: number, c13: string }
    | ({ d13: boolean, e13: Date } & { f13: number })
    | { g13: string[] }

    | ((a14: string) => void)
    | ((a14: string, b14: number) => { c14: boolean })
    | { b14: number, c14: string }
    | ({ d14: boolean, e14: Date } & { f14: number })
    | { g14: string[] }

    | ((a15: string) => void)
    | ((a15: string, b15: number) => { c15: boolean })
    | { b15: number, c15: string }
    | ({ d15: boolean, e15: Date } & { f15: number })
    | { g15: string[] }

    | ((a16: string) => void)
    | ((a16: string, b16: number) => { c16: boolean })
    | { b16: number, c16: string }
    | ({ d16: boolean, e16: Date } & { f16: number })
    | { g16: string[] }

    | ((a17: string) => void)
    | ((a17: string, b17: number) => { c17: boolean })
    | { b17: number, c17: string }
    | ({ d17: boolean, e17: Date } & { f17: number })
    | { g17: string[] }

    | ((a18: string) => void)
    | ((a18: string, b18: number) => { c18: boolean })
    | { b18: number, c18: string }
    | ({ d18: boolean, e18: Date } & { f18: number })
    | { g18: string[] }

    | ((a19: string) => void)
    | ((a19: string, b19: number) => { c19: boolean })
    | { b19: number, c19: string }
    | ({ d19: boolean, e19: Date } & { f19: number })
    | { g19: string[] }

type utilityTypes_UnionToIntersection<T> = (T extends any
    ? (k: T) => void
    : never) extends (k: infer I) => void
      ? I
      : never;
    
// type UnionToIntersection<T> = { [K in T as K & string]: K }[any]
type UnionToIntersection<T> = { [K in T as K & string]: K }[never]

// @ts-benchmark(this version)
type Intersection = UnionToIntersection<FunctionUnion>

// @ts-benchmark(utility-types version)
type utilityTypes_Intersection = utilityTypes_UnionToIntersection<FunctionUnion>

type IsSimilar = 
    (Intersection extends utilityTypes_Intersection ? 'yes' : 'no')
    | (utilityTypes_Intersection extends Intersection ? 'yes' : 'no')