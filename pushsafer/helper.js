'use strict';
const https = require('https');
const querystring = require('querystring');
const base64image = require('node-base64-image');

const ApiUrl = 'pushsafer.com';
const ApiEndpoints = {
  MessageApi: '/api',
  ReadApi: '/api-m',
  DeviceApi: '/api-d',
  KeyApi: '/api-k',
};

const checkConfigApi = (node) => {
  // Check if there is a valid api config object
  if (!node.configKeyApi) {
    setNodeStatus(node, 'red', 'dot', 'No valid api config object found', 5000);
    node.error('Pushsafer: No valid api config object found');
    return false;
  }

  // Check if there is a valid api key
  if (!node.configKeyApi.apikey || node.configKeyApi.apikey.length !== 20) {
    setNodeStatus(node, 'red', 'dot', 'No valid api key found', 5000);
    node.error('Pushsafer: No valid api key found');
    return false;
  }

  // Check if there is a valid username
  if (!node.configKeyApi.username) {
    setNodeStatus(node, 'red', 'dot', 'No valid username found', 5000);
    node.error('Pushsafer: No valid username found');
    return false;
  }

  return true;
};

const checkAndParseResponse = (node, response) => {
  // Parse the result string into an object
  const parsedResponse = JSON.parse(response);

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
};

const removeElementFromObject = (object, objectName) => {
  delete object[objectName];
};

const removeAllUnusedElements = (object) => {
  for (let element in object) {
    if (!object[element]) {
      removeElementFromObject(object, element);
    }
  }
};

const setNodeStatus = (node, fill, shape, text, timeout) => {
  node.status({ fill, shape, text });
  if (timeout && timeout > 0) {
    setTimeout(() => {
      clearNodeStatus(node);
    }, timeout);
  }
};

const clearNodeStatus = (node) => {
  node.status({});
};

const getAndParseImage = async (node, imagePath) => {
  if (!imagePath) return null;
  const hasProtocol = imagePath.match(/^(\w+:\/\/)/gim);
  const extension = imagePath.slice(((imagePath.lastIndexOf('.') - 1) >>> 0) + 2);
  const options = { string: true, local: !hasProtocol };
  const base64DataUri = await base64image.encode(imagePath, options).catch((error) => {
    node.warn('Pushsafer: Image could not be parsed to base64 data uri, may be file does not exist');
    resetNodeStatus(node, 5000);
    return null;
  });
  return `data:image/${extension};base64,${base64DataUri}`;
};

const sendRequest = (msg, api_path) => {
  const postData = querystring.stringify(msg);

  let resData = '';

  const options = {
    hostname: ApiUrl,
    path: api_path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    },
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

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  ApiEndpoints,
  checkConfigApi,
  checkAndParseResponse,
  removeElementFromObject,
  removeAllUnusedElements,
  setNodeStatus,
  clearNodeStatus,
  getAndParseImage,
  sendRequest,
};
