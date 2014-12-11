yaml  = require('js-yaml'); //used for parsing YML files
yaml2 = require('rsa-yamljs'); //used for converting JSON back to YML.
fs    = require('fs');

var yml_confs = [];
var meta_confs = [];

module.exports.updateYML = function(path, file_id, json_in){
    var yml_list = this.getYMLConfList();
    var meta_list = this.getMetaConfList();
    var yml_file = yml_list[file_id];

    var meta_found = false;
    var meta_id = 0;
    var meta_file = "";

    for (var meta in meta_list)
    {
        if (meta_list[meta] === yml_file) {
            meta_found = true;
            meta_file = yml_file;
            meta_id = meta;
        }
    }

    if (meta_found) {
        yml_out = yaml2.dump(json_in[yml_file], null, null, null, null, meta_confs[meta_id][meta_file]);
    } else {
        yml_out = yaml2.dump(json_in[yml_file]);
    }

    fs.writeFile(path + '/' + yml_file + '.yml', '---\n' + yml_out , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
};

module.exports.readAllYML = function (path) {
    var files = fs.readdirSync(path);
    var extension=/\.[0-9a-z]+$/i;
    for (var file in files){
        try {
            var json_out = {};
            if (files[file].match(extension)[0] === '.yml') {
                var key = files[file].substr(0, files[file].lastIndexOf('.'));
                json_out[key] = yaml.safeLoad(fs.readFileSync(path + '//'  + files[file], 'utf8'));
                yml_confs.push(json_out);
            } else if (files[file].match(extension)[0] === '.meta') {
                var key = files[file].substr(0, files[file].lastIndexOf('.'));
                json_out[key] = yaml.safeLoad(fs.readFileSync(path + '//'  + files[file], 'utf8'));
                meta_confs.push(json_out);
            }
        } catch (err) {
            console.log(files[file] + ' has error :' + err);
        }
    }

    return [yml_confs, meta_confs];
};

function extractFileNames(file_list) {
    var files_out = [];
    for(var item in file_list){
        for (var key in file_list[item]){
            files_out.push(key);
        }
    }
    return files_out;
}

module.exports.getYMLConfList = function(){
    return extractFileNames(yml_confs);
};

module.exports.getMetaConfList = function(){
    return extractFileNames(meta_confs);
};
