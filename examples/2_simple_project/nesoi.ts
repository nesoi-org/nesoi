import { Space } from 'nesoi/lib/engine/space';
import SimpleProject from './.nesoi/simple_project'

const Nesoi = new Space<SimpleProject>(__dirname)
    .name('SimpleProject');

export default Nesoi;