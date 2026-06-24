## Nesoi Bucket

A bucket of JSON-serializable data.

#### Bucket Methods

// read

- readOne
- readAll
- viewOne
- viewAll

- readLink
- readManyLinks
- ?viewManyLinks
- hasLink
- countLink

// build

- buildOne
- buildMany

// write

- create
- update (patch/replace)
- put

// delete

- delete
- deleteMany

// query

- query 

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
