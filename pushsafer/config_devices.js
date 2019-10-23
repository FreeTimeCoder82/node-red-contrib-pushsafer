'use strict';
const pushsafer_helper = require('./helper');

module.exports = function(RED) {
    function configDevices(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        node.devices = config.devices;
    }

    RED.nodes.registerType('pushsafer-config-devices', configDevices);

    RED.httpAdmin.get('/pushsafer/getdevices', function(req, res) {
        
        let configApiCredentials = RED.nodes.getCredentials(req.query.nodeid);
        
        if (!configApiCredentials){
            res.json({});
            return;
        }

        let message = {
            k: configApiCredentials.apiKey,
            u: configApiCredentials.username
        };
return;
        pushsafer_helper.sendRequest(
            message,
            device_api_url,
            function(response) {
                // Check and parse the result
                let parsedResponse = pushsafer_helper.checkAndParseResponse(response, null);
                console.log(parsedResponse);
                res.json(parsedResponse);

                // Start a timeout to reset the status of the node
                //pushsafer_helper.resetNodeStatus(node, 3000);

                //let infoData = parsedresult.message_ids ? parsedresult.message_ids.split(':', 2) : undefined;

                //pushsafer_helper.removeKeyFromMessage(message);

                // Return the message object (output 1), the response object (output 2) and an array of all received pushsafer messages (output 3)
                //node.send([{ payload: message }, { payload: parsedResponse }, { payload: {  } }]);
            },
            function(e) {
                //node.status({ fill: 'red', shape: 'dot', text: 'failed' });
                //node.error('pushsafer error: ' + e);
            }
        );
    });
};
