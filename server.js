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
                distributeMessage(groups[group], data);
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

var app = require('http').createServer(function(req, res) {
    var group = req.url;
    generateGroups(group);
    fs.readFile((group.length > 1) ? 'chat.html' : 'index.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading page!');
        }
        res.writeHead(200, {
            'Content-Type': 'text/html',
            "Content-Length": data.length
        });
        res.end(data);
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