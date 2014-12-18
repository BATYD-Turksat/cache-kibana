yaml  = require('js-yaml');    //parsing YML files
yaml2 = require('rsa-yamljs'); //converting JSON back to YML.
myml  = require('meta-yaml');  //generate meta json for double quotes.
fs    = require('fs');
_     = require('lodash');

var yml_confs = [];
var yml_conf_list = [];
var meta_confs = [];
var meta_conf_list = [];
var meta_path = '';

function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = dir + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
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

module.exports.updateYML = function(file_id, json_in){
    var yml_list = this.getYMLConfList();
    var yml_file = yml_list[file_id];
    yml_confs[file_id][yml_file] = _.clone(json_in[yml_file]);
    yml_out = yaml2.dump(yml_confs[file_id][yml_file], null, null, null, null, meta_confs[file_id][yml_file]);

    fs.writeFile(meta_path + '//' + yml_file, '---\n' + yml_out , function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
};

module.exports.readAllYML = function (path) {
    meta_path = path;
    walk(path, function(err, files){
        if (err) err;
        for (var file in files){
            try {
                var json_out = {};
                var file_content = fs.readFileSync(files[file], 'utf8');
                var file_url = files[file].substring(meta_path.length + 1);
                json_out[file_url] = yaml.safeLoad(file_content);
                yml_confs.push(json_out);
                var meta_out = {};
                meta_out[file_url] = myml.parse(file_content);
                meta_confs.push(meta_out);
            } catch (err) {
                console.log("WARNING : " + files[file] + ' has error :' + err);
            }
        }

        yml_conf_list = extractFileNames(yml_confs);
        meta_conf_list = extractFileNames(meta_confs);

        // Conf and meta list should always be identical. If not there is a problem am I not aware of.
        if (_.isEqual(yml_conf_list, meta_conf_list) == false) {
            console.log("Meta list: " + meta_conf_list);
            console.log("Conf list: " + yml_conf_list);
            console.log("Oops! Some nasty thing happened.");
            process.exit(code=0);
        }
    });
};

module.exports.getYMLConfList = function(){
    return yml_conf_list;
};

module.exports.getYMLConf = function(id){
    return yml_confs[id];
};
