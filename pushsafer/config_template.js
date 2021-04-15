'use strict';

module.exports = function (RED) {
  RED.nodes.registerType('pushsafer-config-template', function (config) {
    RED.nodes.createNode(this, config);
    this.title = config.title;
    this.message = config.message;
    this.sound = config.sound;
    this.vibration = config.vibration;
    this.icon = config.icon;
    this.iconcolor = config.iconcolor;
    this.url = config.url;
    this.urltitle = config.urltitle;
    this.image = config.image;
    this.imageusepayload = config.imageusepayload;
    this.image2 = config.image2;
    this.image2usepayload = config.image2usepayload;
    this.image3 = config.image3;
    this.image3usepayload = config.image3usepayload;
    this.imagesize = config.imagesize;
    this.timetolive = config.timetolive;
    this.priority = config.priority;
    this.retry = config.retry;
    this.expire = config.expire;
    this.answer = config.answer;
    this.confirm = config.confirm;
    this.giphy = config.giphy;
  });
};
