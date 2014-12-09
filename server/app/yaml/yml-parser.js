yaml = require('js-yaml'); //used for parsing YML files
yaml2 = require('rsa-yamljs'); //used for converting JSON back to YML.

fs   = require('fs');
var metadata_conf = {};

module.exports.readYML = function(file_in) {
    var json_out = {};
    try {
        json_out = yaml.safeLoad(fs.readFileSync('./yml/' + file_in + '.yml', 'utf8'));
    } catch (err) {
        console.log(err);
    }

    // Load the associated metadata conf file for the loaded conf file.
    try {
        metadata_conf = yaml.safeLoad(fs.readFileSync('./yml/' + file_in + '-conf.yml', 'utf8'));
    }
    catch (err) {
        console.log(err);
    }

    return json_out;
};

module.exports.updateYML = function(json_in, file_out){
    var fs = require('fs');
    yml_out = yaml2.dump(json_in, null, null, null, null, metadata_conf);

    fs.writeFile('./yml/' + file_out + '-out.yml', '---\n' + yml_out , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
};