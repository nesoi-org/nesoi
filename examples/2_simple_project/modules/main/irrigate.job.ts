import Nesoi from '../../nesoi';

export default Nesoi.job('main::irrigate')
    .messages($ => ({
        '': {
            plant: $.id('plant'),
            volume: $.float
        }
    }))
    .input('@')
    .assert($ => 
        $.msg.plant.color !== 'pink'
        || 'Can\'t irrigate pink plant, sorry.'
    )
    .assert($ => 
        $.msg.volume < 5
        || 'Too much water!'
    )
    .method($ => {
        $.trx.bucket('plant').patch({
            id: $.msg.plant.id,
            length: $.msg.plant.length + 1
        })
    })