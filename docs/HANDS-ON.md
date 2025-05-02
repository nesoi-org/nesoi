# Nesoi: A hands-on guide

> Nesoi is a declarative framework for building data-driven applications.

The philosophy is to declare an application mostly through schemas, and then _compile_ such schemas into a full architecture and application based on an efficient and secure engine.

- [Overview](#overview)
- [Apps](#apps)
- [Elements](#elements)
    - [Entities](#entities)
        - [Constants](#constants)
            - [Values](#values)
            - [Enums](#enums)
                - [Enumpaths](#enumpaths)
        - [Bucket](#bucket)
            - [Model](#model)
            - [Graph](#graph)
                - [Graph Link](#graph-link)
            - [View](#view)
            - [Fieldpaths](#fieldpaaths)
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
- `Engine`: A library imported into the project application, which uses _schemas_ to setup app _elements_. The project application can send messages to the engine, which will use it's _elements_ to process and respond.

When building an application suite with Nesoi, you declare a `Space` that contains `Modules`, which then contain `Elements`.

- `Space`: The global scope of the application, which contains all _Modules_
    - `Module`: A named set of _Elements_, scoped by business definitions
        - `Element`: An object managed by the engine which uses a schema to process and respond to inputs

The main guidelines are:

- An _Element_ A can reference an _Element_ B which belongs to the same _Module_ as A
- A _Module_ A can declare an _Element Dependency_ from a _Module_ B, which copies the element to A

## Apps

A `App` describes an application which will run the Nesoi engine with a given set of _Elements_.

It can range from a _Monolyth_ with a single-threaded instance of the engine containing all elements of the space, to a _Serverless Architecture_ which is composed of many micro-instances of the engine each with a subset of elements communicating with each other through the network.

Currently, you can create 2 types of apps:
- **Inline App**: A library that builds the schemas in runtime and starts a daemon, which can be used by already existing applications.
- **Monolyth App** A NPM package with pre-built schemas and some entry-point scripts, which extends the InlineApp to run with such modules.

When declaring a _Monolyth App_, you specify which modules should be included:

```typescript
const MyMonolyth = new MonolythApp(Nesoi, 'my_monolyth')
    .modules([
        'module_1',
        'module_2'
    ])
```

### App Configuration

    ...

You can also configure the app elements through this app instance, but this will be covered on each element below.

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

Values can be declared as either `static` or `app`:

```typescript
.values($ => ({
    static_value: $.static('Some static value'),
    app_value: $.app('RUNTIME_VALUE')
}))
```

- `static`: The value is declared on the schema
- `app`: The value is read from the app. This can be used to pass environment variables to the engine, for example.

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

###### Enumpaths

On Message Templates, it's possible to use `Enum Paths` to validate a field using a specific subenum, picked from the value of another field of the message.

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

> Note: When using Enum Paths, you **must** declare the field referenced by the enum path *before* the field with the enum path.


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

In order to actually read/write data, the app declares a `Bucket Adapter` to be used by this `Bucket`.

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
    e: $.decimal(),             // NesoiDecimal
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

##### Fieldpaths

A bucket model contains a number of `Fieldpaths`, which are strings that point to one or more properties of the model.

```typescript
{
    name: 'Circle',
    color: {
        r: 0.0,
        g: 0.5,
        b: 1.0,
    },
    tags: [
        'tag1', 'tag2'
    ],
    dict: {
        a: 1,
        b: 2
    },
    pairs: [
        [1,2],
        [3,4],
        [5,6]
    ],
    vertex: [
        { x: 1.0, y: -4.0 },
        { x: 2.0, y: -3.0 },
        { x: 3.0, y: -2.0 },
        { x: 4.0, y: -1.0 }
    ],
    deep: [
        { list: [ 1, 2, 3 ] },
        { list: [ 4, 5, 6 ] },
    ]
}
/*
    'name'            => 'Circle'
    'color'           => { r: 0.0, g: 0.5, b: 1.0 }
    'color.r'         => 0.0
    'color.g'         => 0.5
    'color.b'         => 1.0
    'tags'            => ['tag1', 'tag2']
    'tags.#'          => 'tag1' | 'tag2'
    'dict'            => { a: 1, b: 2 }
    'dict.#'          => 1 | 2
    'pairs'           => [ [1,2], [3,4], [5,6] ]
    'pairs.#'         => [1,2] | [3,4] | [5,6]
    'pairs.#.#'       => 1 | 2 | 3 | 4 | 5 | 6
    'vertex'          => [ { x: 1.0, y: -4.0 }, ... ]
    'vertex.#'        => { x: 1.0, y: -4.0 } | { x: 2.0, y: -3.0 } | ...
    'vertex.#.x'      => 1.0 | 2.0 | 3.0 | 4.0
    'vertex.#.y'      => -1.0 | -2.0 | -3.0 | -4.0
    'deep':          => [ { list: [ 1, 2, 3 ] }, ... ]
    'deep.#':        => { list: [ 1, 2, 3 ] } | { list: [ 4, 5, 6 ] }
    'deep.#.list':   => [ 1, 2, 3 ] | [ 4, 5, 6 ]
    'deep.#.list.#': => 1 | 2 | 3 | 4 | 5 | 6
*/
```

_Fieldpaths_ can be of two types:
- **simple**: Does not contain a `#` part. Always resolves to a singe value.
- **complex**: Contains one or more `#` part(s). Can resolve to a single or multiple values, depending on context.

There are two main scenarios where Nesoi uses fieldpaths:
1. Bucket Views
    - On the view root, when declaring a `.model()`
    - Inside a _.model()_, when declaring a `.model()`
2. NQL Queries:
    - As the key of each term
    - As the name of a parametric value

###### Fieldpaths in Bucket View

When creating a [view](#view), you can use _fieldpaths_ to specify object properties:

```typescript
.view('custom', $ => ({
    name: $.model('name'),   // string
    red: $.model('color.r'), // number
}))
```

If the fieldpath is **complex**, it resolves to a list of items:
```typescript
.view('custom', $ => ({
    all_tags: $.model('tags.#') // Tag[]
    all_dict_items: $.model('dict.#') // DictItem[]
    all_deep_items: $.model('deep.#.list.#') // DeepItem[]
}))
```

> Note that if the fieldpath contains two or more `#`, the resulting list is still flat, not a list of lists.

You can replace the `#` symbols with a number (if it's a list) or a string (if it's a dict) to access specific items:
```typescript
.view('custom', $ => ({
    tag_2: $.model('tags.2') // Tag
    dict_a: $.model('tags.a') // DictItem
    deep_3_list_all: $.model('deep.3.list.#') // Item[]
    deel_3_list_2: $.model('deep.3.list.2') // Item
}))
```

As further explained on the [view](#view) section, a `.model()` can receive a second argument, to extend each object resolved by it.
This method can be used to work with nested fieldpaths:

```typescript
.view('custom', {
    info: $.model('vertex.#')
            .each({
                tag: $.model('tags.#')
            })
})

/*
{
    info: [
        { x: 1.0, y: -4.0, tag: 'tag1' },
        { x: 2.0, y: -3.0, tag: 'tag2' },
        { x: 3.0, y: -2.0 }
        { x: 4.0, y: -1.0 }
    ]
}
*/
```

##### Graph

A `Bucket Graph` declares how the data managed by this bucket relates to data from other buckets.

There are two main types of **graph links**:
- **Aggregation**: Both entities exist independently of each other, but are related in some way.
- **Composition**: The existence of a child entity depends on the existence of it's parent and/or vice-versa.

Both links can express their cardinality (one | many).

##### Graph Link

> A *graph link* is expressed as a [NQL](#nql) query.

A relationship between two entities is often described through foreign keys. However, this imposes some limitation on which relations can be fully described. Here's an example:

*Say you have a list of `Rooms` and a list of `Furnitures`. With foreign keys you can declare relationships such as "all the Furnitures inside Room X", or "the Room which contains the Furniture Y". But if you need to describe "all the Furnitures inside Room X that are made of wood" (where "made of" is a property of the Furniture) a foreign key is not enough.#

In order to accomodate this concept, Nesoi offers a way to express complex relationships through _NQL_ queries.

Starting with the simple examples, which can be represented with foreign keys:

> As explained on the (NQL)[#nql] section, `{'.':'fieldpath'}` represents a query parameter. On graph links, the available parameters are fieldpaths of the base bucket.

```typescript
// 1 Furniture <is currently at> 1 Room
// room_id stored on furniture

Nesoi.bucket('example::furniture')
    //...
    .graph($ => ({
        current_room: $.one('room', {
            'id': {'.':'room_id'}
        })
    }))

// Furniture has a graph link named "current room" which points to one "room"
// with an `id` that equals the `room_id` of the furniture.
```

```typescript
// 1 Furniture <is currently at> 1 Room
// furniture_ids stored on room

Nesoi.bucket('example::furniture')
    //...
    .graph($ => ({
        current_room: $.one('room', {
            'furniture_ids contains': {'.':'id'}
        })
    }))
```

```typescript
// 1 Room <has> N Furnitures
// room_id stored on furniture

Nesoi.bucket('example::room')
    //...
    .graph($ => ({
        furnitures: $.many('furniture', {
            'room_id': {'.':'id'}
        })
    }))
```

```typescript
// 1 Room <has> N Furnitures
// furniture_ids stored on room

Nesoi.bucket('example::room')
    //...
    .graph($ => ({
        furnitures: $.many('furniture', {
            'id in': {'.':'furniture_ids'}
        })
    }))
```

Then, we can replicate the mentioned example by simply adding more conditions to the graph link:

```typescript
Nesoi.bucket('example::room')
    //...
    .graph($ => ({
        wood_furnitures: $.many('furniture', {
            'room_id': {'.':'id'},
            'made_of': 'wood'
        })
    }))
```

In order to use pivot tables, which can express N-N relationships, you can use a NQL sub-query.

```typescript
Nesoi.bucket('example::student')
    //...
    .graph($ => ({
        teachers: $.many('teacher', {
            'teacher_id': { 
                '@student_teachers.teacher_id': {
                    'student_id': {'.':'id'}
                }
            }
        })
    }))
```

Note that you can also mix sub-queries with other parameters to express complex N-N relationships:

```typescript
Nesoi.bucket('example::student')
    //...
    .graph($ => ({
        science_teachers: $.many('teacher', {
            'teacher_id': { 
                '@student_teachers.teacher_id': {
                    'student_id': {'.':'id'}
                }
            },
            'subject in': ['physics', 'chemistry', 'math', 'geography']
        })
    }))
```

Once you have the graph links declared, you can use them through the BucketTrxNode:
```typescript
await trx.bucket('student').readLink(2, 'science_teachers') // Teacher[]

// Read science teachers of student with id  2
```

```typescript
await trx.bucket('student').hasLink(2, 'science_teachers') // boolean

// True if student has at least 1 science teacher
```

##### Drive

`Drive` is the abstraction of a file storage.

Buckets that deal with `.file()` fields MUST declare a `DriveAdapter`, which is responsible for reading and writing files to some location.

Nesoi uses the class `NesoiFile` to represent a file that belongs to some `Drive`. It contains the full path to the file on that drive, as well as some metadata useful for validating the file.

> Nesoi does not create original files. The application (mainly controller adapters) is responsible for creating a file and setting up a `NesoiFile` which correctly references it. From this point on, Nesoi is able to move it to/from other drives.


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

##### Fieldpaths in NQL

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
    'flags.#': true,

    'words': { apple: 'Maçã' },
    'words.#': 'Maçã',

    'color': { r: 0, g: 0, b: 0 },
    'color.alpha': 0,
    'color.rgb': [0,0,0],
    'color.rgb.#': 0,
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
    'shape_id': {'.':'id'}
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

    'field.path.# ==': 'value',             // Fieldpath

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
// - NesoiDecimal | NesoiDecimal[]
// - string | string[]
// - number | number[]
// 
```
> :warning: You can't use object or array of object as a query value.
> You should use the fieldpath.# instead.
> This avoids ambiguity with subqueries and parameters, and
> also simplifies the query on structured data such as SQL.

```typescript
//
// [ NQL Leading Characters ]
//
// ~ : Case Insensitive modifier for ==, in, contains, contains_any
// # : special character of NQL
// ├ #and(.#) : AND Grouped Condition
// ├ #or(.#)  : OR Grouped Condition
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
