'use strict';
const https = require('https');
const querystring = require('querystring');
const base64 = require('node-base64-image');

const ApiUrl = 'pushsafer.com';
const ApiEndpoints = {
    message_api: '/api',
    read_api: '/api-m',
    device_api: '/api-d',
    key_api: '/api-k'
}

const StatusShape = {
    Dot: 'dot',
    Ring: 'ring'
}

const StatusFill = {
    Red: 'red',
    Green: 'green',
    Yellow: 'yellow',
    Blue: 'blue',
    Grey: 'grey'
}

const StatusType = {
    Debug: 'grey',
    Info: 'blue',
    Warn: 'yellow',
    Error: 'red',
    Ok: 'green'
}

const checkConfigApi = (node) => {
    // Check if there is a valid api config object
    if (!node.configApi) {
        setNodeStatus(node, 'red', 'dot', 'No valid api config object found', 5000);
        node.error('No valid api config object found');
        return false;
    }

    // Check if there is a valid api key
    if (!node.configApi.apikey || node.configApi.apikey.length !== 20) {
        setNodeStatus(node, 'red', 'dot', 'No valid api key found', 5000);
        node.error('No valid api key found');
        return false;
    }

    // Check if there is a valid username
    if (!node.configApi.username) {
        setNodeStatus(node, 'red', 'dot', 'No valid username found', 5000);
        node.error('No valid username found');
        return false;
    }

    return true;
}

const checkAndParseMessagePayload = (msg, node) => {
    // Check if there is a valid payload
    if (!msg.payload) {
        if (node) {
            setNodeStatus(node, 'red', 'dot', 'Message object has no payload', 5000);
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

const checkAndParseResponse = (node, response) => {
    // Parse the result string into an object
    let parsedResponse = JSON.parse(response);

    if (node) {
        // Depending on the response status update the status of the node -> successful or failed
        switch (parsedResponse.status) {
            case 0:
                setNodeStatus(node, 'red', 'dot', 'failed', 5000);
                break;
            case 1:
                setNodeStatus(node, 'green', 'dot', 'successful', 5000);
                break;
        }
    }

    return parsedResponse;
}

const removeElementFromObject = (object, objectName) => {
    delete object[objectName];
}

const removeAllUnusedElements = (object) => {
    for (let element in object) {
        if (!object[element]) {
          removeElementFromObject(object, element);
        }
      }
}

const setNodeStatus = (node, fill, shape, text, timeout) => {
    node.status({ fill, shape, text });
    if(timeout && timeout > 0){
        setTimeout(()=>{
            clearNodeStatus(node);
        }, timeout);
    }
}

const clearNodeStatus = (node) => {
    node.status({});
}

const getAndParseImage = async (imagePath, node) => {
    if (!imagePath) return null;
    const hasProtocol = imagePath.match(/^(\w+:\/\/)/gim);
    const extension = imagePath.slice(((imagePath.lastIndexOf('.') - 1) >>> 0) + 2);
    const options = { string: true, local: !hasProtocol };
    const base64DataUri = await base64.encode(imagePath, {}).catch((error) => {
        node.warn('image could not be parsed to base64, may be file does not exist');
        resetNodeStatus(node, 5000);
        return null;
    });
    return `data:image/${extension};base64,${base64DataUri}`; 
}

const sendRequest = (msg, api_path) => {
    let postData = querystring.stringify(msg);

    let resData = '';

    const options = {
        hostname: ApiUrl,
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
    ApiEndpoints,
    checkConfigApi,
    checkAndParseMessagePayload,
    checkAndParseIncomingReadPayload,
    checkAndParseResponse,
    removeElementFromObject,
    removeAllUnusedElements,
    setNodeStatus,
    clearNodeStatus,
    getAndParseImage,
    sendRequest
}