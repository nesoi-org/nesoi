import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';

export const very_simple_model = new $BucketModel({
    id: new $BucketModelField('id','id','int','id',true),
    boolean: new $BucketModelField('boolean','boolean','boolean','boolean',true),
    enum: new $BucketModelField('enum','enum','enum','enum',true, {
        enum: { options: { 'a': {}, 'b': {} }}
    }),
    int: new $BucketModelField('int','int','int','int',true),
    float: new $BucketModelField('float','float','float','float',true),
    string: new $BucketModelField('string','string','string','string',true),
    literal: new $BucketModelField('literal','literal','literal','literal',true,{
        literal: { template: 'abc' }
    }),
});

export const simple_model = new $BucketModel({
    id: new $BucketModelField('id','id','int','id',true),
    boolean: new $BucketModelField('boolean','boolean','boolean','boolean',true),
    date: new $BucketModelField('date','date','date','date',true),
    datetime: new $BucketModelField('datetime','datetime','datetime','datetime',true),
    duration: new $BucketModelField('duration','duration','duration','duration',true),
    decimal: new $BucketModelField('decimal','decimal','decimal','decimal',true),
    enum: new $BucketModelField('enum','enum','enum','enum',true, {
        enum: { options: { 'a': {}, 'b': {} }}
    }),
    int: new $BucketModelField('int','int','int','int',true),
    float: new $BucketModelField('float','float','float','float',true),
    string: new $BucketModelField('string','string','string','string',true),
    literal: new $BucketModelField('literal','literal','literal','literal',true,{
        literal: { template: 'abc' }
    }),
    regex: new $BucketModelField('regex','regex','regex','regex',true,{
        regex: { template: 'abc' }
    }),
});

export const complex_model = new $BucketModel({
    id: new $BucketModelField('id','id','int','id',true),
    boolean: new $BucketModelField('boolean','boolean','boolean','boolean',true),
    date: new $BucketModelField('date','date','date','date',true),
    datetime: new $BucketModelField('datetime','datetime','datetime','datetime',true),
    duration: new $BucketModelField('duration','duration','duration','duration',true),
    decimal: new $BucketModelField('decimal','decimal','decimal','decimal',true),
    enum: new $BucketModelField('enum','enum','enum','enum',true, {
        enum: { options: { 'a': {}, 'b': {} }}
    }),
    int: new $BucketModelField('int','int','int','int',true),
    float: new $BucketModelField('float','float','float','float',true),
    string: new $BucketModelField('string','string','string','string',true),
    literal: new $BucketModelField('literal','literal','literal','literal',true,{
        literal: { template: 'abc' }
    }),
    regex: new $BucketModelField('regex','regex','regex','regex',true,{
        regex: { template: 'abc' }
    }),
    obj: new $BucketModelField('obj','obj','obj','obj',true, undefined, undefined, {
        a: new $BucketModelField('a','obj.a','int','a',true),
        b: new $BucketModelField('b','obj.b','string','b',true),
        c: new $BucketModelField('c','obj.c','dict','c',true, undefined, undefined, {
            '#': new $BucketModelField('#','obj.c.#','boolean','Item of c',true),
        }),
        d: new $BucketModelField('d','obj.d','list','d',true, undefined, undefined, {
            '#': new $BucketModelField('#','obj.d.#','date','Item of d',true),
        }),
    }),
    dict: new $BucketModelField('dict','dict','dict','dict',true, undefined, undefined, {
        '#': new $BucketModelField('#','dict.#','date','Item of dict',true),
    }),
    list: new $BucketModelField('list','list','list','list',true, undefined, undefined, {
        '#': new $BucketModelField('#','list.#','float','Item of list',true),
    })
});

export const very_complex_model = new $BucketModel({
    id: new $BucketModelField('id','id','int','id',true),
    boolean: new $BucketModelField('boolean','boolean','boolean','boolean',true),
    date: new $BucketModelField('date','date','date','date',true),
    datetime: new $BucketModelField('datetime','datetime','datetime','datetime',true),
    duration: new $BucketModelField('duration','duration','duration','duration',true),
    decimal: new $BucketModelField('decimal','decimal','decimal','decimal',true),
    enum: new $BucketModelField('enum','enum','enum','enum',true, {
        enum: { options: { 'a': {}, 'b': {} }}
    }),
    int: new $BucketModelField('int','int','int','int',true),
    float: new $BucketModelField('float','float','float','float',true),
    string: new $BucketModelField('string','string','string','string',true),
    literal: new $BucketModelField('literal','literal','literal','literal',true,{
        literal: { template: 'abc' }
    }),
    regex: new $BucketModelField('regex','regex','regex','regex',true,{
        regex: { template: 'abc' }
    }),
    obj: new $BucketModelField('obj','obj','obj','obj',true, undefined, undefined, {
        a: new $BucketModelField('a','obj.a','int','a',true),
        b: new $BucketModelField('b','obj.b','string','b',true),
        c: new $BucketModelField('c','obj.c','dict','c',true, undefined, undefined, {
            '#': new $BucketModelField('#','obj.c.#','boolean','Item of c',true),
        }),
        d: new $BucketModelField('d','obj.d','list','d',true, undefined, undefined, {
            '#': new $BucketModelField('#','obj.d.#','date','Item of d',true),
        }),
    }),
    dict: new $BucketModelField('dict','dict','dict','dict',true, undefined, undefined, {
        '#': new $BucketModelField('#','dict.#','date','Item of dict',true),
    }),
    list: new $BucketModelField('list','list','list','list',true, undefined, undefined, {
        '#': new $BucketModelField('#','list.#','float','Item of list',true),
    }),
    dict_obj: new $BucketModelField('dict_obj','dict_obj','dict','dict_obj',true, undefined, undefined, {
        '#': new $BucketModelField('#','dict_obj.#','obj','Item of dict_obj',true, undefined, undefined, {
            x: new $BucketModelField('x','dict_obj.#.x','int','x',true),
            y: new $BucketModelField('y','dict_obj.#.y','int','y',true),
        }),
    }),
    list_obj: new $BucketModelField('list_obj','list_obj','list','list_obj',true, undefined, undefined, {
        '#': new $BucketModelField('#','list_obj.#','obj','Item of list_obj',true, undefined, undefined, {
            x: new $BucketModelField('x','list_obj.#.x','int','x',true),
            y: new $BucketModelField('y','list_obj.#.y','int','y',true),
        }),
    }),
});

const objs: [string, any][] = [
    ['very_simple', very_simple_model],
    ['simple', simple_model],
    ['complex', complex_model],
    ['very_complex', very_complex_model]
];
export default objs;