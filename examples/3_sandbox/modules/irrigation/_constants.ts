import Nesoi from '../../nesoi';

export default Nesoi.constants('irrigation')

    .enum('daytime', $ => ({
        'morning': $.opt('morning'),
        'afternoon': $.opt('afternoon'),
        'night': $.opt('night')
    }))