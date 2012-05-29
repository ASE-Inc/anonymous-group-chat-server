var config = {
    facebookAppId: '119876094728323',
};
window.___gcfg = {
    lang: 'en-US',
    parsetags: 'explicit'
};
onerror = function(msg) {
    log(msg);
}

function log(msg) {
    console.log(new Date() + ' ' + msg + '\n');
    document.getElementById('log').appendChild(document.createTextNode(new Date() + ' ' + msg + '\n'));
}

function clearLog() {
    var e = document.getElementById('log');
    while (e.hasChildNodes()) {
        e.removeChild(e.firstChild);
    }
    e.appendChild(document.createTextNode('Log: \n'));
}
var socket = null,
    publicsocket = null;

function connect() {
    log('Connecting to AGC server...');
    if (socket == null) {
        socket = io.connect(document.location.href);
        socket.on('connect', function() {
            log('Connected');
            document.getElementById('statusbar').className = 'Connected';
            document.getElementById('status').textContent = 'Connected';
        });
        socket.on('message', function(data) {
            log(data.name + ": " + data.msg);
        });
    }
    socket.socket.connect();
}

function sendMessage(socket, msg) {
    socket.emit("message", {
        name: document.getElementById('nametext').value,
        msg: document.getElementById('msgtext').value
    });
}

function send() {
    if (socket && socket.socket.connected) {
        sendMessage(socket, {
            name: document.getElementById('nametext').value,
            msg: document.getElementById('msgtext').value
        });
        if (document.getElementById('publiccheck').value == "checked") {
            if (!publicsocket) publicsocket = io.connect(document.location.origin);
            sendMessage(publicsocket, {
                name: document.getElementById('nametext').value,
                msg: document.getElementById('msgtext').value
            });
        }
        document.getElementById('msgtext').value = "";
        //log('>' + document.getElementById('text').value);
    }
    else {
        log('Not connected.');
    }
    return false;
}

function update() {
    if (socket && socket.socket && socket.socket.transport) {
        document.getElementById('sessionId').textContent = socket.socket.transport.sessid;
        document.getElementById('transport').textContent = socket.socket.transport.name;
    }
    else {
        document.getElementById('sessionId').textContent = '-';
        document.getElementById('transport').textContent = '-';
    }
}
setInterval(update, 10);