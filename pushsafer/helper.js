'use strict';
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const base64 = require('node-base64-image');
const { promisify } = require('util');
const base64encoder = promisify(base64.encode);

const api_url = 'www.pushsafer.com';
const message_api_url = '/api';
const read_api_url = '/api-m';
const device_api_url = '/api-d';
const key_api_url = '/api-k';

module.exports = class PushsaferHelper {
    static checkConfigApi(node) {
        // Check if there is a valid api config object
        if (!node.configApi) {
            node.status({ fill: 'red', shape: 'dot', text: 'No valid api config object found' });
            node.error('No valid api config object found');
            return false;
        }

        // Check if there is a valid api key
        if (!node.configApi.apikey || node.configApi.apikey.length !== 20) {
            node.status({ fill: 'red', shape: 'dot', text: 'No valid api key found' });
            node.error('No valid api key found');
            return false;
        }

        // Check if there is a valid username
        if (!node.configApi.username) {
            node.status({ fill: 'red', shape: 'dot', text: 'No valid username found' });
            node.error('No valid username found');
            return false;
        }

        return true;
    }

    static checkAndParsePayload(msg, node) {
        // Check if there is a valid payload
        if (!msg.payload) {
            if (node) {
                node.status({ fill: 'red', shape: 'dot', text: 'message object has no payload' });
            }
            return false;
        }

        if (typeof msg.payload === 'object') {
            msg.payload = JSON.stringify(msg.payload);
        } else {
            msg.payload = String(msg.payload);
        }

        return true;
    }

    static checkAndParseResponse(response, node) {
        // Parse the result string into an object
        let parsedResponse = JSON.parse(response);

        if (node) {
            // Depending on the response status update the status of the node -> successful or failed
            switch (parsedResponse.status) {
                case 0:
                    node.status({ fill: 'red', shape: 'dot', text: 'failed' });
                    break;
                case 1:
                    node.status({ fill: 'green', shape: 'dot', text: 'successful' });
                    break;
            }
        }

        return parsedResponse;
    }

    static removeKeyFromMessage(msg) {
        delete msg.k;
    }

    static resetNodeStatus(node, timeout) {
        // Start a timeout to reset the status of the node
        setTimeout(function() {
            node.status({});
        }, timeout);
    }

    static async getAndParseImage(imagePath, node) {
        if (imagePath){
            if (imagePath.startsWith('data:')) {
                return imagePath;
            } else {
                const hasProtocol = imagePath.match(/^(\w+:\/\/)/igm);
                const extension = imagePath.slice((imagePath.lastIndexOf(".") - 1 >>> 0) + 2);
                const options = {string: true, local: !hasProtocol};
                try{
                    const base64image = await base64encoder(imagePath, options);
                    return 'data:image/' + extension + ';base64,' + base64image;
                }
                catch(error) {
                    node.warn('image could not be parsed to base64, may be file does not exist');
                    return null;
                }
            }
        };
        return null;
    }

    static sendRequest(msg, api_path, responseCB, errorCB) {
        let postData = querystring.stringify(msg);

        let resData = '';

        let options = {
            hostname: api_url,
            path: api_path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        let req = https.request(options, res => {
            res.on('data', d => {
                resData += d;
            });

            res.on('end', () => {
                if (responseCB && typeof responseCB === 'function') {
                    responseCB(resData);
                }
            });
        });

        req.on('error', e => {
            if (errorCB && typeof errorCB === 'function') {
                errorCB(e);
            }
        });

        req.write(postData);
        req.end();
    }

    static checkConfigApi(req, res){
        if (!req || !res) return;
        PushsaferHelper.sendRequest(
            req.query,
            key_api_url,
            function(response) {
                // Check and parse the response
                let parsedResponse = PushsaferHelper.checkAndParseResponse(response, null);
                // Return response
                res.json(parsedResponse);
            },
            function(e) {
                ;
            }
        );
    }

    static checkConfigDevices(req, res){
        if (!req || !res) return;
        PushsaferHelper.sendRequest(
            req.query,
            device_api_url,
            function(response) {
                // Check and parse the response
                let parsedResponse = PushsaferHelper.checkAndParseResponse(response, null);
                // Return response
                res.json(parsedResponse);
            },
            function(e) {
                ;
            }
        );
    }

    static sendNotification(req, res){
        if (!req || !res) return;
        
    }
};
