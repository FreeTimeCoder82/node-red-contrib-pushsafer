'use strict';
const ps_helper = require('./helper');

module.exports = function(RED) {
    function nodeRead(config) {
        RED.nodes.createNode(this, config);

        let node = this;
        
        node.configApi = RED.nodes.getCredentials(config.configApi);
        node.configDevices = RED.nodes.getNode(config.configDevices);
        
        let configApiOk = ps_helper.checkConfigApi(node);

        async function onInput(msg, send, done) {
            if (configApiOk === false) return;

            if (ps_helper.checkAndParsePayload(msg, node) === false) return;

            // Build message object
            // If parameter is not provided directly in the msg object take the template parameter
            let message = {
                k: node.configApi.apikey,
                d: msg.devices || node.configDevices.devices
            };

            // Set status of the node -> send request
            node.status({ fill: 'yellow', shape: 'dot', text: 'send request' });

            ps_helper.sendRequest(
                message,
                read_api_url,
                function(response) {
                    // Check and parse the result
                    let parsedResponse = ps_helper.checkAndParseResponse(response, node);

                    // Start a timeout to reset the status of the node
                    ps_helper.resetNodeStatus(node, 3000);

                    //let infoData = parsedresult.message_ids ? parsedresult.message_ids.split(':', 2) : undefined;

                    ps_helper.removeKeyFromMessage(message);

                    // Return the message object (output 1), the response object (output 2) and an array of all received pushsafer messages (output 3)
                    node.send([{ payload: message }, { payload: parsedResponse }, { payload: {  } }]);
                },
                function(e) {
                    node.status({ fill: 'red', shape: 'dot', text: 'failed' });
                    node.error('pushsafer error: ' + e);
                }
            );

            if (done) {
                done();
            }
        }

        this.on('input', onInput);

        this.on('close', function(removed, done) {
            if (removed) {
                // This node has been deleted
            } else {
                // This node is being restarted
            }
            if (done) {
                done();
            }
        });
    }
    RED.nodes.registerType('pushsafer_read', nodeRead);

    RED.httpAdmin.get('/pushsafer/checkForValidConfigApi', function(req, res) {
        let apiCred = RED.nodes.getCredentials(req.query.nodeid);
        if (apiCred){
            res.json(apiCred);
        }
        else{
            res.end();
        }
    });
};
