import Nesoi from '../../nesoi';

export default Nesoi.externals('example')
    .bucket('irrigation::area')
    .message('irrigation::send_water')
    // .job('');
    