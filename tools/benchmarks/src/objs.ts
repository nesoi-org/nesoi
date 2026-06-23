import { NesoiDate } from 'nesoi/lib/engine/data/date';
import { NesoiDatetime } from 'nesoi/lib/engine/data/datetime';
import { NesoiDecimal } from 'nesoi/lib/engine/data/decimal';
import { NesoiDuration } from 'nesoi/lib/engine/data/duration';

export const very_simple_obj = {
    id: 1,
    boolean: true,
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'abc',
}

export const simple_obj = {
    id: 1,
    boolean: true,
    date: NesoiDate.now(),
    datetime: NesoiDatetime.now(),
    duration: NesoiDuration.fromString('15 mins'),
    decimal: NesoiDecimal.fromString('12.34'),
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'abc',
    regex: '!abc!',
}

export const complex_obj = {
    id: 1,
    boolean: true,
    date: NesoiDate.now(),
    datetime: NesoiDatetime.now(),
    duration: NesoiDuration.fromString('15 mins'),
    decimal: NesoiDecimal.fromString('12.34'),
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'abc',
    regex: '!abc!',
    obj: {
        a: 124,
        b: 'text2',
        c: { x: true, y: false },
        d: [NesoiDate.now(), NesoiDate.now()],
    },
    dict: {
        x: NesoiDate.now(),
        y: NesoiDate.now(),
        x0: NesoiDate.now(),
        y0: NesoiDate.now(),
        x1: NesoiDate.now(),
        y1: NesoiDate.now(),
        x2: NesoiDate.now(),
        y2: NesoiDate.now(),
    },
    list: [23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56]
}

export const very_complex_obj = {
    id: 1,
    boolean: true,
    date: NesoiDate.now(),
    datetime: NesoiDatetime.now(),
    duration: NesoiDuration.fromString('15 mins'),
    decimal: NesoiDecimal.fromString('12.34'),
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'abc',
    regex: '!abc!',
    obj: {
        a: 124,
        b: 'text2',
        c: { x: true, y: false },
        d: [NesoiDate.now(), NesoiDate.now()],
    },
    dict: {
        x: NesoiDate.now(),
        y: NesoiDate.now(),
        x0: NesoiDate.now(),
        y0: NesoiDate.now(),
        x1: NesoiDate.now(),
        y1: NesoiDate.now(),
        x2: NesoiDate.now(),
        y2: NesoiDate.now(),
    },
    list: [
        23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56,
        23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56,
        23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56,
        23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56,
        23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56, 23.45, 34.56, 12.34, 23.45, 34.56,
    ],
    dict_obj: {
        a: { x: 0, y: 1},
        b: { x: 2, y: 3},
        c: { x: 4, y: 5},
        d: { x: 6, y: 7},
        e: { x: 8, y: 9},
    },
    list_obj: [
        { x: 0, y: 1},
        { x: 2, y: 3},
        { x: 4, y: 5},
        { x: 6, y: 7},
        { x: 8, y: 9},
    ]
}

const objs = {
    'very_simple': very_simple_obj,
    'simple': simple_obj,
    'complex': complex_obj,
    'very_complex': very_complex_obj,
};
export default objs;