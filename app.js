var http = require('http');
var fs = require('fs');
var path = require('path');

var port = process.env.PORT || 5000;

// Initialization class
var MyAPI = function(apiKey, secretKey) {
    this._apiKey = apiKey;
    this._secretKey = secretKey;
    this._authentificate = new Buffer(apiKey + ':' + secretKey).toString('base64');
};

// Load of the index.html file (client side)
var server = http.createServer(function (request, response) {
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';
        
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }
    
    path.exists(filePath, function(exists) {
    
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
    
});

// Socket.io's loading
var io = require('socket.io').listen(server);

// When a client logs in
io.sockets.on('connection', function (socket) {

    var myAPI = new MyAPI(process.env.API_KEY, process.env.SECRET_KEY);

    // URL params in HTTP GET
    function httpget(resources, arroptions) {
        var len = resources.length;

        for (var i = 0; i < len; i++) {
            var options = {
                host: 'api.mailjet.com',
                port: 80,
                path: '/v3/REST/' + resources[i],
                agent: false,
                // Make Basic auth
                headers: {
                  'Authorization': 'Basic ' + myAPI._authentificate
                }
            };
            arroptions.push(options);
        }

        for (var i = 0; i < len; i++) {
            var resourcename = resources[i];
            emitinfo(arroptions[i], resourcename, len);
        }

        // Make the requests every second
        setInterval(function() {
            for (var i = 0; i < len; i++) {
                var resourcename = resources[i];
                emitinfo(arroptions[i], resourcename, len);
            }
        }, 1000);
    }

    function emitinfo(arroption, resourcename, len) {
        // Begin timer
        var begintime = (new Date()).getTime();
        http.globalAgent.maxSockets = 100;
        http.get(arroption, function(res) {
            // Compute elapsed time
            var elapsedtime = (new Date().getTime() - begintime) / 1000;

            var reslen = responses.push({ name: resourcename, headers: JSON.stringify(res.headers),
                                        responsecode: res.statusCode, elapsedtime: elapsedtime });

            if (reslen == len)
            {
                socket.emit('inforesource', responses);
                responses = [];
            }
        }).on('error', function(e) {
            console.log("Got error: " + e.message + " " + resourcename);
        });
    }

    var resources = ['apikey', 'apikeyaccess', 'apikeytotals', 'apitoken', 'myprofile', 'user', 'sender', 'metasender',
                    'domainstatistics', 'parseroute', 'bouncestatistics', 'campaign', 'campaignaggregate', 'campaigngraphstatistics',
                    'campaignstatistics', 'campaignoverview', 'clickstatistics', 'trigger', 'preferences', 'aggregategraphstatistics', 'contact',
                    'contactslist', 'contactdata', 'contactfilter', 'contacthistorydata', 'contactmetadata', 'listrecipientstatistics',
                    'contactslistsignup', 'contactstatistics', 'geostatistics', 'graphstatistics', 'listrecipient', 'liststatistics',
                    'message', 'messageclientstatistics', 'messagehistory', 'messageinformation',
                    'messagesentstatistics', 'messagestate', 'messagestatistics', 'axtesting', 'newsletter', 'newsletterblock', 'newsletterproperties',
                    'newslettertemplate', 'newslettertemplateblock', 'newslettertemplatecategory', 'newslettertemplateproperties', 'batchjob',
                    'eventcallbackurl', 'openinformation', 'openstatistics', 'senderstatistics', 'toplinkclicked', 'useragentstatistics', 'widget',
                    'widgetcustomvalue'];

    var arroptions = [];
    var responses = [];

    httpget(resources, arroptions);
});

server.listen(port);
