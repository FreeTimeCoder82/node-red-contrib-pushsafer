'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType('pushsafer_send_api', function (config) {
    RED.nodes.createNode(this, config);

    const node = this;

    //Get credentials and config nodes
    node.configKeyApi = RED.nodes.getCredentials(config.configKeyApi);
    node.configDevicesApi = RED.nodes.getNode(config.configDevicesApi);
    node.configTemplate = RED.nodes.getNode(config.configTemplate);

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
        t: msg.title || node.configTemplate.title,
        m: node.configTemplate.message || msg.payload,
        s: msg.sound || node.configTemplate.sound,
        v: msg.vibration || node.configTemplate.vibration,
        i: msg.icon || node.configTemplate.icon,
        c: msg.iconcolor || node.configTemplate.iconcolor,
        u: msg.url || node.configTemplate.url,
        ut: msg.urltitle || node.configTemplate.urltitle,
        p: msg.image || node.configTemplate.image,
        p2: msg.image2 || node.configTemplate.image2,
        p3: msg.image3 || node.configTemplate.image3,
        is: msg.imagesize || node.configTemplate.imagesize,
        l: msg.timetolive || node.configTemplate.timetolive,
        pr: msg.priority || node.configTemplate.priority,
        re: msg.retry || node.configTemplate.retry,
        ex: msg.expire || node.configTemplate.expire,
        a: msg.answer || node.configTemplate.answer,
        cr: msg.confirm || node.configTemplate.confirm,
        g: msg.giphy || node.configTemplate.giphy,
      };

      // If one of the three image information are set, try to get and encode the image as base64
      if (request.p || request.p2 || request.p3) {
        psHelper.setNodeStatus(node, 'yellow', 'ring', 'get and encode images', 5000);
        [request.p, request.p2, request.p3] = await Promise.all([psHelper.getAndParseImage(node, request.p), psHelper.getAndParseImage(node, request.p2), psHelper.getAndParseImage(node, request.p3)]);
      }

      // Check if the payload should be used as an image
      if (node.configTemplate.imageusepayload) {
        request.p = msg.payload;
      }
      if (node.configTemplate.image2usepayload) {
        request.p2 = msg.payload;
      }
      if (node.configTemplate.image3usepayload) {
        request.p3 = msg.payload;
      }

      // Remove all not used elements of the notification object
      psHelper.removeAllUnusedElements(request);

      // Set status of the node -> send request
      psHelper.setNodeStatus(node, 'yellow', 'ring', 'send request', 5000);

      psHelper
        .sendRequest(request, psHelper.ApiEndpoints.MessageApi)
        .then((response) => {
          // Parse and check the result string
          const parsedResponse = psHelper.checkAndParseResponse(node, response);

          //Extract message and device id
          let payload = null;
          if (parsedResponse.message_ids) {
            const messageIdsSplitted = parsedResponse.message_ids.split(':', 2);
            payload = {
              message_id: messageIdsSplitted[0],
              device: messageIdsSplitted[1],
            };
          }

          // Return response object
          send({ payload, topic: msg.topic });
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
