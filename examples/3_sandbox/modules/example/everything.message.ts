import Nesoi from '../../nesoi';

export default Nesoi.message('example::everything')
    .as('Bootstrap n1')
    .template($ => ({
        prop_boolean: $.boolean.array.default([true, false]),
        prop_date: $.date,
        prop_datetime: $.datetime,
        prop_enum_1: $.enum('color_type'),
        prop_enum: $.enum('equipment_color'),
        prop_float: $.float.or($.string),
        prop_int: $.int
            .rule($ => $.value === 3 ? { set: 4 } : 'Invalid CPF'),
        prop_string: $.string,
        prop_bucket: $.id('bigbox'),
        prop_obj: $.obj({
            prop_obj_flat: $.int,
            prop_obj_child: $.obj({
                prop_obj_subchild: $.date
            })
        })
            .or($.string),
        prop_dict: $.dict($.obj({
            papa: $.float
        })),
        prop_msg: $.msg('bigbox.create', {})
    }));