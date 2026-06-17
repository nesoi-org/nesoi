// function deepFreeze(val) {
//     if (typeof val !== 'object') return;
//     Object.freeze(val);
//     if (Array.isArray(val)) {
//         let i = -1; const n = val.length;
//         while(++i < n) deepFreeze(val[i]);
//     }
//     else {
//         const keys = Object.keys(val);
//         let i = -1; const n = keys.length;
//         while(++i < n) deepFreeze(val[keys[i]]);
//     }
// }

// function deepFreeze_gpt<T>(obj: T): T {
//     Object.getOwnPropertyNames(obj).forEach((prop) => {
//         const value = (obj as any)[prop];

//         if (value && typeof value === 'object') {
//             deepFreeze(value);
//         }
//     });
//     return Object.freeze(obj);
// }

// /* eslint-disable no-prototype-builtins */
// import Benchmark from 'benchmark';

// const N = 1000;

// const objs = Array.from({length: N}).map((_, i) => ({
//     a: i,
//     b: '2'+i,
//     c: i > 10,
//     a0: i,
//     b0: '2'+i,
//     c0: i > 10,
//     a1: i,
//     b1: '2'+i,
//     c1: i > 10,
//     a2: i,
//     b2: '2'+i,
//     c2: i > 10,
//     a3: i,
//     b3: '2'+i,
//     c3: i > 10,
// }));

// // for (const obj of objs) deepFreeze(obj);

// // for (const obj of objs) {
// //     Object.freeze(obj);
// // }

// const fns = objs.map(obj => Function('return ('+JSON.stringify(obj)+')'));

// function copy_d(
//     obj: any
// ) {
//     if (Array.isArray(obj)) {
//         const copy = Array(obj.length);
//         for (let i = 0; i < obj.length; i++) {
//             const val = obj[i];
//             if (typeof val !== 'object') {
//                 copy[i] = obj[i];
//             }
//             else {
//                 copy[i] = copy_d(obj[i]);
//             }
//         }
//         return copy
//     }
//     const copy: Record<string, any> = {};
//     const keys = Object.keys(obj);
//     for (let i = 0; i < keys.length; i++) {
//         const key = keys[i];
//         const val = obj[key];
//         if (typeof val !== 'object') {
//             copy[key] = val;
//         }
//         else {
//             copy[key] = copy_d(val);
//         }
//     }
//     return copy;
// }

// const suite = new Benchmark.Suite;
// suite
//     .add('js baseline', () => {
//     })
//     .add('while', () => {
//         let i = N; while (i-- > 0) {
//             objs[i]
//         }
//     })
//     .add('while10', () => {
//         let i = N; while (i > 0) {
//             objs[i]
//             objs[i-1]
//             objs[i-2]
//             objs[i-3]
//             objs[i-4]
//             objs[i-5]
//             objs[i-6]
//             objs[i-7]
//             objs[i-8]
//             objs[i-9]
//             i -= 10;
//         }
//     })
//     .add('while10 break', () => {
//         let i = N; while (i > 0) {
//             objs[i]
//             if (i<1) break;
//             objs[i-1]
//             if (i<2) break;
//             objs[i-2]
//             if (i<3) break;
//             objs[i-3]
//             if (i<4) break;
//             objs[i-4]
//             if (i<5) break;
//             objs[i-5]
//             if (i<6) break;
//             objs[i-6]
//             if (i<7) break;
//             objs[i-7]
//             if (i<8) break;
//             objs[i-8]
//             if (i<9) break;
//             objs[i-9]
//             i -= 10;
//         }
//     })
//     .add('while5', () => {
//         let i = N; while (i > 0) {
//             objs[i]
//             objs[i-1]
//             objs[i-2]
//             objs[i-3]
//             objs[i-4]
//             i -= 5;
//         }
//     })
//     .add('while5 break', () => {
//         let i = N; while (i > 0) {
//             objs[i]
//             if (i<1) break;
//             objs[i-1]
//             if (i<2) break;
//             objs[i-2]
//             if (i<3) break;
//             objs[i-3]
//             if (i<4) break;
//             objs[i-4]
//             i -= 5;
//         }
//     })
//     // .add('copy_d', () => {
//     //     let i = N; while (i-- > 0) {
//     //         copy_d(objs[i])
//     //     }
//     // })
//     // .add('fns', () => {
//     //     let i = N; while (i-- > 0) {
//     //         fns[i]();
//     //     }
//     // })

//     .on('cycle', (event: any) => {
//         console.log(String(event.target));
//     })
//     .on('complete', () => {
//         console.log('Fastest is ' + suite.filter('fastest').map('name'));
//     })
//     .run({ 'async': true });
