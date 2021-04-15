'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType('pushsafer_message', function (config) {
    RED.nodes.createNode(this, config);

    const node = this;

    //Get credentials and config nodes
    node.configApi = RED.nodes.getCredentials(config.configApi);
    node.configDevices = RED.nodes.getNode(config.configDevices);
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

      //if (psHelper.checkAndParseMessagePayload(msg, node) === false) return;

      // Build notification object
      // If parameter is not provided directly in the msg object, template parameter will be used
      const notification = {
        k: node.configApi.apikey,
        d: msg.devices || node.configDevices.devices,
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
      if (notification.p || notification.p2 || notification.p3) {
        psHelper.setNodeStatus(node, 'yellow', 'ring', 'try to get and encode images', 5000);
        [notification.p, notification.p2, notification.p3] = await Promise.all([psHelper.getAndParseImage(notification.p, node), psHelper.getAndParseImage(notification.p2, node), psHelper.getAndParseImage(notification.p3, node)]);
      }

      if (node.configTemplate.imageusepayload) {
        notification.p = msg.payload;
      }
      if (node.configTemplate.image2usepayload) {
        notification.p2 = msg.payload;
      }
      if (node.configTemplate.image3usepayload) {
        notification.p3 = msg.payload;
      }

      // Remove all not used elements of the notification object
      psHelper.removeAllUnusedElements(notification);

      // Set status of the node -> try to send
      psHelper.setNodeStatus(node, 'yellow', 'dot', 'send request', 5000);

      psHelper
        .sendRequest(notification, psHelper.ApiEndpoints.message_api)
        .then((response) => {
          // Parse and check the result string
          let parsedResponse = psHelper.checkAndParseResponse(node, response);

          let infoData = parsedResponse.message_ids ? parsedResponse.message_ids.split(':', 2) : undefined;

          // Return the notification response object
          send({ payload: { message_id: infoData[0], device: infoData[1] }, topic: 'fromPushsaferMessageNode' });
        })
        .catch((error) => {
          psHelper.setNodeStatus(node, 'red', 'dot', 'send failed', 5000);
          node.error('pushsafer error: ' + error);
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
