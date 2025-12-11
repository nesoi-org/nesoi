import Nesoi from '../../nesoi';

export default Nesoi.topic('example::dinner')


    .message('ready', $ => ({
        food: $.enum(['pasta', 'pizza'])
    }))
    .input('@.ready')

    .subscriber($ => $
        .auth('api')
    )