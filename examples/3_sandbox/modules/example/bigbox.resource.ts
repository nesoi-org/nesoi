import Nesoi from '../../nesoi';

export default Nesoi.resource('example::bigbox')
    .as('Big Box')
    .bucket('bigbox')
    .auth('api')

    .view('family', 'name_only')
    // .query('family', 'name_only')

    .query('default', $ => $
        .auth('api')
        .query({
            
        })
    )

    .create($ => $
        .input($ => ({
            // lolo: $.msg('bigbox.create'),
            prop_enum_1: $.enum('color_type'),
            prop_enum: $.enum('equipment_color').rule($ => $.value === 'copyright_infringement1' || 'HEHEHE')
        }))
        .assert($ =>
            $.that('query is empty', { amount: $.msg.prop_enum_1 })
                .else('Foo')
        )
        .prepare($ => ({
            amount: 3,
            kaka: [],
            jojo: {},
            la: 'a',
            la2: 'rgb',
            reco: {},
            simpleobj: [],
            state: 'oi'
        }))
        .after($ => {
            
        })
    )
    .update($ => $
        .input($ => ({
            // lolo: $.msg('bigbox.create'),
            propop: $.enum('equipment_color').rule($ => $.value === 'copyright_infringement2' || 'HIHIHI')
        }))
        .assert($ => {
            return true;
        })
        .prepare($ => ({
            amount: 3,
            kaka: [],
            jojo: {},
            la: 'a',
            la2: 'pantone',
            reco: {},
            simpleobj: [],
            state: 'oi'
        }))
        .after($ => {
            
        })
    )
    .delete($ => $
        // .input($ => ({}))
        .extra($ => {
            console.log('heyo');
            return {}
        })
        // .prepare($ => true)
        // .after($ => {
            
        // })
    );