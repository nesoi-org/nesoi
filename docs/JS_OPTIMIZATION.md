# JS Optimization Techniques

Below are some recommended practices when writing code for nesoi for optimizing speed, based on benchmarks available at the `tools/benchmarks` folder.

### Copying an Array

> tools/benchmarks/copy_array.ts

The fastest way is:
```typescript
const copy: any[] = Array(original.length);
for (let i = 0; i < original.length; i++) {
    copy[i] = original[i];
}
```

### If vs. Switch

> tools/benchmarks/if_switch.ts

Apparently, there's no significant performance gain between both. It's a stylistic choice.

### Iterating

> tools/benchmarks/iterators.ts

#### Lists


The fastest way is:
```typescript
for (let i = 0; i < list.length; i++) {
    const a = list[i];
}
```

#### Dict Keys

The fastest way is:
```typescript
const keys = Object.keys(dict_keys);
for (let i = 0; i < keys.length; i++) {
    const a = dict_keys[keys[i]];
}
```

#### Dict Values

The fastest way is:
```typescript
const values = Object.values(dict);
for (let i = 0; i < values.length; i++) {
    const a = values[i];
}
```

#### Dict Entries

The fastest way is:
```typescript
const keys = Object.keys(dict);
const values = Object.values(dict);
for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const a = values[i];
}
```

### Checking if object has key

> tools/benchmarks/key_in_obj.ts

The fastest way is:
```typescript
const obj = {
    a: 1,
    b: 2,
    c: 3
}
const x = 'a' in obj; // true
```

### Traversing a tree

**Recursion** is prefered over manually implemented stacks/queues, given it's faster and often simpler.

Node is optimized to run small functions really fast. Implementing a tree traversal with small recursive chunks seems to be a good idea.

### Appending Strings

There's no significant difference between summing and using template strings.

```typescript
const str2 = str_a + '.' + str_b;
// or
const str2 = `${str_a}.${str_b}`
```

