'use strict';

module.exports = function(RED) {
    function configTemplate(config) {
        RED.nodes.createNode(this, config);
        this.title = config.title;
        this.icon = config.icon;
        this.iconcolor = config.iconcolor;
        this.sound = config.sound;
        this.vibration = config.vibration;
        this.priority = config.priority;
        this.timetolive = config.timetolive;
        this.retry = config.retry;
        this.expire = config.expire;
        this.answer = config.answer;
        this.url = config.url;
        this.urltitle = config.urltitle;
        this.image = config.image;
        this.image2 = config.image2;
        this.image3 = config.image3;
        this.imagesize = config.imagesize;
    }

    RED.nodes.registerType('pushsafer-config-template', configTemplate);    
};
