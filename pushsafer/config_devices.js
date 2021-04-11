'use strict';
const psHelper = require('./helper');

module.exports = function(RED) {
    function configDevices(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.configApi = RED.nodes.getCredentials(config.configApi);
        node.devices = config.devices;
    }

    RED.nodes.registerType('pushsafer-config-devices', configDevices);

    RED.httpAdmin.post('/pushsafer/getdevices', RED.auth.needsPermission('pushsafer-config-devices.read'), async (req, res) => {
        
        const configApiCredentials = RED.nodes.getCredentials(req.body.nodeid);
        
        if (!configApiCredentials){
            res.json({});
            return;
        }

        const message = {
            k: configApiCredentials.apikey,
            u: configApiCredentials.username
        };

        res.json(await psHelper.sendRequest(message, psHelper.api_urls.device_api).catch((e) => { console.log(e) }));
    });
};
