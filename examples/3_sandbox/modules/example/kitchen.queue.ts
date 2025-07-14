import Nesoi from '../../nesoi';

export default Nesoi.queue('example::kitchen')
    .message('wash', $ => ({
        speed: $.float
    }));