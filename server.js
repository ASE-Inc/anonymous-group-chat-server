var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    ioClient = require('socket.io-client'),
    //chatServers = ["http://agc.abhishekmunie.com", "http://agc1.abhishekmunie.com",
    //"http://agc2.abhishekmunie.com", "http://agc3.abhishekmunie.com"],
    distributionServers = ["http://agcmd1.herokuapp.com", "http://agcmd2.herokuapp.com", "http://agcmd3.herokuapp.com"];
var distributionLen = distributionServers.length,
    distributionSockets = [],
    groups = {},
    users = {};

function generateDistributionSockets(group) {
    var distributionSockets = [];
    for (var len = distributionLen; len;) {
        var ds = new ioClient.Socket(distributionServers[--len]);
        ds.connect();
        ds.on('createGroup', function(group) {
            createGroup(group);
        });
        ds.on('message', function(data) {
            groups[group].socket.emit("message", data);
        });
        distributionSockets[len] = ds;
    }
    return distributionSockets;
}
distributionSockets = generateDistributionSockets("");

function distributeMessage(sockets, data) {
    sockets[Math.floor(Math.random() * distributionLen)].emit("message", data);
}

function addGroupToUser(name, group, socket) {
    users[name].sockets[group] = socket;
    socket.on('message', function(data) {
        var messageData = {
            name: name,
            data: data
        };
        socket.namespace.emit("message", messageData);
        distributeMessage(groups[group].distributionSockets, messageData);
    });
}

function createGroup(group) {
    if ((group.length == 1) || groups[group]) return;
    groups[group] = {
        distributionSockets: generateDistributionSockets(group),
        socket: io.of(group).on('connection', function(socket) {
            socket.get('name', function(err, name) {
                addGroupToUser(name, group, socket);
            });
        })
    };
}

function generateGroup(group) {
    createGroup(group);
    distributionSockets[Math.floor(Math.random() * distributionLen)].emit('createGroup', {
        group: group
    });
}
var app = require('h5bp').server(require('express'), {
    root: __dirname + "/",
    maxAge: 1000 * 60 * 60
});
app.get('*', function(req, res) {
    res.writeHead(404, {
        "Content-Type": "text/html"
    });
    fs.createReadStream(path.join(process.cwd(), url.parse('/404.html').pathname)).pipe(res);
});
var io = require('socket.io').listen(app);
app.listen(process.env.C9_PORT || process.env.PORT || process.env.VCAP_APP_PORT || process.env.VMC_APP_PORT || 1337 || 8001);
io.configure(function() {
/* //Production Settings
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('log level', 1);
    io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'flashsocket']);*/
    io.set("polling duration", 10);
    io.set('authorization', function(handshakeData, callback) {
        callback(null, true); // error first callback style 
    });
});
io.sockets.on('connection', function(socket) {
    var user = {
        name: undefined,
        sockets: {
            root: socket
        }
    };
    socket.on('setName', function(name, response) {
        if (user[name]) response(false);
        else {
            socket.set('name', name, function() {});
            user.name = name;
            users[name] = user;
            response(true);
        }
    });
    socket.on('createGroup', function(group) {
        createGroup(group);
    });
    socket.on('generateGroup', function(group) {
        generateGroup(group);
    });
    socket.on('disconnect', function() {});
    socket.namespace.emit("message", {
        name: "server",
        message: "connected new member"
    });
});
generateGroup("/");