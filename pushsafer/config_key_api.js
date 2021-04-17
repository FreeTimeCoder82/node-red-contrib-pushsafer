'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType(
    'pushsafer_config_key_api',
    function (config) {
      RED.nodes.createNode(this, config);
      const node = this;
      node.apikey = config.apikey;
      node.username = config.username;
    },
    {
      credentials: {
        apikey: { type: 'text' },
        username: { type: 'text' },
      },
    }
  );

  RED.httpAdmin.post('/pushsafer/configkeyapi', RED.auth.needsPermission('pushsafer_config_key_api.read'), async (req, res) => {
    res.json(
      await psHelper.sendRequest(req.body, psHelper.ApiEndpoints.KeyApi).catch((error) => {
        console.log('Pushsafer: REST request for CheckConfigApi failed: ' + error);
      })
    );
  });
};
