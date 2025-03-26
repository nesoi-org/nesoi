import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::camera_type')
    .model($ => ({
        id: $.int,
        name: $.string,
        supplier: $.string,
        sensor_width: $.float,
        sensor_height: $.float,
    }))