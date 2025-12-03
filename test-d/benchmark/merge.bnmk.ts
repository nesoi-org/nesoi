// type $Item = {
//   name: string
// }

// type $Group = {
//   items: {
//     [x: string]: $Item
//   }
// }

// class Group<
//   $ extends $Group
// > {

//     addItem<Name extends string>(name: Name)
//       : Group<$ & {
//         items: $['items'] & {
//           [K in Name]: $Item & { name: Name }
//         }
//       }>
//     {
//         return this as never;
//     }

//     items(): keyof $['items'] {
//         return {} as never;
//     }

// }

// export type Overlay<To, From> = Omit<To, keyof From> & From

// type Q = Overlay<$Group, {
//   items: Overlay<$Group['items'], {
//     [K in 'joca']: $Item & { name: 'joca' }
//   }>
// }>


// type Many = {
//   [x: string]: $Item
// }

// type X = {
//   a: {
//     iopo: 'jooo'
//     // [i: string]: string
//   }
//   b: number
// }

// type Y = {
//   a: {
//     joca: 'jooo'
//   }
// }

// type ÇÇ = (1 | 2) extends (1 | 2) ? 'si' : 'no'


// type Merge<U> = { [K in keyof U]: Merge<U[K]> }

// type UX = {
//   [x: string]: string
// }
// type UY = {
//   joca: 'boboca'
// }
// type UC = Merge<X|Y>

// type UK = keyof UC['a']








// type O = keyof Y['a']

// type J = {
//   [K in keyof Many as string extends K ? never : K]: Many[K]
// }
// type L = keyof J;

// type I = Q['items'];


// const items = new Group()
//   .addItem('item1')
//   .items();

// type Items = typeof items;



// // // @ts-benchmark(v2)
// // type v2 = Replace2<'a.#.b.#.c.#.d', '#', 'popopo'>

// // // @ts-benchmark(original)
// // type Original = Replace<'a.#.b.#.c.#.d', '#', 'popopo'>


