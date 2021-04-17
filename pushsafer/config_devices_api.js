'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType('pushsafer_config_devices_api', function (config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.configApi = RED.nodes.getCredentials(config.configApi);
    node.devices = config.devices;
  });

  RED.httpAdmin.post('/pushsafer/configdevicesapi', RED.auth.needsPermission('pushsafer_config_devices_api.read'), async (req, res) => {
    const configApiCredentials = RED.nodes.getCredentials(req.body.nodeid);

    if (!configApiCredentials) {
      res.json({});
      return;
    }

    const request = {
      k: configApiCredentials.apikey,
      u: configApiCredentials.username,
    };

    res.json(
      await psHelper.sendRequest(request, psHelper.ApiEndpoints.DeviceApi).catch((error) => {
        console.log('Pushsafer: REST request for GetDevices failed: ' + error);
      })
    );
  });
};
