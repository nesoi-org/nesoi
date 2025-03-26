# Nesoi: A hands-on guide

> Nesoi is a declarative framework for building data-driven applications.

The philosophy is to declare an application mostly through schemas, and then _compile_ such schemas into a full architecture and application based on an efficient and secure engine.

- [Overview](#overview)
- [Runtimes](#runtimes)
- [Elements](#elements)
    - [Entities](#entities)
        - [Constants](#constants)
            - [Values](#values)
            - [Enums](#enums)
                - [Enumpaths](#enumpaths)
        - [Bucket](#bucket)
            - [Model](#model)
            - [Graph](#graph)
            - [View](#view)
            - [Fieldpaths](#fieldpaths)
        - [Message](#message)
            - [Template](#template)
            - [Inline Messages](#inline-messages)
    - [Blocks](#blocks)
        - [Job](#job)
            - [Method](#method)
            - [Assert](#assert)
            - [Extra](#extra)
            - [Inline Jobs](#inline-jobs)
        - [Resource](#resource)
        - [Machine](#machine)
        - [Queue](#queue)
    - [Edge](#edge)
        - [Controller](#controller)
- [Engine](#engine)
    - [Query](#query)
        - [NQL](#nql)
            - [Operators](#operators)
            - [Boolean Expression](#boolean-expression)
            - [Sub-queries](#sub-queries)
            - [NQL Cheat Sheet](#nql-cheat-sheet)
        - [TypeScript](#query)

## Overview

Nesoi is composed of two main parts:
- `Compiler`: An application which is run during development to build the _schemas_ of a given _Space_
- `Engine`: A library imported into the project application, which uses _schemas_ to setup runtime _elements_. The project application can send messages to the engine, which will use it's _elements_ to process and respond.

When building an application suite with Nesoi, you declare a `Space` that contains `Modules`, which then contain `Elements`.

- `Space`: The global scope of the application, which contains all _Modules_
    - `Module`: A named set of _Elements_, scoped by business definitions
        - `Element`: An object managed by the engine which uses a schema to process and respond to inputs

The main guidelines are:

- An _Element_ A can reference an _Element_ B which belongs to the same _Module_ as A
- A _Module_ A can declare an _Element Dependency_ from a _Module_ B, which copies the element to A

## Runtimes

A `Runtime` describes an application which will run the Nesoi engine with a given set of _Elements_.

It can range from a _Monolyth_ with a single-threaded instance of the engine containing all elements of the space, to a _Serverless Architecture_ which is composed of many micro-instances of the engine each with a subset of elements communicating with each other through the network.

Currently, there are 2 runtimes declared:
- **Library Runtime**: A library that can be imported and ran from a NodeJS application.
- **Monolyth Runtime** A NodeJS application that uses the library above to run a script exported from the _Space_.

When declaring a _Monolyth Runtime_, you specify which modules should be included:

```typescript
const MyMonolyth = new MonolythRuntime(Nesoi, 'my_monolyth')
    .modules([
        'module_1',
        'module_2'
    ])
```

You can also configure the runtime elements through this runtime instance, but this will be covered on each element below.

## Elements

Below is an overview of the element types:

- **Entities**
    - `Constants`: Static set of values and enums
    - `Bucket`: Data source (database, file storage, external api, memory, etc..)
    - `Message`: Object parsed according to a validation schema
- **Blocks**
    - `Job`: Function that can be triggered by a _Message_
    - `Resource`: Set of _Jobs_ for implementing CRUD on a _Bucket_
    - `Machine`: Statechart based on _Messages_ and _Jobs_ which uses data from a _Bucket_ as it's state
    - `Queue`: Queue of _Messages_ which can be later consumed by other _Blocks_
- **Edge**
    - `Controller`: Set of endpoints which accept a specific _Message_ and send it to a specific _Block_

### Entities

`Entities` are _Elements_ that represent different types of data:
- **Constants**: Immutable data
- **Bucket**: Stored data
- **Message**: In-traffic data

#### Constants

`Constants` are immutable values declared for the application.

```typescript
export default Nesoi.constants()
```

##### Values

Values can be declared as either `static` or `runtime`:

```typescript
.values($ => ({
    static_value: $.static('Some static value'),
    runtime_value: $.runtime('RUNTIME_VALUE')
}))
```

- `static`: The value is declared on the schema
- `runtime`: The value is read from the runtime. This can be used to pass environment variables to the engine, for example.

```typescript
MyMonolyth
    .values($ => ({
        RUNTIME_VALUE: process.env.RUNTIME_VALUE
    }))
```

##### Enums

Enums are declared with a name and a few options:

```typescript
.enum('color', $ => ({
    red: $.opt('#ff0000'),
    yellow: $.opt('#ffff00'),
    blue: $.opt('#0000ff')
}))
```

It's possible to declare subenums, by using `.` as a separator:

```typescript
.enum('color.primary', $ => ({
    red: $.opt('#ff0000'),
    yellow: $.opt('#ffff00'),
    blue: $.opt('#0000ff')
}))
.enum('color.secondary', $ => ({
    orange: $.opt('#ff9900'),
    green: $.opt('#00ff00'),
    purple: $.opt('#ff00ff')
}))

// This gives you access to 3 enums:
// - color
// - color.primary
// - color.secondary

```

You can also declare nested subenums:

```typescript
.enum('color.primary.with_red', $ => ({
    red: $.opt('#ff0000'),
    yellow: $.opt('#ffff00')
}))
.enum('color.primary.without_red', $ => ({
    blue: $.opt('#0000ff')
}))
.enum('color.secondary', $ => ({
    orange: $.opt('#ff9900'),
    green: $.opt('#00ff00'),
    purple: $.opt('#ff00ff')
}))

// This gives you access to 5 enums:
// - color
// - color.primary
// - color.primary.with_red
// - color.primary.without_red
// - color.secondary

```

When declaring a Bucket Model, you can reference any enum from the module by it's name:

```typescript
.model($ => ({
    obj_color: $.enum('color')
}))
```

When declaring a Message Template, you can also reference any enum from the module by it's name:

```typescript
.template($ => ({
    obj_color: $.enum('color')
}))
```

###### Enum Paths

On Message Templates, it's possible to use `Enum Paths` to validate a field using a specific subenum, picked from the value of another field of the message.

> Note: When using Enum Paths, you **must** declare the field referenced by the enum path *before* the field with the enum path.

```typescript
.enum('color_type', $ => ({
    primary: $.opt('primary'),
    secondary: $.opt('secondary')
}))

.template($ => ({
    modifier: $.enum('color_type'),
    obj_color: $.enum('color.{modifier}')
}))

// (The field names are arbitrary)
```

You can't pass multiple values to `Enum Paths`, but you can pass to a nested subenum.

```typescript
.template($ => ({
    p1: $.enum('color'),
    p2: $.enum('color.{}'),
    p3: $.enum('color.primary'),
    p4: $.enum('color.primary.{}'),
    p5: $.enum('color.primary.with_red'),
    p6: $.enum('color.primary.without_red'),
    p7: $.enum('color.secondary')
}))
```

Note that the enum path option is only available for fields which have the exact type expected:

```typescript
.enum('color_type', $ => ({
    primary: $.opt('primary'),
    secondary: $.opt('secondary'),
    tertiary: $.opt('tertiary')
}))

.template($ => ({
    modifier: $.enum('color_type'),

    // The following is not allowed, since `color_type`
    // contains options that resolve to non-existent
    // enums, such as "color.tertiary"
    obj_color: $.enum('color.{modifier}')
}))
```

#### Bucket

A `Bucket` is a data source.

When declaring a bucket, you specify the data that is provided by this source, such as it's format (Model) and how it relates to data stored on other buckets (Graph).

```typescript
export default Nesoi.bucket('my_module::my_bucket')
```

In order to actually read/write data, the runtime declares a `Bucket Adapter` to be used by this `Bucket`.

##### Model

A `Model` declares the format of the data managed by this bucket.

> The model is used by the Nesoi Compiler for generating the TypeScript type of this object, as well as default bucket views and resource messages.
>
> A _Bucket Adapter_ can use the model for parsing/serializing the data from/to it's source.

```typescript
.model($ => ({
    id: $.int, // 'id' is required for every model (int | string)
    a: $.any,                   // any
    b: $.boolean,               // boolean
    c: $.date,                  // NesoiDate
    d: $.datetime,              // NesoiDatetime
    e: $.decimal,               // Decimal
    f: $.dict($.boolean),       // Record<string, boolean>
    g: $.enum(['a', 'b', 'c']), // 'a' | 'b' | 'c'
    h: $.enum('my_const_enum'), // ...
    i: $.float,                 // number
    j: $.int,                   // number
    k: $.obj({                  // { a: number, b: string }
        a: $.int,
        b: $.string
    }),
    l: {                        // { a: number, b: string }
        a: $.int,
        b: $.string,
    },
    m: $.string                 // string
}))
```

A field can be of a union type:

```typescript
.model($ => ({
    registry: $.int.or($.string), // number | string
    mess: $.boolean.or($.float.or($.date)) // boolean | number | NesoiDate
}))
```

A field can declare an alias, used on logs and error messages:

```typescript
.model($ => ({
    b_date: $.as('Birthday Date').string
}))

// or

.model($ => ({
    b_date: $.string.as('Birthday Date')
}))
```

A field can be an array of the given type:

```typescript
.model($ => ({
    name: $.string.array,   // string[]
    colors: $.obj({         // { color: string }[]
        color: $.string
    }).array
}))
```

A field can be optional:

```typescript
.model($ => ({
    name: $.string.optional,   // string | undefined
    colors: $.obj({         // { color: string } | undefined
        color: $.string
    }).optional
}))
```

A field can declare a default value, which is used when reading data without such field and creating a new instance of the data:

```typescript
.model($ => ({
    name: $.string.default('Green'),
    color: $.obj({ hexcode: $.string })
            .default({ hexcode: '#00ff00' })
}))
```

##### Graph

A `Bucket Graph` declares how the data managed by this bucket relates to data from other buckets.

There are two main types of graph links:
- **Aggregation**: Both entities exist independently of each other, but are related in some way.
- **Composition**: The existence of one entity depends on the existence of another.

Both links can express their cardinality (one | many).


#### Message

### Blocks

`Blocks` are _Elements_ which consume _Messages_.

#### Job
#### Resource
#### Machine
#### Queue

### Edge

`Edge` _Elements_ compose the interface layer between the project application and the engine.

#### Controller

## Engine

### Query

Nesoi has a powerful data query engine, which offers `NQL`, the `Nesoi Query Language`.
It allows you to build powerful queries, which can be translated by adapters to other query languages such as _SQL_, _GraphQL_, etc.

`NQL` also allows Nesoi to query data cached on memory, as detailed on the [Cache](#cache) section.

#### NQL

A _NQL_ query is written as a dictionary, where the key carries information about the _field_ and _operator_, and the value can either be a static value or another query (a sub-query).

The simplest query you can build looks like this:
```typescript
{
    name: 'Magoo'
}
// objects that have a property `name` with the value `Magoo`
```

##### Fieldpaths

You can use any of the bucket (Fieldpaths)(#fieldpaths) for the query.

```typescript
//...
    .model($ => ({
        id: $.int,
        name: $.string,
        flags: $.boolean.array,
        words: $.dict($.string),
        color: $.obj({
            alpha: $.float,
            rgb: $.float.array
        })
    }))
//...
{
    'name': 'Magoo',

    'flags': [true, false],
    'flags.*': true,

    'words': { apple: 'Maçã' },
    'words.*': 'Maçã',

    'color': { r: 0, g: 0, b: 0 },
    'color.alpha': 0,
    'color.rgb': [0,0,0],
    'color.rgb.*': 0,
}
```


##### Operators

You can specify an operator along with the field name, for more specific queries:

```typescript
{
    'volume >=': 3.14
}
```

###### [ == ] Is Equal To

Matches fields that have the exact same value as the query.

> This is the default operator, when not specified.

```typescript
// field: any | any[]
// value: T
{
    name: 'Nesoi',
    'name ==': 'Nesoi'
}
```

###### [ > ] Is Greater Than

Matches numeric or date/datetime fields with a value greater than the query.

```typescript
// field: decimal | int | float | date | datetime
// value: number | date | datetime
{
    'volume >': 3.14
}
```

###### [ < ] Is Less Than

Matches numeric or date/datetime fields with a value smaller than the query.

```typescript
// field: decimal | int | float | date | datetime
// value: number | date | datetime
{
    'volume <': 3.14
}
```

###### [ >= ] Is Greater Than or Equal To

Matches numeric or date/datetime fields with a value greater than or equal to the query.

```typescript
// field: decimal | int | float | date | datetime
// value: number | date | datetime
{
    'volume >=': 3.14
}
```

###### [ >= ] Is Less Than or Equal To

Matches numeric or date/datetime fields with a value less than or equal to the query.

```typescript
// field: decimal | int | float | date | datetime
// value: number | date | datetime
{
    'volume <=': 3.14
}
```

###### [ in ] Is One Of

Matches fields with a value that's equal to at least one of the query values.

```typescript
// field: any
// value: T[]
{
    'color in': ['red', 'blue']
}
```

###### [ contains ] Contains

Matches fields with a value that _contains_ the query value.
- `string`: the string contains the query value as a substring
- `enum`: same as _string_
- `obj`: the object contains a key that matches the query value exactly
- `dict`: same as _obj_
- `any[]`: the list contains an element that matches the query value exactly

```typescript
// field: enum | string | obj | dict | any[]
// value: string | T -> (if field is any[])
{
    'address contains': 'Street',
    'color contains': 're', // red | green
    'obj contains': 'key1', // all object with a key 'key1' 
    'dict contains': 'key2', // all object with a key 'key2' 
    'scoreboards contains': '12.34' // all lists with an item '12.34'
}
```


###### [ contains_any ] Contains Any One Of

Matches fields with a value that _contains_ at least one of the query value.
- `string`: the string contains at least one of the query values as a substring
- `enum`: same as _string_
- `obj`: the object contains a key that matches at least one of the query values exactly
- `dict`: same as _obj_
- `any[]`: the list contains an element that matches at least one of the query values exactly

```typescript
// field: enum | string | obj | dict | any[]
// value: string[] | T[] -> (if field is any[])
{
    'address contains_any': ['Street', 'Avenue'],
    'color contains_any': ['re', 'ge'], // red | green | orange | magenta
    'obj contains_any': ['key1', 'key2'], // all object with a key 'key1' or 'key2'
    'dict contains_any': ['key3', 'key4'], // all object with a key 'key3' or 'key4'
    'scoreboards contains_any': ['12.34', '56.78'] // all lists with an item '12.34' or '56;78'
}
```

###### [ present ] Is Present

Matches fields that have a value different from `null` or `undefined`.

```typescript
// field: any
// value: ''
{
    'age present': ''
}
```

###### [ not ] Is Not

You can prepend a `not` operator to any operator, and it will invert the query condition when it's being matched.

```typescript
{
    'color not ==': 'red',
    'age not in': [33, 44, 55],
    'obj not contains': 'key1',
    'scoreboards not contains_any': ['12.34', '56.78'],
    'shadow not present': ''
}
```

###### [ ~ ] Case Insensitive


```typescript
{
    'name ~': 'red',
    'name ~==': 'red',
    'name ~contains': 'red',
}
```

##### Boolean Expression

You can build complex boolean expressions such as `A && (B || (C && D))` within the queries.

###### AND Condition

If a query has multiple fields, the conditions are chained with an `AND` operator by default.

```typescript
{
    'state': 'open',    // A
    'color': 'red',     // B
    'volume >': 3.14,   // C
}
// A && B && C
```

###### OR Condition

You can start the field with `or` to isolate it at the end of the chain with an `OR` operator.

> It doesn't matter where the `or` field is, all `and` fields will be grouped together in a single expression.
>
> This doesn't necessarily mean it will be checked later, given each adapter optimizes the query in different ways.

```typescript
{
    'state': 'open',   // A
    'or color': 'red', // B
    'volume >': 3.14,  // C
}
// (A && C) || B
```

If you declare multiple `or` fields, the same rule applies:

```typescript
{
    'state': 'open',              // A
    'or color': 'red',            // B
    'volume >': 3.14,             // C
    'or height <': 3.14,          // D
    'description contains': 'New', // E
}
// (A && C && E) || B || D
```

###### AND Grouped Conditions

You can use a special `#and` field to declare a parenthesized expression that's chained with an `AND` operator.

```typescript
{
    'state': 'open',         // A
    '#and': {
        'color': 'red',      // B
        'or volume >': 3.14, // C
    }
}
// A && (B || C)
```

You can use multiple `#and` fields. However, given that object key names must be unique, you must append something at the end. Here we suggest adding spaces:

```typescript
{
    'state': 'open',                      // A
    '#and': {
        'color': 'red',                   // B
        'or volume >': 3.14,              // C
    }
    'expiry_date >': NesoiDate.now(),     // D
    '#and ': {
        'height <': 3.14,                 // E
        'or description contains': 'New', // F
    }
}
// A && (B || C) && D && (E || F)
```

###### OR Grouped Conditions

You can also use a special `#or` field to declare a parenthesized expression that's chained with an `OR` operator.

```typescript
{
    'state': 'open',      // A
    '#or': {
        'color': 'red',   // B
        'volume >': 3.14, // C
    }
}
// A || (B && C)
```

The same way as before, you can use multiple `#or` fields, by appending spaces (or anything else) at the end of each.

```typescript
{
    'state': 'open',                      // A
    '#or': {
        'color': 'red',                   // B
        'volume >': 3.14,                 // C
    }
    'expiry_date >': NesoiDate.now(),     // D
    '#or ': {
        'height <': 3.14,                 // E
        'description contains': 'New',    // F
    }
}
// (A && D) || (B && C) || (E && F)
```

> You can see above that the "group all 'and' and float all 'or' to the end" behavior also applies to grouped conditions.

##### Sub-queries

Instead of passing a static value to a query, you can pass the results of a subquery:

```typescript
// @shape
{
    'color_id in': {
        '@color.id': {
            'name': 'red'
        }
    }
}
// shape_id matches the id of a red circle
```

- Here, we're searching for an object with a field `shape_id` which should match at least one result of the sub-query.
- This sub-query will be run on the bucket `circle`, and we'll fetch the `id` field of each result.
- The sub-query matches `circles` where `color == red`.

##### Parameters

A query value can also be a `parameter`, a value that's gonna be separately passed to the query runner when running a query.

```typescript
{
    'shape_id': { '.':'id' }
}
// shape_id matches the `id` parameter passed to the query runner
```

Nesoi is able to pre-compile the query, and run it multiple times for different parameters.

This is particularly useful on the Bucket [Graph](#graph), where the relations between buckets are described as NQL queries with a `&id` parameter.

##### Graph Links

If the bucket that's being queried contains a [Graph](#graph) with some links, you can query through these links.

```typescript
//...
    .graph($ => ({
        shape: $.aggregate.one()
    }))
{
    '#shape.color': 'red'
}
// shape_id matches the id of a red circle
```


##### NQL Cheat Sheet

```typescript
{
    'field': 'value',                       // Is Equal To
    'field ==': 'value',                    // Is Equal To
    'field ==': 'value',                    // Is Equal To (Case Insensitive)

    'field >': 3.14,                        // Is Greater Than
    'field <': 3.14,                        // Is Less Than
    'field >=': 3.14,                       // Is Greater Than or Equal To
    'field <=': 3.14,                       // Is Less Than or Equal To
    
    'field in': ['a', 'b', 'c'],            // Is One Of
    'field contains': 'value',              // Contains
    'field contains_any': ['a', 'b', 'c'],  // Contains Any One Of
    
    'field present': '',                    // Is Present

    'field ~contains': ['a', 'b', 'c'],     // Case Insensitive (TODO)
    'field not in': ['a', 'b', 'c'],        // Is Not

    'field.path.* ==': 'value',             // Fieldpath

    'field contains': 'value',              // AND Condition
    'or field contains': 'value',           // OR Condition
    
    '#and': {                               // AND Grouped Condition
        'field': 'value',
        'or field in': ['a', 'b', 'c']
    },

    '#or': {                        // OR Grouped Condition
        'field': 'value',
        'field in': ['a', 'b', 'c']
    },

    '#order': {                     // Result ordering
        by: 'field',
        dir: 'asc'
    },

    'field': {                      // Sub-query
        '@bucket.vfield': {
            'subfield': 'value'
        },
        'or @bucket.vfield': {
            'subfield': 'value'
        }
    },

    '*graphlink': {                 // Graph Link of the bucket
        'name contain': 'João'
    },
    
    'field': { '.':'param' },                       // Parameter
}
```

```typescript
//
// [ NQL Input Types ]
//
// - boolean | boolean][]
// - NesoiDate | NesoiDate[]
// - NesoiDatetime | NesoiDatetime[]
// - Decimal | Decimal[]
// - string | string[]
// - number | number[]
// 
```
> :warning: You can't use object or array of object as a query value.
> You should use the fieldpath.* instead.
> This avoids ambiguity with subqueries and parameters, and
> also simplifies the query on structured data such as SQL.

```typescript
//
// [ NQL Leading Characters ]
//
// ~ : Case Insensitive modifier for ==, in, contains, contains_any
// # : special character of NQL
// ├ #and(.*) : AND Grouped Condition
// ├ #or(.*)  : OR Grouped Condition
// ├ #order   : Result ordering
//
// @ : bucket.vfield for a subquery
//
// > : graph link of bucket
//
// % : view of bucket
//
// * : query parameter
//
```

#### TypeScript

When declaring a query, Nesoi uses the element schema types to offer the most consistent type possible for building the query with all available suggestions.

When the query is compiled, the engine checks for errors using the element schema objects, which prevents invalid values passing through.
