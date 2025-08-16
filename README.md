# Nesoi
Zero-dependency Typescript framework for data-driven applications.

![Logo](/docs/header.png)

> :warning: This is a work-in-progress. Use it with caution.

## Introduction

**nesoi** is a framework which makes it easy to implement data operations (crud, query, hidrate), jobs (synchronous or asynchronous), statecharts, queues, topics and controllers.

It does so through a _"builder-schema-element"_ paradigm, where you use _builders_ to declare _schemas_. Such _schemas_ are used by the _engine_ to build _elements_, which are runtime objects that perform actions inside _transactions_.


> `Builder` _-builds->_ `Schema` _-configures->_ `Element`

This paradigm allows declaring _modules_, which groups schemas into developer-chosen scopes. Such _modules_ are then used to declare _apps_, which are bundled ECMAScript (JS) applications.

```
modules/
    module1/
        ...elements...
    module2/
        ...elements...
apps/
    app1
    app2
```

When declaring an _app_, you plug _adapters_ into the _elements_, which allows them to interact with external aspects of your application, such as databases and topics. This means the schemas are agnostic and plural, allowing adapters to be changed without friction.

> A particular great feature of using _adapters_ for data sources - _buckets_ - is that queries can be performed accross different types of storage with a consistent syntax: NQL.

It offers a powerful engine for developing cloud or in-browser applications, and a robust plugin system for extending it's functionalities.

It also allows building and testing modules in isolation, then bundling them into different architectures.

## Getting Started

- [Hands-On Guide](/docs/HANDS-ON.md): A quick practical read with a lot of examples.
- [Project Template](https://github.com/nesoi-org/nesoi-meta/tree/main/template): A minimal template for building a project with _nesoi_.
