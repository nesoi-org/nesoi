## Bucket Model Optimization

With the goal of 1M transactions/sec in mind, this file describes the techniques employed and the benchmark results.

### Overall Strategy

- `simple` objects are assumed for the 1M/sec goal.
- One transaction of the goal is composed of 2 writes and 2 reads.
    - 1 w/r for the transaction log
    - 1 w/r for the bucket

> **Assumption A**: Most reads don't need a modifiable clone of the object.
> 
> *The read/query methods return a reference to a _readonly_ object by default.*
- This means that we don't need to copy the object from memory in order to protect it from external changes.
- On non-memory adapters, this freeze must be done on each read for consistent behavior, but not on write.
- On memory adapters, this freeze must be done on each write, but not on read.
- A `unfrozen` flag can be set on the bucket config to improve performance.

```
[freeze]: Deep freezes the object.
2 writes (memory) or 2 read (non-memory)
20M ops/sec
```

> **Assumption B**: A user _might_ want to clone the frozen object.
> 
> *A `.unfrozen` modifier must be available on the bucket trx node.*
- It returns a deep copy of the object, which can be freely modified externally.

```
[copy]: Deep copies the object.
(optional)
1M ops/sec
```

> **Assumption C**: Nesoi types can be JSON-serialized on copy or not.
> - **Appendix C1**: On memory, nesoi types must be stored raw to speed up queries.
> - **Appendix C2**: On memory, a cached version of the serialized copy should be saved upon the first generation.
>
> *There must be two copy methods: one for raw data, other for json data*


- The modifier `.json` must be available on the bucket trx node.
- It invalidates the `.unfrozen` modifier.
    - It returns an object with nesoi types converted to string

```
[json]: Deep copies the object transforming nesoi fields to string.
(optional)
1M ops/sec
```

> **Assumption D**: **All** data stored on a bucket **must** be sanitized.
> *There must be a sanitize method*


---

### Benchmark Results

#### Freeze

Blocks the object from being modified.

```
# very_simple
freeze_simple                 x 3,845,058 ops/sec ±1.22% (88 runs sampled)
freeze_simple_functional      x 3,125,930 ops/sec ±1.37% (84 runs sampled)
freeze_simple_batch_branching x 4,858,415 ops/sec ±1.38% (87 runs sampled)
freeze_meta                   x 23,317,054 ops/sec ±1.31% (88 runs sampled)
# simple
freeze_simple                 x 940,569 ops/sec ±2.48% (84 runs sampled)
freeze_simple_functional      x 660,327 ops/sec ±2.43% (84 runs sampled)
freeze_simple_batch_branching x 942,225 ops/sec ±1.60% (88 runs sampled)
freeze_meta                   x 19,594,138 ops/sec ±1.01% (88 runs sampled)
# complex
freeze_simple                 x 315,560 ops/sec ±1.24% (88 runs sampled)
freeze_simple_functional      x 271,460 ops/sec ±1.98% (87 runs sampled)
freeze_simple_batch_branching x 319,202 ops/sec ±2.70% (82 runs sampled)
freeze_meta                   x 4,603,631 ops/sec ±1.11% (89 runs sampled)
# very_complex
freeze_simple                 x 215,299 ops/sec ±2.03% (88 runs sampled)
freeze_simple_functional      x 200,710 ops/sec ±1.18% (87 runs sampled)
freeze_simple_batch_branching x 226,051 ops/sec ±1.39% (87 runs sampled)
freeze_meta                   x 1,059,187 ops/sec ±1.52% (87 runs sampled)
```

#### Copy

```
# very_simple
ref         x 528,513,114 ops/sec ±1.44% (78 runs sampled)
copy_simple x 2,312,344 ops/sec ±2.19% (87 runs sampled)
copy_any    x 1,265,854 ops/sec ±1.62% (89 runs sampled)
copy_any2   x 1,275,012 ops/sec ±1.20% (89 runs sampled)
copy_meta   x 3,739,166 ops/sec ±1.01% (90 runs sampled)
copy_meta2  x 35,812,502 ops/sec ±0.93% (91 runs sampled)
# simple
ref         x 509,443,005 ops/sec ±0.81% (89 runs sampled)
copy_simple x 583,586 ops/sec ±1.35% (89 runs sampled)
copy_any    x 298,069 ops/sec ±1.36% (87 runs sampled)
copy_any2   x 300,527 ops/sec ±2.38% (87 runs sampled)
copy_meta   x 2,275,875 ops/sec ±1.05% (91 runs sampled)
copy_meta2  x 29,149,861 ops/sec ±1.85% (87 runs sampled)
# complex
ref         x 509,588,482 ops/sec ±0.78% (93 runs sampled)
copy_simple x 207,792 ops/sec ±1.37% (87 runs sampled)
copy_any    x 127,551 ops/sec ±1.12% (90 runs sampled)
copy_any2   x 128,832 ops/sec ±1.03% (90 runs sampled)
copy_meta   x 173,878 ops/sec ±2.60% (82 runs sampled)
copy_meta2  x 5,063,492 ops/sec ±1.50% (87 runs sampled)
# very_complex
ref         x 63,489,485 ops/sec ±2.80% (81 runs sampled)
copy_simple x 141,507 ops/sec ±4.07% (84 runs sampled)
copy_any    x 85,991 ops/sec ±3.14% (87 runs sampled)
copy_any2   x 87,345 ops/sec ±1.76% (88 runs sampled)
copy_meta   x 106,873 ops/sec ±7.41% (77 runs sampled)
copy_meta2  x 163,309 ops/sec ±2.46% (86 runs sampled)
```