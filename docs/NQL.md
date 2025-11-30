# NQL - Nesoi Query Language

### Multi Param Query


> **colors**
> |id|name|
> |--|----|
> |1|yellow|
> |2|pink|
>
> **flowers**
> |id|name|color_id|
> |--|----|--------|
> |1|golden rod|2|
> |2|lyrium|2|
> |3|rose|3|
>
> **letters**
> |id|recipient|flower_id|
> |--|----|--------|
> |1|john|2|
> |2|isabelle|3|
> |3|frank|1|
>

#### No sub-query

You're sending letters, each containing a flower.
So, given a list of `letters`, you want to reach the `flower` of each `letter`.

```typescript
.bucket('letter')
.graph($ => ({
    $.one('flower', {
        'id': { '.': 'flower_id' }
    })
}))
```

Assuming all tables are on the same _scope_, the process goes as:

Run the query on the adapter, passing multiple parameters.
The adapter should treat different parameters as an "or" operator for the query.
``` typescript
// 1st query
q1 = {
    'id': 2 | 3 | 1
}
r1 = {flower}[]
```

The response is then fed into a memory bucket adapter.
Then, the query is run N times on this adapter, each with a single parameter
``` typescript
// 2nd query
q2_0 = { 'id': 2 }
r2_0 = {flower}

q2_1 = { 'id': 3 }
r2_1 = {flower}

q2_2 = { 'id': 1 }
r2_2 = {flower}
```

#### With sub-query

> **letters**
> |id|recipient|color|
> |--|----|--------|
> |1|john|yellow|
> |2|isabelle|pink|
> |3|frank|yellow|
>

You want the flowers to match the letter color, so you make a graph link with a subquery:

```typescript
.bucket('letter')
.graph($ => ({
    $.one('flower', {
        'color_id': {
            '@color.id': {
                'name': { '.': 'color' }
            }
        }
    })
}))
```

If the first went as usual:

``` typescript
// wrong 1st query
q1 = {
    'color_id': {
        '@color.id': {
            'name': 'yellow' | 'pink' | 'yellow'
        }
    }
}
r1 = {flower}[]
```

You'd need to run a subquery for each result, which leads back to the N+1 problem:

```typescript
// 2nd query
q2_0 = {
    'color_id': {
        '@color.id': {
            'name': 'yellow'
        }
    }
}
r2_0 = {flower}
```

So, what we do instead is to force different scopes for each sub-query of the original query, which results in different parts.

Then, we run each part with multiple parameters and store the results of each part on a `NQLBucketAdapter`.

``` typescript
// 1st query
q1_color = {
    'name': 'yellow' | 'pink' | 'yellow'
}
r1_color = {color}[]

q1_flower = { // flower
    'color_id': r1_color.id
}
r1_flower = {flower}[]

color_adapter = new NQLBucketAdapter(r1_color)
flower_adapter = new NQLBucketAdapter(r1_flower)
```

Then, we use `NQLEngine` to run the second query on the multiple NQLBucketAdapters.
This guarantees everything will be searched in memory.

```typescript
// 2nd query
q2_0 = {
    'color_id': {
        '@color.id': {
            'name': 'yellow'
        }
    }
}
r2_0 = {flower}
```

