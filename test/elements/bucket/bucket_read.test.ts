import { Log } from '~/engine/util/log'
import { t } from 'nesoi/tools/joaquin/bucket';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiCrypto } from '~/engine/util/crypto';

Log.level = 'off';

describe('Bucket: Read', () => {

    describe('One', () => {
        
        describe('Basics', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                }))
            );
                
            const obj = {
                id: 1,
                name: 'One'
            };
        
            it('error: obj id', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, {} as any)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.InvalidId')
                })
            )

            it('error: string id', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, '1' as any)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.InvalidId')
                })
            )
        
            it('ok', () => t
                .given(bucket
                    .with.obj(obj)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1)
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual(obj)
                })
            )
        
            it('error: not found', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.ObjNotFound')
                })
            )
        
            it('[no_throw]: not found', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        no_throw: true
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual(undefined)
                })
            )
        })
        
        describe('Tenancy', () => {
        
            const data = {
                1: { id: 1, user_id: 1, name: 'One' },
                2: { id: 2, user_id: 2, name: 'Two' }
            }

            const bucket = t.bucket('test', $ => $
                .tenancy({
                    'test': $ => ({ 'user_id': $.id })
                })
                .model($ => ({
                    id: $.int,
                    user_id: $.int,
                    name: $.string,
                }))
            )
                .with.data(data);
        
            it('user 1, id 1', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readOne(trx, 1)
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual(data[1])
                })
            )
        
            it('user 1, id 2', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readOne(trx, 2)
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.ObjNotFound')
                })
            )
        
            it('no user', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.bucket.readOne($.trx, 1)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.TenancyRequiresAuth')
                })
            )
        
        
            it('user 1, id 2, no tenancy', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readOne(trx, 2, {
                            no_tenancy: true
                        })
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual(data[2])
                })
            )
        
        })
            
        describe('Cast', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    datetime: $.datetime,
                }))
            );
        
            const now = NesoiDatetime.now();
        
            const objs = {
                nesoi: {
                    id: 1,
                    datetime: now
                },
                json: {
                    id: 1,
                    datetime: now.toISO()
                }
            };
        
            const frozen_objs = {
                nesoi: { ...objs.nesoi },
                json: { ...objs.json },
            }
            Object.freeze(frozen_objs.nesoi);
            Object.freeze(frozen_objs.json);
        
            function test(
                scope: 'isolated'|'shared',
                type: 'nesoi'|'json',
                op: 'cast'|'no_cast',
                out: {
                        cast: boolean,
                        clone: boolean,
                        type: 'nesoi'|'json',
                        scope: 'isolated'|'shared'|'frozen'
                    }
            ) {
                const i_obj = scope === 'isolated'
                    ? frozen_objs[type]
                    : objs[type];
                const o_obj = scope === 'isolated'
                    ? frozen_objs[out.type]
                    : objs[out.type];
        
                it(`${scope}/${type}/${op} => ${out.type} (${out.scope})`, () => t
                    .given(bucket
                        .with.behavior({
                            isolated: scope === 'isolated',
                            as_json: type === 'json',
                        })
                        .with.obj(i_obj)
                    )
                    .when.bucket('test', $ => {
                        $.spy($.bucket.model, 'cast');                
                        $.spy($.bucket.model, 'clone');                
                        return $.bucket.readOne($.trx, 1, {
                            no_cast: op === 'no_cast'
                        })
                    })
                    .then($ => {
                        if (out.cast) expect($.spy['cast']).toHaveBeenCalled();
                        else expect($.spy['cast']).not.toHaveBeenCalled();
        
                        if (out.clone) expect($.spy['clone']).toHaveBeenCalled();
                        else expect($.spy['clone']).not.toHaveBeenCalled();
        
                        const obj = $.status.output;
                        expect(obj).toEqual(o_obj)
        
                        switch (out.scope) {
                        case 'isolated':
                            expect(obj).not.toBe(o_obj)
                            expect(() => { (obj as any).__f = 0; }).not.toThrow();
                            break;
                        case 'shared':
                            expect(obj).toBe(o_obj)
                            expect(() => { (obj as any).__f = 0; }).not.toThrow();
                            break;
                        case 'frozen':
                            expect(obj).toBe(o_obj)
                            expect(() => { (obj as any).__f = 0; }).toThrow();
                            break;
                        }
                    })
                )
            }
        
            test('isolated', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'frozen'
            });
        
            test('isolated', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'frozen'
            });
        
            test('shared', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'shared'
            });
        
            test('shared', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'shared'
            });
        
        })
        
        describe('Encryption', () => {
        
            const key = '12345678901234567890123456789012';
        
            const constants = t.constants($ => $
                .values($ => ({
                    'KEY': $.static(key)
                }))
            );
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    password: $.string.encrypt('KEY'),
                }))
            );
        
            it('read decrypted', async () => t
                .given(
                    constants,
                    bucket.with.obj({
                        id: 1,
                        password: await NesoiCrypto.encrypt('12345678', key)
                    })
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1)
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1,
                        password: '12345678'
                    })
                })
            )
        
            it('read encrypted', async () => {
                const encrypted = await NesoiCrypto.encrypt('12345678', key);
                return t
                    .given(
                        constants,
                        bucket.with.obj({
                            id: 1,
                            password: encrypted
                        })
                    )
                    .when.bucket('test', $ => {
                        return $.bucket.readOne($.trx, 1, {
                            no_decrypt: true
                        })
                    })
                    .then(async $ => {
                        expect($.status.state).toEqual('ok')
                        expect($.status.output).toStrictEqual({
                            id: 1,
                            password: encrypted
                        })
                    })
            })
        })
        
        describe('Roots', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    string: $.string,
                    float: $.float,
                    datetime: $.datetime,
                }))
            )
        
            const now = NesoiDatetime.now();
            const obj = {
                id: 1,
                string: 'test',
                float: 12.34,
                datetime: now
            };
        
            it('id only', async () => t
                .given(
                    bucket.with.obj(obj)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        roots: ['id']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1
                    })
                })
            )
        
            it('1 prop (+ implicit id)', async () => t
                .given(
                    bucket.with.obj(obj)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        roots: ['string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1,
                        string: 'test'
                    })
                })
            )
        
            it('1 prop + id', async () => t
                .given(
                    bucket.with.obj(obj)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        roots: ['id', 'string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1,
                        string: 'test'
                    })
                })
            )
        
            it('2 props (+ implicit id)', async () => t
                .given(
                    bucket.with.obj(obj)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        roots: ['string', 'float']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1,
                        string: 'test',
                        float: 12.34
                    })
                })
            )
        
            it('cast', async () => t
                .given(
                    bucket
                        .with.behavior({
                            as_json: true
                        })
                        .with.obj({
                            id: 1,
                            datetime: '1970-01-01T00:00:00.000Z'
                        })
                )
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, 1, {
                        roots: ['datetime']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toStrictEqual({
                        id: 1,
                        datetime: NesoiDatetime.fromISO('1970-01-01T00:00:00.000Z')
                    })
                })
            )
        })

    })

    describe('Many', () => {
        
        describe('Basics', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                }))
            );
                
            const data = {
                1: { id: 1, name: 'One' },
                2: { id: 2, name: 'Two' },
                3: { id: 3, name: 'Three' },
                4: { id: 4, name: 'Four' },
            }
        
            it('error: obj id', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, [1,{}] as any)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.InvalidId')
                })
            )

            it('error: string id', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readOne($.trx, [1,'3'] as any)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.InvalidId')
                })
            )
        
            it('ok', () => t
                .given(bucket
                    .with.data(data)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,3])
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1],data[3]])
                })
            )
                
            it('not found', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [5,6])
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([])
                })
            )
        })
        
        describe('Tenancy', () => {
        
            const data = {
                1: { id: 1, user_id: 1, name: 'One' },
                2: { id: 2, user_id: 2, name: 'Two' },
                3: { id: 3, user_id: 1, name: 'Three' },
                4: { id: 4, user_id: 2, name: 'Four' },
            };
            const bucket = t.bucket('test', $ => $
                .tenancy({
                    'test': $ => ({ 'user_id': $.id })
                })
                .model($ => ({
                    id: $.int,
                    user_id: $.int,
                    name: $.string,
                }))
            )
                .with.data(data)
    
            it('user 1, ids 1,3', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readMany(trx, [1,3])
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1], data[3]]);
                })
            )
        
            it('user 1, id 2,4', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readMany(trx, [2,4])
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([])
                })
            )
        
            it('user 1, ids 1,2,3,4', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readMany(trx, [1,2,3,4])
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1],data[3]])
                })
            )
        
            it('no user', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.bucket.readOne($.trx, 1)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.TenancyRequiresAuth')
                })
            )
        
            it('user 1, ids 2,4, no tenancy', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readMany(trx, [2,4], {
                            no_tenancy: true
                        })
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[2],data[4]])
                })
            )
        
        })
            
        describe('Cast', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    datetime: $.datetime,
                }))
            );
        
            const now1 = NesoiDatetime.now();
            const now2 = NesoiDatetime.now().plus('1 h');
            const now3 = NesoiDatetime.now().plus('1 h');
            const now4 = NesoiDatetime.now().plus('1 h');
        
            const data = {
                nesoi: {
                    1: { id: 1, datetime: now1 },
                    2: { id: 2, datetime: now2 },
                    3: { id: 3, datetime: now3 },
                    4: { id: 4, datetime: now4 },
                },
                json: {
                    1: { id: 1, datetime: now1.toISO() },
                    2: { id: 2, datetime: now2.toISO() },
                    3: { id: 3, datetime: now3.toISO() },
                    4: { id: 4, datetime: now4.toISO() },
                }
            };
        
            const frozen_data = {
                nesoi: Object.fromEntries(Object.values(data.nesoi).map(obj => [obj.id, ({ ...obj })])),
                json: Object.fromEntries(Object.values(data.json).map(obj => [obj.id, ({ ...obj })])),
            }
            Object.values(frozen_data.nesoi).forEach(obj => Object.freeze(obj));
            Object.values(frozen_data.json).forEach(obj => Object.freeze(obj));
        
            function test(
                scope: 'isolated'|'shared',
                type: 'nesoi'|'json',
                op: 'cast'|'no_cast',
                out: {
                        cast: boolean,
                        clone: boolean,
                        type: 'nesoi'|'json',
                        scope: 'isolated'|'shared'|'frozen'
                    }
            ) {
                const i_data = scope === 'isolated'
                    ? frozen_data[type]
                    : data[type];
                const o_data = scope === 'isolated'
                    ? frozen_data[out.type]
                    : data[out.type];
        
                it(`${scope}/${type}/${op} => ${out.type} (${out.scope})`, () => t
                    .given(bucket
                        .with.behavior({
                            isolated: scope === 'isolated',
                            as_json: type === 'json',
                        })
                        .with.data(i_data)
                    )
                    .when.bucket('test', $ => {
                        $.spy($.bucket.model, 'cast');                
                        $.spy($.bucket.model, 'clone');                
                        return $.bucket.readMany($.trx, [1,3], {
                            no_cast: op === 'no_cast'
                        })
                    })
                    .then($ => {
                        if (out.cast) expect($.spy['cast']).toHaveBeenCalled();
                        else expect($.spy['cast']).not.toHaveBeenCalled();
        
                        if (out.clone) expect($.spy['clone']).toHaveBeenCalled();
                        else expect($.spy['clone']).not.toHaveBeenCalled();
        
                        const objs = $.status.output!;
                        expect(objs).toEqual([o_data[1], o_data[3]])
        
                        switch (out.scope) {
                        case 'isolated':
                            expect(objs[0]).not.toBe(o_data[1])
                            expect(objs[1]).not.toBe(o_data[3])
                            expect(() => { (objs[0] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).not.toThrow();
                            break;
                        case 'shared':
                            expect(objs[0]).toBe(o_data[1])
                            expect(objs[1]).toBe(o_data[3])
                            expect(() => { (objs[0] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).not.toThrow();
                            break;
                        case 'frozen':
                            expect(objs[0]).toBe(o_data[1])
                            expect(objs[1]).toBe(o_data[3])
                            expect(() => { (objs[0] as any).__f = 0; }).toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).toThrow();
                            break;
                        }
                    })
                )
            }
        
            test('isolated', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'frozen'
            });
        
            test('isolated', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'frozen'
            });
        
            test('shared', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'shared'
            });
        
            test('shared', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'shared'
            });
        
        })
        
        describe('Encryption', () => {
        
            const key = '12345678901234567890123456789012';
        
            const constants = t.constants($ => $
                .values($ => ({
                    'KEY': $.static(key)
                }))
            );
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    password: $.string.encrypt('KEY'),
                }))
            );
        
            it('read decrypted', async () => {
                const encrypted1 = await NesoiCrypto.encrypt('12345678', key);
                const encrypted2 = await NesoiCrypto.encrypt('abcdefgh', key);
                return t
                    .given(
                        constants,
                        bucket
                            .with.obj({ id: 1, password: encrypted1 })
                            .with.obj({ id: 2, password: encrypted2 })
                    )
                    .when.bucket('test', $ => {
                        return $.bucket.readMany($.trx, [1,2])
                    })
                    .then($ => {
                        expect($.status.state).toEqual('ok')
                        expect($.status.output).toEqual([
                            { id: 1, password: '12345678' },
                            { id: 2, password: 'abcdefgh' },
                        ])
                    })
            })
        
            it('read encrypted', async () => {
                const encrypted1 = await NesoiCrypto.encrypt('12345678', key);
                const encrypted2 = await NesoiCrypto.encrypt('abcdefgh', key);
                return t
                    .given(
                        constants,
                        bucket
                            .with.obj({ id: 1, password: encrypted1 })
                            .with.obj({ id: 2, password: encrypted2 })
                    )
                    .when.bucket('test', $ => {
                        return $.bucket.readMany($.trx, [1,2], {
                            no_decrypt: true
                        })
                    })
                    .then(async $ => {
                        expect($.status.state).toEqual('ok')
                        expect($.status.output).toEqual([
                            { id: 1, password: encrypted1 },
                            { id: 2, password: encrypted2 }
                        ])
                    })
            })
        })
        
        describe('Roots', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    string: $.string,
                    float: $.float,
                    datetime: $.datetime,
                }))
            )
        
            const now1 = NesoiDatetime.now();
            const now2 = NesoiDatetime.now().plus('1 h');

            const obj1 = {
                id: 1,
                string: 'test1',
                float: 12.34,
                datetime: now1
            };
            const obj2 = {
                id: 2,
                string: 'test2',
                float: 56.78,
                datetime: now2
            };
        
            it('id only', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,2], {
                        roots: ['id']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1 },
                        { id: 2 }
                    ])
                })
            )
        
            it('1 prop (+ implicit id)', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,2], {
                        roots: ['string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1' },
                        { id: 2, string: 'test2' },
                    ])
                })
            )
        
            it('1 prop + id', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,2], {
                        roots: ['id', 'string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1' },
                        { id: 2, string: 'test2' },
                    ])
                })
            )
        
            it('2 props (+ implicit id)', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,2], {
                        roots: ['string', 'float']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1', float: 12.34 },
                        { id: 2, string: 'test2', float: 56.78 }
                    ])
                })
            )
        
            it('cast', async () => t
                .given(
                    bucket
                        .with.behavior({ as_json: true })
                        .with.obj({ id: 1, datetime: '1970-01-01T00:00:00.000Z' })
                        .with.obj({ id: 2, datetime: '1971-01-01T00:00:00.000Z' })
                )
                .when.bucket('test', $ => {
                    return $.bucket.readMany($.trx, [1,2], {
                        roots: ['datetime']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, datetime: NesoiDatetime.fromISO('1970-01-01T00:00:00.000Z') },
                        { id: 2, datetime: NesoiDatetime.fromISO('1971-01-01T00:00:00.000Z') }
                    ])
                })
            )
        })

    })

    describe('All', () => {
        
        describe('Basics', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                }))
            );
                
            const data = {
                1: { id: 1, name: 'One' },
                2: { id: 2, name: 'Two' },
                3: { id: 3, name: 'Three' },
                4: { id: 4, name: 'Four' },
            }
        
        
            it('ok', () => t
                .given(bucket
                    .with.data(data)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx)
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1],data[2],data[3],data[4]])
                })
            )
                
            it('empty', () => t
                .given(bucket)
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx)
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([])
                })
            )
        })
        
        describe('Tenancy', () => {
        
            const data = {
                1: { id: 1, user_id: 1, name: 'One' },
                2: { id: 2, user_id: 2, name: 'Two' },
                3: { id: 3, user_id: 1, name: 'Three' },
                4: { id: 4, user_id: 2, name: 'Four' },
            };
            const bucket = t.bucket('test', $ => $
                .tenancy({
                    'test': $ => ({ 'user_id': $.id })
                })
                .model($ => ({
                    id: $.int,
                    user_id: $.int,
                    name: $.string,
                }))
            )
                .with.data(data)
    
            it('user 1', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readAll(trx)
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1], data[3]]);
                })
            )
    
            it('user 2', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '2' }).then(trx => {
                        return $.bucket.readAll(trx)
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[2], data[4]]);
                })
            )
        
            it('no user', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.bucket.readAll($.trx)
                })
                .then($ => {
                    expect($.status.state).toEqual('error')
                    expect($.status.error!.name).toEqual('Bucket.TenancyRequiresAuth')
                })
            )
        
            it('user 1, no tenancy', () => t
                .given(bucket)
                .when.bucket('test', async $ => {
                    return $.trx.authenticate({ 'test': '1' }).then(trx => {
                        return $.bucket.readAll(trx, {
                            no_tenancy: true
                        })
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([data[1],data[2],data[3],data[4]])
                })
            )
        
        })
            
        describe('Cast', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    datetime: $.datetime,
                }))
            );
        
            const now1 = NesoiDatetime.now();
            const now2 = NesoiDatetime.now().plus('1 h');
            const now3 = NesoiDatetime.now().plus('1 h');
            const now4 = NesoiDatetime.now().plus('1 h');
        
            const data = {
                nesoi: {
                    1: { id: 1, datetime: now1 },
                    2: { id: 2, datetime: now2 },
                    3: { id: 3, datetime: now3 },
                    4: { id: 4, datetime: now4 },
                },
                json: {
                    1: { id: 1, datetime: now1.toISO() },
                    2: { id: 2, datetime: now2.toISO() },
                    3: { id: 3, datetime: now3.toISO() },
                    4: { id: 4, datetime: now4.toISO() },
                }
            };
        
            const frozen_data = {
                nesoi: Object.fromEntries(Object.values(data.nesoi).map(obj => [obj.id, ({ ...obj })])),
                json: Object.fromEntries(Object.values(data.json).map(obj => [obj.id, ({ ...obj })])),
            }
            Object.values(frozen_data.nesoi).forEach(obj => Object.freeze(obj));
            Object.values(frozen_data.json).forEach(obj => Object.freeze(obj));
        
            function test(
                scope: 'isolated'|'shared',
                type: 'nesoi'|'json',
                op: 'cast'|'no_cast',
                out: {
                        cast: boolean,
                        clone: boolean,
                        type: 'nesoi'|'json',
                        scope: 'isolated'|'shared'|'frozen'
                    }
            ) {
                const i_data = scope === 'isolated'
                    ? frozen_data[type]
                    : data[type];
                const o_data = scope === 'isolated'
                    ? frozen_data[out.type]
                    : data[out.type];
        
                it(`${scope}/${type}/${op} => ${out.type} (${out.scope})`, () => t
                    .given(bucket
                        .with.behavior({
                            isolated: scope === 'isolated',
                            as_json: type === 'json',
                        })
                        .with.data(i_data)
                    )
                    .when.bucket('test', $ => {
                        $.spy($.bucket.model, 'cast');                
                        $.spy($.bucket.model, 'clone');                
                        return $.bucket.readAll($.trx, {
                            no_cast: op === 'no_cast'
                        })
                    })
                    .then($ => {
                        if (out.cast) expect($.spy['cast']).toHaveBeenCalled();
                        else expect($.spy['cast']).not.toHaveBeenCalled();
        
                        if (out.clone) expect($.spy['clone']).toHaveBeenCalled();
                        else expect($.spy['clone']).not.toHaveBeenCalled();
        
                        const objs = $.status.output!;
                        expect(objs).toEqual([o_data[1], o_data[2], o_data[3], o_data[4]])
        
                        switch (out.scope) {
                        case 'isolated':
                            expect(objs[0]).not.toBe(o_data[1])
                            expect(objs[1]).not.toBe(o_data[2])
                            expect(objs[2]).not.toBe(o_data[3])
                            expect(objs[3]).not.toBe(o_data[4])
                            expect(() => { (objs[0] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[2] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[3] as any).__f = 0; }).not.toThrow();
                            break;
                        case 'shared':
                            expect(objs[0]).toBe(o_data[1])
                            expect(objs[1]).toBe(o_data[2])
                            expect(objs[2]).toBe(o_data[3])
                            expect(objs[3]).toBe(o_data[4])
                            expect(() => { (objs[0] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[2] as any).__f = 0; }).not.toThrow();
                            expect(() => { (objs[3] as any).__f = 0; }).not.toThrow();
                            break;
                        case 'frozen':
                            expect(objs[0]).toBe(o_data[1])
                            expect(objs[1]).toBe(o_data[2])
                            expect(objs[2]).toBe(o_data[3])
                            expect(objs[3]).toBe(o_data[4])
                            expect(() => { (objs[0] as any).__f = 0; }).toThrow();
                            expect(() => { (objs[1] as any).__f = 0; }).toThrow();
                            expect(() => { (objs[2] as any).__f = 0; }).toThrow();
                            expect(() => { (objs[3] as any).__f = 0; }).toThrow();
                            break;
                        }
                    })
                )
            }
        
            test('isolated', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'nesoi', 'cast', {
                cast: false,
                clone: true,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('shared', 'json', 'cast', {
                cast: true,
                clone: false,
                type: 'nesoi',
                scope: 'isolated'
            });
        
            test('isolated', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'frozen'
            });
        
            test('isolated', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'frozen'
            });
        
            test('shared', 'nesoi', 'no_cast', {
                cast: false,
                clone: false,
                type: 'nesoi',
                scope: 'shared'
            });
        
            test('shared', 'json', 'no_cast', {
                cast: false,
                clone: false,
                type: 'json',
                scope: 'shared'
            });
        
        })
        
        describe('Encryption', () => {
        
            const key = '12345678901234567890123456789012';
        
            const constants = t.constants($ => $
                .values($ => ({
                    'KEY': $.static(key)
                }))
            );
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    password: $.string.encrypt('KEY'),
                }))
            );
        
            it('read decrypted', async () => {
                const encrypted1 = await NesoiCrypto.encrypt('12345678', key);
                const encrypted2 = await NesoiCrypto.encrypt('abcdefgh', key);
                return t
                    .given(
                        constants,
                        bucket
                            .with.obj({ id: 1, password: encrypted1 })
                            .with.obj({ id: 2, password: encrypted2 })
                    )
                    .when.bucket('test', $ => {
                        return $.bucket.readAll($.trx)
                    })
                    .then($ => {
                        expect($.status.state).toEqual('ok')
                        expect($.status.output).toEqual([
                            { id: 1, password: '12345678' },
                            { id: 2, password: 'abcdefgh' },
                        ])
                    })
            })
        
            it('read encrypted', async () => {
                const encrypted1 = await NesoiCrypto.encrypt('12345678', key);
                const encrypted2 = await NesoiCrypto.encrypt('abcdefgh', key);
                return t
                    .given(
                        constants,
                        bucket
                            .with.obj({ id: 1, password: encrypted1 })
                            .with.obj({ id: 2, password: encrypted2 })
                    )
                    .when.bucket('test', $ => {
                        return $.bucket.readAll($.trx, {
                            no_decrypt: true
                        })
                    })
                    .then(async $ => {
                        expect($.status.state).toEqual('ok')
                        expect($.status.output).toEqual([
                            { id: 1, password: encrypted1 },
                            { id: 2, password: encrypted2 }
                        ])
                    })
            })
        })
        
        describe('Roots', () => {
        
            const bucket = t.bucket('test', $ => $
                .model($ => ({
                    id: $.int,
                    string: $.string,
                    float: $.float,
                    datetime: $.datetime,
                }))
            )
        
            const now1 = NesoiDatetime.now();
            const now2 = NesoiDatetime.now().plus('1 h');

            const obj1 = {
                id: 1,
                string: 'test1',
                float: 12.34,
                datetime: now1
            };
            const obj2 = {
                id: 2,
                string: 'test2',
                float: 56.78,
                datetime: now2
            };
        
            it('id only', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx, {
                        roots: ['id']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1 },
                        { id: 2 }
                    ])
                })
            )
        
            it('1 prop (+ implicit id)', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx, {
                        roots: ['string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1' },
                        { id: 2, string: 'test2' },
                    ])
                })
            )
        
            it('1 prop + id', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx, {
                        roots: ['id', 'string']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1' },
                        { id: 2, string: 'test2' },
                    ])
                })
            )
        
            it('2 props (+ implicit id)', async () => t
                .given(
                    bucket
                        .with.obj(obj1)
                        .with.obj(obj2)
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx, {
                        roots: ['string', 'float']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, string: 'test1', float: 12.34 },
                        { id: 2, string: 'test2', float: 56.78 }
                    ])
                })
            )
        
            it('cast', async () => t
                .given(
                    bucket
                        .with.behavior({ as_json: true })
                        .with.obj({ id: 1, datetime: '1970-01-01T00:00:00.000Z' })
                        .with.obj({ id: 2, datetime: '1971-01-01T00:00:00.000Z' })
                )
                .when.bucket('test', $ => {
                    return $.bucket.readAll($.trx, {
                        roots: ['datetime']
                    })
                })
                .then($ => {
                    expect($.status.state).toEqual('ok')
                    expect($.status.output).toEqual([
                        { id: 1, datetime: NesoiDatetime.fromISO('1970-01-01T00:00:00.000Z') },
                        { id: 2, datetime: NesoiDatetime.fromISO('1971-01-01T00:00:00.000Z') }
                    ])
                })
            )
        })

    })


})
