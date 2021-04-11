'use strict';
const psHelper = require('./helper');

module.exports = function(RED) {
    function configApi(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.apikey = config.apikey;
        node.username = config.username;
    }

    RED.nodes.registerType('pushsafer-config-api', configApi, {
        credentials: {
            apikey: { type: 'text' },
            username: { type: 'text' }
        }
    });

    RED.httpAdmin.post('/pushsafer/checkconfigapi', RED.auth.needsPermission('pushsafer-config-api.read'), async (req, res) => {
        res.json(await psHelper.sendRequest(req.body, psHelper.api_urls.key_api).catch((e) => { console.log(e) }));
    });
};
