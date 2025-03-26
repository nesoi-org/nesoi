import Nesoi from '../../nesoi';

export default Nesoi.resource('example::camera')
    .bucket('camera')
    .view('default')
    .query('default')
    .create($ => $
        .input($ => ({
            alias: $.as('Alias').string,
            stream_id: $.as('Stream ID').string,
            type: $.as('Modelo de Câmera').id('camera_type'),
            user: $.as('Usuário').string,
            password: $.as('Senha').string,
        }))
        .extra(async $ => ({
            hash: 'hash'
        }))
        .prepare($ => ({
            state: 'created',

            alias: $.msg.alias,
            stream_id: $.msg.stream_id,
            harbor_id: 2,

            // Create on the center of the map
            coord_x: 2500,
            coord_y: 150,
            coord_z: -2000,

            rot_x: 0,
            rot_y: 0,
            rot_z: 0,

            // Set sensor size based on camera type
            type_id: $.msg.type.id,
            sensor_width: $.msg.type.sensor_width,
            sensor_height: $.msg.type.sensor_height,

            hash: $.extra.hash
        }))
    )
    .update($ => $
        .input($ => ({
            alias: $.as('Alias').string.optional,
            stream_id: $.as('Stream ID').string.optional,
            type: $.as('Modelo de Câmera').id('camera_type').optional,
            coord: $.as('Coordenadas').obj({
                x: $.as('x').float,
                y: $.as('y').float,
                z: $.as('z').float,
            }).optional,
            rot: $.as('Rotação').obj({
                x: $.as('x').float,
                y: $.as('y').float,
                z: $.as('z').float,
            }).optional,
            user: $.as('Usuário').string.optional,
            password: $.as('Senha').string.optional,
        }))
        .extra(async $ => ({
            hash: 'has'
        }))
        .prepare($ => ({
            alias: $.msg.alias,
            stream_id: $.msg.stream_id,

            // Create on the center of the map
            coord_x: $.msg.coord?.x,
            coord_y: $.msg.coord?.y,
            coord_z: $.msg.coord?.z,

            // Create on the center of the map
            rot_x: $.msg.rot?.x,
            rot_y: $.msg.rot?.y,
            rot_z: $.msg.rot?.z,

            // Set sensor size based on camera type
            type_id: $.msg.type?.id,
            sensor_width: $.msg.type?.sensor_width,
            sensor_height: $.msg.type?.sensor_height,

            hash: $.extra.hash
        }))
    )
    .delete($ => $)