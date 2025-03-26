// import { MachineBuilder } from '~/elements/blocks/machine/machine.builder';
import Nesoi from '../../nesoi';

export default Nesoi.machine('example::walker')
    .as('Big Box')
    .authn('api')
    .bucket(['bigbox'])
    .stateField('state')
    
// .messages($ => ({
//     'walk': {
//         id: $.int,
//         run: $.boolean
//     },
//     'jump': {
//         force: $.float.rule($ => $.value > 3 || 'Foo')
//     }
// }))

    .state('idle', $ => $
        
    )
    .state('running', $ => $
        .afterEnter($ => $
            .method($ => {
                console.log('IDLE!')
            })
        )
    )

// .state('idle', $ => $

//     .afterEnter($ => $
//         .extra($ => ({
//             joco: 4
//         }))
//         .assert($ => {
//             return $.msg.$ === 'walker.walk' 
//                 ? ($.msg.run || 'Complexo')
//                 : true
//         })
//         .method(async $ => {
//             return $.trx.message({
//                 $: 'walker.jump',
//                 force: 10
//             })
//         })
//     )

//     .state('laying_down', $ => $
//         .transition('bigbox.update', $ => $
//             .if($ => {
//                 return true;
//             })
//             .runJob($ => $
//                 .method($ => {
//                     console.log('I\'m standing up!');
//                 })
//             )
//             .goTo('standing_up')
//             .else($ => $
//                 .goTo('idle')
//                 .runJob('bigbox.update')
//                 .if($ => true)
//                 .else($ => $
//                     .if($ => 1 > 3 || 'FUCK!')
//                     .else($ => $
//                         .if($ => `one more${$.msg.id}` === 'time' || 'hehe')
//                         .runJob($ => $
//                             .extra($ => ({
//                                 1: 3
//                             }))
//                         )
//                     )
//                 )
//             )
//         )
//         .beforeLeave($ => $
//             .method($ => {
//                 console.log('Leaving the laying down');
//             })
//         )
//     )
// )
// .state('standing_up', $ => $
//     .transition('@.walk', $ => $
//         .if($ => {
//             return $.msg.run || 'Faiô!'
//         })
//         .runJob($ => $
//             .method($ => $.msg)
//         )
//         .goTo('idle')
//     )
//     .beforeLeave($ => $
//         .method($ => {
//             console.log('Leaving the standing up')
//         })
//     )
// )

// .logger($ => {
//     console.log($.output.summary())
// })