yaml = require('js-yaml');
fs   = require('fs');


var yml_doc = {};

module.exports.readYML = function() {
    try {
        yml_doc = yaml.safeLoad(fs.readFileSync('./yml/sample4.yml', 'utf8'));
    } catch (err) {
        console.log(err);
    }
    return yml_doc;
};

module.exports.updateYML = function(new_yml){
    yml_doc = new_yml;
};