import Nesoi from '../../nesoi';

export default Nesoi.controller('example::bigbox')
    .domain('crud', $ => $
        .auth('api')
        .version('v1')

        .endpoint('create', $ => $
            .msg('bigbox.create')
            .toResource('bigbox')
        )

        .endpoint('query', $ => $
            .msg('bigbox.query')
            .toResource('bigbox')
        )

        .endpoint('update', $ => $
            .tag('POST')
            .msg('bigbox.update')
            .toResource('bigbox')
        )

        .group('actions', $ => $
            .endpoint('explode', $ => $
                .tag('http:PATCH')
                .msg('log_something.trigger')
                .toJob('log_something', {
                    
                })
            )
        )
    )

    .topic('dinner', $ => $
        .as('Dinner')
        .auth('api')
    )
