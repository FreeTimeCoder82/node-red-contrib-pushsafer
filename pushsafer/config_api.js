'use strict';
const psHelper = require('./helper');

module.exports = function (RED) {
  RED.nodes.registerType(
    'pushsafer-config-api',
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

  RED.httpAdmin.post('/pushsafer/checkconfigapi', RED.auth.needsPermission('pushsafer-config-api.read'), async (req, res) => {
    res.json(
      await psHelper.sendRequest(req.body, psHelper.ApiEndpoints.KeyApi).catch((error) => {
        console.log('Pushsafer: REST request for CheckConfigApi failed: ' + error);
      })
    );
  });
};
