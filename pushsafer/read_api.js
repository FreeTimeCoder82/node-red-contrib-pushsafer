'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType('pushsafer_read_api', function (config) {
    RED.nodes.createNode(this, config);

    const node = this;

    //Get credentials and config nodes
    node.configKeyApi = RED.nodes.getCredentials(config.configKeyApi);
    node.configDevicesApi = RED.nodes.getNode(config.configDevicesApi);

    const configApiOk = psHelper.checkConfigApi(node);

    node.on('input', async function (msg, send, done) {
      // For maximum backwards compatibility, check that send exists.
      // If this node is installed in Node-RED 0.x, it will need to
      // fallback to using `node.send`
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };

      if (!configApiOk) return;

      // Build request object
      // If parameter is not provided directly in the msg object, node parameter will be used
      const request = {
        k: node.configKeyApi.apikey,
        d: msg.devices || node.configDevicesApi.devices,
      };

      // Set status of the node -> send request
      psHelper.setNodeStatus(node, 'yellow', 'ring', 'send request', 5000);

      psHelper
        .sendRequest(request, psHelper.ApiEndpoints.ReadApi)
        .then((response) => {
          // Parse and check the result string
          const parsedResponse = psHelper.checkAndParseResponse(node, response);

          psHelper.removeElementFromObject(parsedResponse, 'status');

          // Return response object
          send({ payload: parsedResponse, topic: msg.topic, devices: request.d });
        })
        .catch((error) => {
          psHelper.setNodeStatus(node, 'red', 'dot', 'send failed', 5000);
          node.error('Pushsafer: Send request error: ' + error);
        })
        .finally(() => {
          if (done) {
            done();
          }
        });
    });

    node.on('close', (removed, done) => {
      if (removed) {
        // This node has been removed, do something
      } else {
        // This node is being restarted, do something
      }

      if (done) {
        done();
      }
    });
  });
};
