
type Replace2<T extends string, S extends string, D extends string>
    = T extends `${infer L}${S}${infer R}` ? `${L}${D}${Replace<R, S, D>}` : T

type _Original = Replace<'a.#.b.#.c.#.d', '#', 'popopo'>
type _v2 = Replace2<'a.#.b.#.c.#.d', '#', 'popopo'>
type __v2 = Replace2<'a.#.b.#.c.#.d', '#', 'popopo'>
type __Original = Replace<'a.#.b.#.c.#.d', '#', 'popopo'>

type Replace<T extends string, S extends string, D extends string,
  A extends string = ''> = T extends `${infer L}${S}${infer R}` ?
  Replace<R, S, D, `${A}${L}${D}`> : `${A}${T}`

// @ts-benchmark(v2)
type v2 = Replace2<'a.#.b.#.c.#.d', '#', 'popopo'>

// @ts-benchmark(original)
type Original = Replace<'a.#.b.#.c.#.d', '#', 'popopo'>


