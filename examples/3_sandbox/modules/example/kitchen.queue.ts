import Nesoi from '../../nesoi';

export default Nesoi.queue('example::kitchen')
    .messages($ => ({
        wash: {
            speed: $.float
        }
    }))
    .input('@.wash');