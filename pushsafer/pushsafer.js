module.exports = function(RED) {
    'use strict';
    const push = require('pushsafer-notifications');
    const base64 = require('node-base64-image');
    const { promisify }= require('util');
    const base64encoder = promisify(base64.encode);
    
    function PushSaferApiKey(config) {
        RED.nodes.createNode(this, config);
        this.apikey = config.apikey;
    }

    RED.nodes.registerType('pushsafer-api-key', PushSaferApiKey, {
        credentials: {
            apikey: {type: 'text'}
        }
    });

    function PushSaferNotificationTemplate(config) {
        RED.nodes.createNode(this, config);
        this.title = config.title;
        this.icon = config.icon;
        this.iconcolor = config.iconcolor;
        this.sound = config.sound; 
        this.vibration = config.vibration; 
        this.priority = config.priority;
        this.devices = config.devices; 
        this.timetolive = config.timetolive;
        this.retry = config.retry;
        this.expire = config.expire;
        this.answer = config.answer;
        this.url = config.url;
        this.urltitle = config.urltitle;
        this.image = config.image; 
        this.image2 = config.image2; 
        this.image3 = config.image3; 
    }

    RED.nodes.registerType('pushsafer-notification-template', PushSaferNotificationTemplate);

    function PushSaferNode(config) {
        RED.nodes.createNode(this, config);

        let node = this;

        node.apikey = RED.nodes.getCredentials(config.apikey);
        node.notificationtemplate = RED.nodes.getNode(config.notificationtemplate);
        
        // Check if there is a valid api key in the credentials
        if (node.apikey) {
            if (!node.apikey.apikey) {
                throw 'No pushsafer api key';
            }
        }
        else {
            throw 'No valid pushsafer api configuration';
        }

        // Create new instance of the pushsafer module
        let ps = new push({
            k: node.apikey.apikey,
            debug: false
        });

        function onInput(msg) {        

            // Check if there is a valid payload
            if (!msg.payload) {
                node.status({fill: 'red', shape: 'dot', text: 'payload has no value'});
                throw 'Pushsafer error: payload has no value';
            }
            else if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else {
                msg.payload = String(msg.payload);
            }           
        
            // Build notification object
            // If parameter is not provided directly in the msg object take the template parameter
            let notification = {
                t:  msg.title       || node.notificationtemplate.title,
                i:  msg.icon        || node.notificationtemplate.icon,
                c:  msg.iconcolor   || node.notificationtemplate.iconcolor,
                s:  msg.sound       || node.notificationtemplate.sound,
                v:  msg.vibration   || node.notificationtemplate.vibration,
                pr: msg.priority    || node.notificationtemplate.priority,
                d:  msg.devices     || node.notificationtemplate.devices,
                l:  msg.timetolive  || node.notificationtemplate.timetolive,
                re: msg.retry       || node.notificationtemplate.retry,
                ex: msg.expire      || node.notificationtemplate.expire,
                a:  msg.answer      || node.notificationtemplate.answer,
                u:  msg.url         || node.notificationtemplate.url,
                ut: msg.urltitle    || node.notificationtemplate.urltitle,
                m:  msg.payload,
                p:  msg.image       || node.notificationtemplate.image,
                p2: msg.image2      || node.notificationtemplate.image2,
                p3: msg.image3      || node.notificationtemplate.image3
            };           

            node.status({fill: 'yellow', shape: 'ring', text: 'try to get images'});

            Promise.all([getAndParseImage(notification.p), getAndParseImage(notification.p2), getAndParseImage(notification.p3)])
            .then(results => {
                notification.p = results[0];
                notification.p2 = results[1];
                notification.p3 = results[2];

                sendNotification();            
            });           

            async function getAndParseImage(imagePath) {                
                if (imagePath){
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
                };
                return null;
            }            

            function sendNotification() {
                // Remove all not used elements of the notification object
                for (let element in notification) {
                    if (!notification[element]) {
                        delete notification[element];
                    }
                }
                
                // Set status of the node -> try to send
                node.status({fill: 'yellow', shape: 'dot', text: 'try to send'});

                // Call the sent method of the pushsafer module
                ps.send(notification, function(error, result) {
                    // Check if there is an error in the response
                    if (error){
                        node.status({fill: 'red', shape: 'dot', text: 'send failed'});
                        node.error('pushsafer error: ' + error);
                        return;
                    }
                    // Parse the result string into an object
                    let parsedresult = JSON.parse(result);
                    // Depending on the result status update the status of the node -> successfully or failed
                    if (parsedresult.status === 1) {
                        node.status({fill: 'green', shape: 'dot', text: 'send successfully'});
                    }
                    else {
                        node.status({fill: 'red', shape: 'dot', text: 'send failed'});
                    }

                    // Start a timeout to reset the status or the node
                    setTimeout(function(){
                        node.status({});
                    }, 3000);
                    
                    // Return the notification object (output 1) and the result object (output 2) to the node outputs
                    node.send([{payload : notification}, {payload : parsedresult}]);
                });
            }
        
        }
    
        this.on('input', onInput);
        
    }
    RED.nodes.registerType('pushsafer', PushSaferNode);
};