yaml  = require('js-yaml');    //parsing YML files
yaml2 = require('rsa-yamljs'); //converting JSON back to YML.
myml  = require('meta-yaml');  //generate meta json for double quotes.
fs    = require('fs');

var yml_confs = [];
var meta_confs = [];

module.exports.updateYML = function(path, file_id, json_in){
    var yml_list = this.getYMLConfList();
    var yml_file = yml_list[file_id];

    console.log(meta_confs[file_id][yml_file]);

    yml_out = yaml2.dump(json_in[yml_file], null, null, null, null, meta_confs[file_id][yml_file]);

    fs.writeFile(path + '/' + yml_file, '---\n' + yml_out , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
};

module.exports.readAllYML = function (path) {
    var files = fs.readdirSync(path);
    for (var file in files){
        try {
            var json_out = {};
            json_out[files[file]] = yaml.safeLoad(fs.readFileSync(path + '//'  + files[file], 'utf8'));
            yml_confs.push(json_out);
            var meta_out = {};
            meta_out[files[file]] = myml.parse(fs.readFileSync(path + '//'  + files[file], 'utf8'));
            meta_confs.push(meta_out);
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