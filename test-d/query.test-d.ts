// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../index.d.ts"/>

/* eslint-disable unused-imports/no-unused-vars */
import { expectAssignable } from 'tsd';
import type { Mock } from './mock';
import type { NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import { NesoiDatetime } from '~/engine/data/datetime';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';

const _Mock = {
    module: 'MOCK_MODULE',
    bucket: 'mock'
}

/**
 * test: Query should accept query model paths
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({
        id: 'value',
        name: 'value',
        volume: 0,
        timestamp: NesoiDatetime.now(),
        'color.r': 0,
        'color.g': 0,
        'color.b': 0,
    })
}

/**
 * test: Query should accept operators for correct model type
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({

        name: 'value',
        'name ==': 'value',
        'name in': ['value'],
        'name contains': 'value',
        'name contains_any': ['value'],
        'name present': '',

        volume: 0,
        'volume ==': 0,
        'volume >': 0,
        'volume <': 0,
        'volume >=': 0,
        'volume <=': 0,
        'volume in': [0,1,2],
        'volume present': '',

        'color contains': 'r',
        'color contains_any': ['r', 'g'],
        'color present': '',
                
        'flags contains': true,
        'flags contains_any': [true],
        'flags present': '',

        'flags.*': true,
        'flags.* ==': true,
        'flags.* in': [true, false],
        'flags.* present': '',

        'flags.#': true,
        'flags.# ==': true,
        'flags.# in': [true, false],
        'flags.# present': '',
        
        // not

        'name not': 'value',
        'name not ==': 'value',
        'name not in': ['value'],
        'name not contains': 'value',
        'name not contains_any': ['value'],
        'name not present': '',

        'volume not': 0,
        'volume not ==': 0,
        'volume not >': 0,
        'volume not <': 0,
        'volume not >=': 0,
        'volume not <=': 0,
        'volume not in': [0,1,2],
        'volume not present': '',

        'color not contains': 'r',
        'color not contains_any': ['r', 'g'],
        'color not present': '',
                
        'flags not contains': true,
        'flags not contains_any': [true],
        'flags not present': '',

        'flags.* not': true,
        'flags.* not ==': true,
        'flags.* not in': [true, false],
        'flags.* not present': '',

        'flags.# not': true,
        'flags.# not ==': true,
        'flags.# not in': [true, false],
        'flags.# not present': '',

        // case insensitive

        'name ~': 'value',
        'name ~in': ['value'],
        'name ~contains': 'value',
        'name ~contains_any': ['value'],

        'name not ~': 'value',
        'name not ~in': ['value'],
        'name not ~contains': 'value',
        'name not ~contains_any': ['value'],
    })
}

/**
 * test: OR Conditions
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({
        name: 'value',
        'or name contains': 'value',
        'or volume >=': 3.14,
    })
}

/**
 * test: AND Grouped Conditions
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({
        name: 'value',
        '#and': {
            'volume <': 3.14,
            'or color contains_any': ['red', 'blue']
        },
        '#and ': {
            'volume >': 0.1,
            'or flags.#': true
        },
    })
}

/**
 * test: OR Grouped Conditions
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({
        name: 'value',
        '#or': {
            'volume <': 3.14,
            'color contains_any': ['red', 'blue']
        },
        '#or ': {
            'volume >': 0.1,
            'flags.#': true
        }
    })
}

/**
 * test: Sub-Queries
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket>

    expectAssignable<Query>({
        'id ==': {
            '@mock.id': {
                'color contains': 'r',
                'or name in': ['name']
            }
        },
    })
}

/**
 * test: Parameters
*/
{
    type Query = NQL_Query<Mock.Module, Mock.MockBucket, {
        id: number,
        flags: boolean[],
        'flags.#': boolean,
        date: NesoiDatetime,
        numbers: number[],
        'numbers.#': number
    }>

    expectAssignable<Query>({
        'color.r': { '.': 'id' },
        'color.r in': [{ '.': 'id' }],
        'flags.# ==': { '.': 'flags.#' },
        'flags.# in': { '.': 'flags' },
        'volume in': [
            { '.': 'id' },
            { '.': 'numbers.#' }
        ]
    })
}

/**
 * test: Graph Link Examples with Vanilla Bucket
 */
{

    const builder = new BucketBuilder<Mock.Space, Mock.Module, Mock.VanillaBucket>('TEST', 'vanilla')
        .model($ => ({
            id: $.int,
            p_string: $.string,
            p_float: $.float,
            p_datetime: $.datetime,
            p_obj: $.obj({
                r: $.float,
                g: $.float,
                b: $.float
            }),
            mock_id: $.string,
        }))
        .link('', $ => {
            type OneArg = Parameters<typeof $.one<'mock'>>[1];
            type ManyArg = Parameters<typeof $.many<'mock'>>[1];

            // one, link on self
            expectAssignable<OneArg>({
                'id': { '.':'mock_id' }
            })
            // one, link on other
            expectAssignable<OneArg>({
                'vanilla_id': { '.':'id' }
            })

            // many, link on self
            expectAssignable<ManyArg>({
                'id': { '.':'mock_id' }
            })
            // many, link on other
            expectAssignable<ManyArg>({
                'vanilla_id': { '.':'id' }
            })

            // one, link on pivot
            expectAssignable<OneArg>({
                'id': { '@pivot.mock_id': {
                    'vanilla_id': { '.':'id' }
                }} 
            })
            // many, link on pivot
            expectAssignable<ManyArg>({
                'id': { '@pivot.mock_id': {
                    'vanilla_id': { '.':'id' }
                }} 
            })

            // one, link on self, specific condition
            expectAssignable<OneArg>({
                'id': { '.':'mock_id' },
                'color.r >': 0.5
            })
            // one, link on other, specific condition
            expectAssignable<OneArg>({
                'vanilla_id': { '.':'id' },
                'color.r >': 0.5
            })

            return {} as any;
        })
}