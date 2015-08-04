// config/database.js
module.exports = function(){
    var config = {};
    config.es_host = process.env.ES_URL || '127.0.0.1';
    config.es_port = process.env.ES_PORT || '9200';
    config.secure  = process.env.ES_SECURE || false;
    config.es_username = process.env.ES_USERNAME || null;
    config.es_password = process.env.ES_PASSWORD || null;
    config.others = process.env.ES_OTHER || null;
    return config;
}();
