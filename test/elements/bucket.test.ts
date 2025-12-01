import type { AnyBucket} from '~/elements/entities/bucket/bucket';

import { Log } from '~/engine/util/log'
import { $id, Bucket } from '~/elements/entities/bucket/bucket';

Log.level = 'off';

describe('Bucket', () => {

    describe('Replace Future ID', () => {

        const bucket = new Bucket({} as any, { model: {} } as any);
        const replaceFutureId = (bucket as any).replaceFutureId.bind(bucket) as AnyBucket['replaceFutureId'];

        it('should replace id on object', async() => {
            // given
            const obj = {
                future_id: $id,
                number: 12.34,
                string: 'string',
                boolean: true,
                other_future_id: $id,
                nested: {
                    future_id: $id,
                    number: 12.34,
                    string: 'string',
                    boolean: true,
                    other_future_id: $id,
                    deep_nested: {
                        future_id: $id,
                        number: 12.34,
                        string: 'string',
                        boolean: true,
                        other_future_id: $id,
                    }
                },
                array: [
                    $id,
                    12.34,
                    'string',
                    true,
                    $id,
                    [
                        $id,
                        12.34,
                        'string',
                        true,
                        $id
                    ]
                ],
                mixed: {
                    future_id: $id,
                    array: [
                        $id,
                        {
                            future_id: $id
                        }
                    ]
                }
            }
            // when
            replaceFutureId(obj, 999);
            // then
            expect(obj).toEqual({
                future_id: 999,
                number: 12.34,
                string: 'string',
                boolean: true,
                other_future_id: 999,
                nested: {
                    future_id: 999,
                    number: 12.34,
                    string: 'string',
                    boolean: true,
                    other_future_id: 999,
                    deep_nested: {
                        future_id: 999,
                        number: 12.34,
                        string: 'string',
                        boolean: true,
                        other_future_id: 999,
                    }
                },
                array: [
                    999,
                    12.34,
                    'string',
                    true,
                    999,
                    [
                        999,
                        12.34,
                        'string',
                        true,
                        999
                    ]
                ],
                mixed: {
                    future_id: 999,
                    array: [
                        999,
                        {
                            future_id: 999
                        }
                    ]
                }
            })
        })

    })

})
