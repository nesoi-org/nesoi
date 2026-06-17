import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';

export const very_simple_obj = {
    id: 1,
    boolean: true,
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'template'
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
    literal: 'template'
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
    literal: 'template',
    obj: {
        a: 124,
        b: 'text2',
        c: { x: true, y: false },
        d: [NesoiDate.now(), NesoiDate.now()],
    },
    dict: {
        x: NesoiDatetime.now(),
        y: NesoiDatetime.now(),
        x0: NesoiDatetime.now(),
        y0: NesoiDatetime.now(),
        x1: NesoiDatetime.now(),
        y1: NesoiDatetime.now(),
        x2: NesoiDatetime.now(),
        y2: NesoiDatetime.now(),
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
    literal: 'template',
    obj: {
        a: 124,
        b: 'text2',
        c: { x: true, y: false },
        d: [NesoiDate.now(), NesoiDate.now()],
    },
    dict: {
        x: NesoiDatetime.now(),
        y: NesoiDatetime.now(),
        x0: NesoiDatetime.now(),
        y0: NesoiDatetime.now(),
        x1: NesoiDatetime.now(),
        y1: NesoiDatetime.now(),
        x2: NesoiDatetime.now(),
        y2: NesoiDatetime.now(),
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

const objs: [string, any][] = [
    ['very_simple', very_simple_obj],
    ['simple', simple_obj],
    ['complex', complex_obj],
    ['very_complex', very_complex_obj]
];
export default objs;