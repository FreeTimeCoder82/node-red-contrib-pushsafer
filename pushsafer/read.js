'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  function nodeRead(config) {
    RED.nodes.createNode(this, config);

    const node = this;

    node.configApi = RED.nodes.getCredentials(config.configApi);
    node.configDevices = RED.nodes.getNode(config.configDevices);

    let configApiOk = psHelper.checkConfigApi(node);

    async function onInput(msg, send, done) {
      // For maximum backwards compatibility, check that send exists.
      // If this node is installed in Node-RED 0.x, it will need to
      // fallback to using `node.send`
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };

      if (!configApiOk) return;

      if (psHelper.checkAndParseIncomingReadPayload(msg, node) === false) return;

      // Build message object
      // If parameter is not provided directly in the msg object take the template parameter
      const message = {
        k: node.configApi.apikey,
        d: msg.payload.device || node.configDevices.devices,
      };

      // Set status of the node -> send request
      node.status({ fill: 'yellow', shape: 'dot', text: 'send request' });

      psHelper
        .sendRequest(message, psHelper.api_urls.read_api)
        .then((response) => {
          // Parse and check the result string
          let parsedResponse = psHelper.checkAndParseResponse(response, node);

          psHelper.removeElementFromObject(parsedResponse, 'status');
          // Return the response
          send({ payload: { ...{ device: message.d }, ...parsedResponse }, topic: 'fromPushsaferReadNode' });
        })
        .catch((error) => {
          node.status({ fill: 'red', shape: 'dot', text: 'send failed' });
          psHelper.resetNodeStatus(node, 5000);
          node.error('pushsafer error: ' + error);
        })
        .finally(() => {
          if (done) {
            done();
          }
        });
    }

    this.on('input', onInput);

    this.on('close', (removed, done) => {
      if (removed) {
        // This node has been removed, do something
      } else {
        // This node is being restarted, do something
      }

      if (done) {
        done();
      }
    });
  }
  RED.nodes.registerType('pushsafer_read', nodeRead);
};
