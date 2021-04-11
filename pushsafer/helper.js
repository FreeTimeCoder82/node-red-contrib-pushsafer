'use strict';
const https = require('https');
const querystring = require('querystring');
const base64 = require('node-base64-image');
const { promisify } = require('util');
const base64encoder = promisify(base64.encode);

const api_url = 'pushsafer.com';
const api_urls = {
    message_api: '/api',
    read_api: '/api-m',
    device_api: '/api-d',
    key_api: '/api-k'
}

const checkConfigApi = (node) => {
    // Check if there is a valid api config object
    if (!node.configApi) {
        node.status({ fill: 'red', shape: 'dot', text: 'No valid api config object found' });
        resetNodeStatus(node, 5000);
        node.error('No valid api config object found');
        return false;
    }

    // Check if there is a valid api key
    if (!node.configApi.apikey || node.configApi.apikey.length !== 20) {
        node.status({ fill: 'red', shape: 'dot', text: 'No valid api key found' });
        resetNodeStatus(node, 5000);
        node.error('No valid api key found');
        return false;
    }

    // Check if there is a valid username
    if (!node.configApi.username) {
        node.status({ fill: 'red', shape: 'dot', text: 'No valid username found' });
        resetNodeStatus(node, 5000);
        node.error('No valid username found');
        return false;
    }

    return true;
}

const checkAndParseMessagePayload = (msg, node) => {
    // Check if there is a valid payload
    if (!msg.payload) {
        if (node) {
            node.status({ fill: 'red', shape: 'dot', text: 'Message object has no payload' });
            resetNodeStatus(node, 5000);
            node.error('Message object has no payload');
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

const checkAndParseIncomingReadPayload = (msg, node) => {
    // Check if there is a valid payload
    if (msg.topic && msg.topic === 'fromPushsaferMessageNode') {
        
    }

    return true;
}

const checkAndParseResponse = (response, node) => {
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
        // Start a timeout to reset the status of the node
        resetNodeStatus(node, 5000);
    }

    return parsedResponse;
}

const removeElementFromObject = (object, objectName) => {
    delete object[objectName];
}

const setNodeStatus = (node, timeout) => {
    // Start a timeout to reset the status of the node
    setTimeout(function() {
        node.status({});
    }, timeout);
}

const resetNodeStatus = (node, timeout) => {
    // Start a timeout to reset the status of the node
    setTimeout(function() {
        node.status({});
    }, timeout);
}

const getAndParseImage = async (imagePath, node) => {
    if (!imagePath) return null;

    const hasProtocol = imagePath.match(/^(\w+:\/\/)/gim);
    const extension = imagePath.slice(((imagePath.lastIndexOf('.') - 1) >>> 0) + 2);
    const options = { string: true, local: !hasProtocol };
    const base64image = await base64encoder(imagePath, options).catch((error) => {
        node.warn('image could not be parsed to base64, may be file does not exist');
        resetNodeStatus(node, 5000);
        return null;
    });
    return `data:image/${extension};base64,${base64image}`; 
}

const sendRequest = (msg, api_path) => {
    let postData = querystring.stringify(msg);

    let resData = '';

    const options = {
        hostname: api_url,
        path: api_path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.on('data', (dataChunk) => {
                resData += dataChunk;
            });
    
            res.on('end', () => {
                resolve(resData);
            });
        });
    
        req.on('error', (e) => {
            reject(e);
        });
    
        req.write(postData);
        req.end();
    });
}

module.exports = {
    api_urls,
    checkConfigApi,
    checkAndParseMessagePayload,
    checkAndParseIncomingReadPayload,
    checkAndParseResponse,
    removeElementFromObject,
    resetNodeStatus,
    getAndParseImage,
    sendRequest
}