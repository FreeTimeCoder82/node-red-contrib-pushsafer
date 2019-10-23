'use strict';
const ps_helper = require('./helper');

module.exports = function(RED) {
    function nodeMessage(config) {
        RED.nodes.createNode(this, config);

        let node = this;
        
        node.configApi = RED.nodes.getCredentials(config.configApi);
        node.configDevices = RED.nodes.getNode(config.configDevices);
        node.configTemplate = RED.nodes.getNode(config.configTemplate);

        let configApiOk = ps_helper.checkConfigApi(node);;

        async function onInput(msg, send, done) {
            if (!configApiOk) return;

            ps_helper.checkAndParsePayload(msg, node);

            // Build notification object
            // If parameter is not provided directly in the msg object take the template parameter
            let notification = {
                k: node.apikey.apikey,
                t: msg.title || node.configTemplate.title,
                i: msg.icon || node.configTemplate.icon,
                c: msg.iconcolor || node.configTemplate.iconcolor,
                s: msg.sound || node.configTemplate.sound,
                v: msg.vibration || node.configTemplate.vibration,
                pr: msg.priority || node.configTemplate.priority,
                d: msg.devices || node.configTemplate.devices,
                l: msg.timetolive || node.configTemplate.timetolive,
                re: msg.retry || node.configTemplate.retry,
                ex: msg.expire || node.configTemplate.expire,
                a: msg.answer || node.configTemplate.answer,
                u: msg.url || node.configTemplate.url,
                ut: msg.urltitle || node.configTemplate.urltitle,
                m: msg.payload,
                p: msg.image || node.configTemplate.image,
                p2: msg.image2 || node.configTemplate.image2,
                p3: msg.image3 || node.configTemplate.image3,
                is: msg.imagesize || node.configTemplate.imagesize
            };

            // If one of the three image informationa are set, try to get and encode the image as base64
            if (notification.p || notification.p2 || notification.p3) {
                node.status({ fill: 'yellow', shape: 'ring', text: 'try to get and encode images' });
                [notification.p, notification.p2, notification.p3] = await Promise.all([ps_helper.getAndParseImage(notification.p, node), ps_helper.getAndParseImage(notification.p2, node), ps_helper.getAndParseImage(notification.p3, node)]);
            }

            // Remove all not used elements of the notification object
            for (let element in notification) {
                if (!notification[element]) {
                    delete notification[element];
                }
            }

            // Set status of the node -> try to send
            node.status({ fill: 'yellow', shape: 'dot', text: 'try to send' });

            ps_helper.sendRequest(
                notification,
                message_api_url,
                function(d) {
                    // Parse the result string into an object
                    let parsedresult = JSON.parse(d);
                    // Depending on the result status update the status of the node -> successfully or failed
                    if (parsedresult.status === 1) {
                        node.status({ fill: 'green', shape: 'dot', text: 'send successfully' });
                    } else {
                        node.status({ fill: 'red', shape: 'dot', text: 'send failed' });
                    }

                    // Start a timeout to reset the status of the node
                    setTimeout(function() {
                        node.status({});
                    }, 3000);

                    let infoData = parsedresult.message_ids ? parsedresult.message_ids.split(':', 2) : undefined;

                    // Return the notification object (output 1) and the result object (output 2) to the node outputs
                    node.send([{ payload: notification }, { payload: parsedresult }, { payload: { message_id: infoData[0], device_id: infoData[1] } }]);
                },
                function(e) {
                    node.status({ fill: 'red', shape: 'dot', text: 'send failed' });
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
    RED.nodes.registerType('pushsafer_message', nodeMessage);
};
