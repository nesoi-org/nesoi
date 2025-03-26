import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::camera')
    .model($ => ({
        id: $.int,
        state: $.string,
        alias: $.string,
        hash: $.string,
        stream_id: $.string,
        harbor_id: $.int,
        coord_x: $.float,
        coord_y: $.float,
        coord_z: $.float,
        rot_x: $.float,
        rot_y: $.float,
        rot_z: $.float,
        type_id: $.int,
        sensor_width: $.float,
        sensor_height: $.float,
    }))
    .view('default', $ => ({
        state: $.model('state'),
        alias: $.model('alias'),
        stream_id: $.model('stream_id'),
        coord: $.model('stream_id'),
    }))