yaml = require('js-yaml');
fs   = require('fs');

module.exports.readYML = function(file_in) {
    var json_out = {};
    try {
        json_out = yaml.safeLoad(fs.readFileSync('./yml/' + file_in + '.yml', 'utf8'));
    } catch (err) {
        console.log(err);
    }
    return json_out;
};

module.exports.updateYML = function(json_in, file_out){
    var fs = require('fs');
    var yml_out = yaml.safeDump(json_in);
    fs.writeFile('./yml/' + file_out + '-out.yml', '---\n' + yml_out , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
};