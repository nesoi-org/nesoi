## Nesoi Bucket

A bucket of JSON-serializable data.

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

- `model`: Reads a property from the raw object
- `computed`
- `query`
- `graph`
- `view`
- `drive`
- `root|parent|value`
- `inject`

The results of such parsing (new entries) are passed to a chain of `operations`, which can be:
- `spread`
- `prop`
- `dict`
- `group`
- `transform`
- `subview|chain`

Recursively, a `subview|chain` operation passes the new entries to a new set of field parsers.