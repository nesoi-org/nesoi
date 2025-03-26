import Nesoi from '../../nesoi';

export default Nesoi.constants('example')

    .values($ => ({
        API_URL: $.static('http://www.google.com/api'),
        API_URL_V2: $.runtime(),
    }))
    
    .enum('color_type', $ => ({
        'rgb': $.opt('rgb'),
        'pantone': $.opt('pantone'),
    }))

    .enum('equipment_color.rgb.no_blue', $ => ({
        red: $.opt('#ff0000'),
        green: $.opt('#00ff00')
    }))

    .enum('equipment_color.rgb.yes_blue', $ => ({
        blue: $.opt('#0000ff')
    }))
    
    .enum('equipment_color.pantone', $ => ({
        copyright_infringement1: $.opt('#ff0000'),
        copyright_infringement2: $.opt('#00ff00'),
        copyright_infringement3: $.opt('#0000ff')
    }));

    