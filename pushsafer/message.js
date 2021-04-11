'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  function nodeMessage(config) {
    RED.nodes.createNode(this, config);

    const node = this;

    node.configApi = RED.nodes.getCredentials(config.configApi);
    node.configDevices = RED.nodes.getNode(config.configDevices);
    node.configTemplate = RED.nodes.getNode(config.configTemplate);

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

      if (psHelper.checkAndParseMessagePayload(msg, node) === false) return;

      // Build notification object
      // If parameter is not provided directly in the msg object take the template parameter
      const notification = {
        k: node.configApi.apikey,
        d: msg.devices || node.configDevices.devices,
        t: msg.title || node.configTemplate.title,
        m: msg.payload,
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
        node.status({ fill: 'yellow', shape: 'ring', text: 'try to get and encode images' });
        [notification.p, notification.p2, notification.p3] = await Promise.all([psHelper.getAndParseImage(notification.p, node), psHelper.getAndParseImage(notification.p2, node), psHelper.getAndParseImage(notification.p3, node)]);
      }

      // Remove all not used elements of the notification object
      for (let element in notification) {
        if (!notification[element]) {
          psHelper.removeElementFromObject(notification, element);
        }
      }

      // Set status of the node -> try to send
      node.status({ fill: 'yellow', shape: 'dot', text: 'try to send' });

      psHelper
        .sendRequest(notification, psHelper.api_urls.message_api)
        .then((response) => {
          // Parse and check the result string
          let parsedResponse = psHelper.checkAndParseResponse(response, node);

          let infoData = parsedResponse.message_ids ? parsedResponse.message_ids.split(':', 2) : undefined;

          // Return the notification response object
          send({ payload: { message_id: infoData[0], device: infoData[1] }, topic: 'fromPushsaferMessageNode' });
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
  RED.nodes.registerType('pushsafer_message', nodeMessage);
};
