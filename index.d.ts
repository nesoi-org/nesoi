/* 

    This file is required by tsd.
    In order to run the types test, use `npx tsd test`

*/

/**
 * Core
 */

declare type User = {
    id: number | string,
    [x: string]: any
}

/**
 * Custom Types
 */

/**
 * Elements
 */

declare interface $Space {
    users: {
        [x: string]: User
    }
    modules: {
        [x: string]: $Module
    }
}

declare interface $Module {
    name: string
    constants: $Constants
    externals: $Externals
    messages: {
        [x: string]: $Message
    }
    buckets: {
        [x: string]: $Bucket
    }
    jobs: {
        [x: string]: $Job
    }
    resources: {
        [x: string]: $Resource
    }
    machines: {
        [x: string]: $Machine
    }
    controllers: {
        [x: string]: $Controller
    }
    queues: {
        [x: string]: $Queue
    }
    topics: {
        [x: string]: $Topic
    }
    '#input': $Message
    '#auth': { [K: string]: User }
    '#services': Record<string, any>
}

declare interface $Constants {}

declare interface $Externals {}

declare interface $Message {}

declare interface $Bucket {}

declare interface $Job {}

declare interface $Resource {}

declare interface $Machine {}

declare interface $Controller {}

declare interface $Queue {}

declare interface $Topic {}

declare interface $Message {}