# Nesoi - Developer Notas


### Modularization Principles

- A module is `atomic`. It's not expected to be used partially.
- A element belongs to a single module.

- When using an element from other module, it MUST be declared as an external.
    - It can then be referenced as `module::name`
    - This element is included on the base module types.
    - When running the app, a "virtual" element is created on the module.
        - On a monolyth app, this virtual element is a JS reference to the original.
        - On a distributed app, this virtual element is a INC connector.

- 

#### Dependencies

|base|target|type|build|compile|runtime|tag type|
|----|------|----|----|----|----|--------|
|[block]|message|input|[ ]|[x]|[x]|name or short|
|[block]|message|output|[ ]|[x]|[x]|name or short|
|[block]|bucket|output|[ ]|[x]|[x]|name or short|
|[block]|bucket|output[]|[ ]|[x]|[x]|name or short|
|message|enum|enum field|[x]|[ ]|[ ]|name or short|
|message|bucket|id field|[x]|[x]|[x]|name or short|
|message|message|msg field|[x]|[ ]|[ ]|name or short|
|message|message|extend field|[x]|[ ]|[ ]|name or short|
|bucket|bucket|extend|[x]|[ ]|[ ]|name or short|
|bucket|bucket|graph|[ ]|[x]|[x]|name or short|
|bucket|enum|enum field|[x]|[ ]|[ ]|name or short|
|bucket|value|crypto|[ ]|[x]|[x]|name or short|
|resource|bucket|bucket|[ ]|[x]|[x]|name or short|
|resource|job|view|[ ]|[ ]|[x]|name|
|resource|job|query|[ ]|[ ]|[x]|name|
|resource|job|create|[ ]|[ ]|[x]|name|
|resource|job|update|[ ]|[ ]|[x]|name|
|resource|job|delete|[ ]|[ ]|[x]|name|
|resource|message|view|[ ]|[ ]|[x]|name|
|resource|message|query|[ ]|[ ]|[x]|name|
|resource|message|create|[ ]|[ ]|[x]|name|
|resource|message|update|[ ]|[ ]|[x]|name|
|resource|message|delete|[ ]|[ ]|[x]|name|
|resource job|message|input|[ ]|[ ]|[x]|name|
|machine state|job|beforeEnter|[ ]|[ ]|[x]|name|
|machine state|job|afterEnter|[ ]|[ ]|[x]|name|
|machine state|job|beforeLeave|[ ]|[ ]|[x]|name|
|machine state|job|afterLeave|[ ]|[ ]|[x]|name|
|machine state|message|transition|[ ]|[ ]|[x]|name|
|machine transition|job|job|[ ]|[ ]|[x]|name or short|
|machine|bucket|bucket|[ ]|[ ]|[x]|name or short|
|controller|message|message|[ ]|[ ]|[x]|name or short|
|controller|job|toJob|[ ]|[ ]|[x]|name or short|
|controller|resource|toResource|[ ]|[ ]|[x]|name or short|
|controller|machine|toMachine|[ ]|[ ]|[x]|name or short|
|externals|value|value|[x]|[x]|[x]|short|
|externals|enum|enum|[x]|[x]|[x]|short|
|externals|bucket|bucket|[x]|[x]|[x]|short|
|externals|message|message|[x]|[x]|[x]|short|
|externals|job|job|[x]|[x]|[x]|short|
|externals|machine|machine|[x]|[x]|[x]|short|