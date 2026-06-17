/* eslint-disable no-prototype-builtins */
import { NesoiBenchmarkSuite } from '../../lib/suite';

function is_obj(v: any) {
    return typeof v === 'object'
}

export default new NesoiBenchmarkSuite('is_obj', {
    n: [0,1],
    data: n => ({
        obj: { x: 0 },
        primitive: 0
    })
})
    .add_('[ typeof ]', data => {
        const a = typeof data.obj === 'object'
        const b = typeof data.primitive === 'object'
    })
    .add_('[ fn typeof ]', data => {
        const a = is_obj(data.obj)
        const b = is_obj(data.primitive)
    })
    .add_('[ getPrototypeOf ]', data => {
        const a = !!Object.getPrototypeOf(data.obj)
        const b = !!Object.getPrototypeOf(data.primitive)
    })
    .add_('[ keys length ]', data => {
        const a = !!Object.keys(data.obj).length
        const b = !!Object.keys(data.primitive).length
    })