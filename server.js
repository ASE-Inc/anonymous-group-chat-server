var fs = require('fs'),
    ioClient = require('socket.io-client'),
    groups = {},
    distributionServers = ["http://agcmd1.herokuapp.com", "http://agcmd2.herokuapp.com", "http://agcmd3.herokuapp.com"],
    distributionSockets = [],
    chatServers = ["http://agc.abhishekmunie.com", "http://agc1.abhishekmunie.com", "http://agc2.abhishekmunie.com", "http://agc3.abhishekmunie.com"];
var distributionLen = distributionServers.length;

function generateDistributionSockets(group) {
    var distributionSockets = [];
    for (var len = distributionLen; len;) {
        var ds = new ioClient.Socket(distributionServers[--len]);
        ds.connect();
        ds.on('createGroup', function(group) {
            createGroup(group);
        });
        distributionSockets[len] = ds;
    }
    return distributionSockets;
}
distributionSockets = generateDistributionSockets("");

function distributeMessage(sockets, data) {
    sockets[Math.floor(Math.random() * distributionLen)].emit("message", data);
}

function createGroup(group) {
    if ((group.length == 1) || groups[group]) return;
    groups[group] = {
        users: {},
        distributionSockets: generateDistributionSockets(group),
        socket: io.of(group).on('connection', function(socket) {
            var user = {
                name: undefined,
                socket: socket
            };
            socket.on('message', function(data) {
                groups[group].socket.emit("message", data);
                distributeMessage(groups[group].distributionSockets, data);
            });
            socket.on('disconnect', function() {});
            socket.on('setName', function(name) {
                socket.set('name', name, function() {
                    user.name = name;
                    groups[group].users[name] = user;
                    //socket.emit('ready');
                });
            });
            socket.on('msg', function() {
                socket.get('nickname', function(err, name) {
                    console.log('Chat message by ', name);
                });
            });
        })
    };
}

function generateGroups(group) {
    createGroup(group);
    distributionSockets[Math.floor(Math.random() * distributionLen)].emit('createGroup', {
        group: group
    });
}

var url = require('url'),
    path = require('path');
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css",
    "ico": "image/x-icon"
};

var app = require('http').createServer(function(req, res) {
    var group = req.url;
    var uri = url.parse(req.url).pathname;
    var filename = path.join(process.cwd(), uri);
    path.exists(filename, function(exists) {
        if (!exists) {
            generateGroups(group);
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            filename = path.join(process.cwd(), url.parse((group.length > 1) ? '/chat.html' : '/index.html').pathname);
        }
        if (fs.statSync(filename).isDirectory()) filename += '/index.html';
        var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
        res.writeHead(200, {
            'Content-Type': mimeType
        });
        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(res);
    });
});
app.listen(process.env.PORT || process.env.C9_PORT || 8001);
var io = require('socket.io').listen(app);
/*io.configure(function() {
    io.set('authorization', function(handshakeData, callback) {
        callback(null, true); // error first callback style 
    });
});*/
io.sockets.on('connection', function(socket) {
    socket.on('createGroup', function(group) {
        createGroup(group);
    });
});
createGroup("/");