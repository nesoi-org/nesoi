import Nesoi from '../../nesoi';

export default Nesoi.externals('irrigation')
    .bucket('example::circle')
    .bucket('example::bigbox')
    .job('example::bigbox.create')
    .machine('example::walker')