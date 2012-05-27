var fs = require('fs');

var groups = {};

var app = require('http').createServer(function(req, res) {
    fs.readFile('index.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        var group=req.url;
        if(!groups[group])groups[group] = io.of(group).on('connection', function(socket) {
            socket.on('message', function(data) {
                console.info(data);
                console.info("Name: " + data.name);
                console.info("Msg: " + data.msg);
                groups[group].emit("message", {
                    name: data.name,
                    msg: data.msg
                });
            });
        });
        res.writeHead(200, {
            'Content-Type': 'text/html',
            "Content-Length": data.length
        });
        res.end(data);
    });
});
app.listen(process.env.PORT || process.env.C9_PORT || 8001);

var io = require('socket.io').listen(app);
/*io.sockets.on('connection', function(socket) {
    console.info("Group::: " + io.of());
    socket.on('message', function(data) {
        console.info(data);
        socket.send("[ECHO] " + data);
    });
});*/