'use strict';
const psHelper = require('./helper');

module.exports = function(RED) {
    function configApi(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        node.apikey = config.apikey;
        node.username = config.username;
    }

    RED.nodes.registerType('pushsafer-config-api', configApi, {
        credentials: {
            apikey: { type: 'text' },
            username: { type: 'text' }
        }
    });

    RED.httpAdmin.get('/pushsafer/checkConfigApi', function(req, res) {
        psHelper.checkConfigApi(req, res);
    });
};
