# TypeScript Techniques Benchmark, the Overview

This document describes techniques which should be used consistently through the framework code to ensure high performance.

## Iteration

### Arrays

```typescript
// Performance critical code
// - Option 1: Slightly faster, reverse order
let i = arr.length;
while(i > 0) { i--; }
// - Option 2: Slightly slower, direct order
let i = 0
while(i < arr.length) { i++; }

// General code
for (let i = 0; i < arr.length; i++) {}

// Slow code
for (const x of arr) {}

// NEVER use:
// .map
// .forEach
// for (.. in ..)
```
<details>
<summary>Results</summary>

![list](./results/iteration/list.png)

```
--- list (n=10000) ---
[ map         ] x 21,138 ops/sec ±0.87% (93 runs sampled)
[ forEach     ] x 40,078 ops/sec ±0.45% (94 runs sampled)
[ for_i       ] x 90,560 ops/sec ±2.86% (88 runs sampled)
[ for_i, pre  ] x 93,862 ops/sec ±0.62% (95 runs sampled)
[ for_x_of_y  ] x 46,585 ops/sec ±0.78% (95 runs sampled)
[ for_x_in_y  ] x 2,699 ops/sec ±1.07% (91 runs sampled)
[ while ++i   ] x 112,517 ops/sec ±0.75% (92 runs sampled)
[ while i--   ] x 70,651 ops/sec ±0.56% (95 runs sampled)
[ while i++   ] x 93,611 ops/sec ±0.61% (89 runs sampled)
[ while i-- 2 ] x 125,055 ops/sec ±0.45% (91 runs sampled)
[ while i++5  ] x 111,651 ops/sec ±0.31% (93 runs sampled)
[ branchless_loop ]: 
[ compiled_iterator ] x 3,443 ops/sec ±1.64% (95 runs sampled) 
```

</details>

### Object Keys

```typescript
// Performance critical code
// - Option 1: Slightly faster, reverse order
const keys = Object.keys(obj);
let i = keys.length;
while (i > 0) { i--; }
// - Option 2: Slightly slower, direct order
const keys = Object.keys(obj);
let i = 0;
while (i < keys.length) { i++; }

// General code
const keys = Object.keys(obj);
for (let i = 0; i < keys.length; i++) {}

// Slow code
for (const key in obj) {}

// NEVER use:
// .map
// .forEach
```
<details>
<summary>Results</summary>

![obj_keys](./results/iteration/obj_keys.png)

```
--- obj_keys (n=10000) ---
[ keys.map   ] x 4,405 ops/sec ±6.83% (76 runs sampled)
[ for_i_keys ] x 3,969 ops/sec ±7.26% (74 runs sampled)
[ for_x_in_y ] x 3,071 ops/sec ±3.45% (79 runs sampled)
[ while_keys ] x 6,114 ops/sec ±3.08% (80 runs sampled)
[ compiled_iterator ] x 5,502 ops/sec ±3.35% (81 runs sampled)
```
</details>

### Object Values

```typescript
// Performance critical code
// - Option 1: Slightly faster, reverse order
const values = Object.values(obj);
let i = values.length;
while (i > 0) { i--; }
// - Option 2: Slightly slower, direct order
const values = Object.values(obj);
let i = 0;
while (i < values.length) { i++; }

// General code
const values = Object.values(obj);
for (let i = 0; i < values.length; i++) {}

// Slow code
for (const key in obj) {}

// NEVER use:
// .map
// .forEach
```
<details>
<summary>Results</summary>

![obj_values](./results/iteration/obj_values.png)

```
--- obj_values (n=10000) ---
[ values.map   ] x 6,459 ops/sec ±11.50% (54 runs sampled)
[ for_i_keys ] x 14,806 ops/sec ±4.02% (87 runs sampled)
[ for_x_in_y ] x 2,621 ops/sec ±1.86% (87 runs sampled)
[ for_x_of_y ] x 14,345 ops/sec ±1.59% (86 runs sampled)
[ while_keys ] x 15,571 ops/sec ±4.59% (74 runs sampled)
[ compiled_iterator ] x 2,354 ops/sec ±3.39% (82 runs sampled)
```
</details>

##