## Nesoi Bucket

A bucket of JSON-serializable data.

#### Bucket Methods

- read
    - one(id)
    - many(ids)
    - all()

- view('name' or $ => ({}))
    - one(id|obj)
    - many(ids|objs)
    - all()

- link('name')
    - view('name' or $ => ({}))
    - one(id|obj)
    - many(ids|objs)
    - present(id)
    - count(id)

- query({..nql..})
    - view('name' or $ => ({}))
    - first()
    - page()
    - all()
    - count()

- create
    - one()
    - many()

- patch
    - one()
    - many()
    - query()

- replace
    - one()
    - many()

- put
    - one()
    - many()

- delete
    - one()
    - many()
    - query()

```typescript
$.trx.bucket('camera').read.one(2).or_throw;
$.trx.bucket('camera').read.many([1,2,3]).or_throw;
$.trx.bucket('camera').read.all().or_throw;

$.trx.bucket('camera').view('alias').one(2);
$.trx.bucket('camera').view('alias').many([1,2,3]);
$.trx.bucket('camera').view('alias').all();

$.trx.bucket('camera').view($ => ({})).*(2);
$.trx.bucket('camera').view(*).one({ /* ..obj.. */ });
$.trx.bucket('camera').view(*).many([{ /* ..obj.. */ }]);

$.trx.bucket('camera').query({ /*..nql..*/ }).first();
$.trx.bucket('camera').query({ /*..nql..*/ }).page({ /* ..page.. */ });
$.trx.bucket('camera').query({ /*..nql..*/ }).all();
$.trx.bucket('camera').query({ /*..nql..*/ }).count();

$.trx.bucket('camera').link('area').one(2)
$.trx.bucket('camera').link('area').many([1,2,3])
$.trx.bucket('camera').link('area').exists(2)
$.trx.bucket('camera').link('area').count()
```

#### Read

iso     nesoi   cast    =>  nesoi
iso     json    cast    =>  nesoi
shared  nesoi   cast    =>  nesoi
shared  json    cast    =>  nesoi
iso     nesoi   nocast  =>  nesoi (frozen)
iso     json    nocast  =>  json  (frozen)
shared  nesoi   nocast  =>  nesoi (shared)
shared  json    nocast  =>  json  (shared)



#### Bucket Cache

Every read call attempts to use the following:
- Transaction-level cache
- Bucket-level cache
- Adapter

#### Bucket Query

- Query: { 
    'querypath': 'static',    
    'querypath': {'.':'param/modelpath'}    
    'querypath': {'$':'param.$1.with.$2.template'}    
}
- Binding: The object from which the param is read.
- Template: The values to fill into binding params ($1, $2..).

#### Bucket View

When building a view for N objects, N `ViewEntry` objects are created.

```typescript
type ViewEntry = {
    root: Obj
    parent: Obj
    value: any
    index: string[]
}
```

This list of entries is passed to a `field` parser, which is one of:

- `inject`
- `root|parent|value`
- `model`: Reads a property from the raw object
- `computed`
- `link`
- `query`
- `obj`
- `view`
- `drive`
- `extend`

The results of such parsing (new entries) are passed to a chain of `operations`, which can be:
- `pick`
- `to_list`
- `to_dict`
- `group_by`
- `transform`
- `map`: Apply 1 op to N fields
- `expand`: Apply N ops to 1 field
- `chain`: 

Recursively, a `subview|chain` operation passes the new entries to a new set of field parsers.

#### Bucket Reference

NQLCompiler.parse:
    - injects reference on query object (runner + meta)

BucketView.parseQueryField:
    - build objects of reference (view)

Bucket.viewLink:
    - build objects of reference (view)
