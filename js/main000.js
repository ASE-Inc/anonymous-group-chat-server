var config = {
    facebookAppId: '119876094728323',
};
window.___gcfg = {
    lang: 'en-US',
    parsetags: 'explicit'
};

// usage: log('inside coolFunc', this, arguments);
window.log = function f() {
    log.history = log.history || [];
    log.history.push(arguments);
    if (this.console) {
        var args = arguments,
            newarr;
        args.callee = args.callee.caller;
        newarr = [].slice.call(args);
        if (typeof console.log === 'object') log.apply.call(console.log, console, newarr);
        else console.log.apply(console, newarr);
    }
};
(function(a) {
    function b() {}
    for (var c = "assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","), d; !! (d = c.pop());) {
        a[d] = a[d] || b;
    }
})(function() {
    try {
        console.log();
        return window.console;
    } catch (a) {
        return (window.console = {});
    }
}());

function log(msg) {
    console.log(new Date() + ' ' + msg + '\n');
}

function qualifyURL(url) {
    var div = document.createElement('div');
    div.innerHTML = "<a></a>";
    div.firstChild.href = url; //Ensures that the href is properly escaped
    div.innerHTML = div.innerHTML; //Run the current innerHTML back through the parser
    return div.firstChild.href;
};

var chatServers = ["http://agc.abhishekmunie.com", "http://agc1.abhishekmunie.com", "http://agc2.abhishekmunie.com", "http://agc3.abhishekmunie.com"],
    chatLen = chatServers.length,
    //selectedChatServer = chatServers[Math.floor(Math.random() * chatLen)],
    selectedChatServer = document.location.origin,
    DOMReady = false;
onerror = function(msg) {
    log(msg);
}

function setStatus(status) {
    $('#statusbar').removeClass('connected').removeClass('connecting').removeClass('disconnected');
    $('#statusbar').addClass(status);
    rootConnection.status = status;
    document.getElementById('status').textContent = status;
}

function RootConnection() {
    this.socket = io.connect(selectedChatServer);
    this.sessionID = null;
    this.transportName = null;
    this.status = "Idle";
    var THIS = this;
    this.socket.on('connect', function() {
        log('Connected ');
        setStatus('connected');
        THIS.interval = setInterval(THIS.update, 100);
        if (DOMReady) initialize();
    });
    this.socket.on('message', function(data) {
        log(data.name + ": " + data.message);
    });
    this.socket.socket.connect();
    this.update = function() {
        if (THIS.socket && THIS.socket.socket && THIS.socket.socket.transport) {
            THIS.sessionID = THIS.socket.socket.transport.sessid;
            THIS.transportName = THIS.socket.socket.transport.name;
        } else {
            THIS.sessionID = null;
            THIS.transportName = null;
            setStatus('disconnected');
            //connect();
        }
        $('#sessionId').html(THIS.sessionID);
        $('#transport').html(THIS.transportName);
    }
}
var rootConnection;

function connect() {
    if (rootConnection) clearInterval(rootConnection.interval);
    rootConnection = new RootConnection();
    setStatus('connecting');
    log('Connecting to AGC server...');
}
connect();

function send() {
    if (rootConnection.socket && rootConnection.socket.socket.connected) {
        var message = document.getElementById('messagetext').value;
        for (var group in user.groups)
            if (group.selected()) group.send(message);
        return true;
    }
    return false;
}


function checkName(name) {
    if (!name.length) {
        $('#name_form .status-message').html("Enter a name");
        return;
    }
    rootConnection.socket.emit('setName', name, false, function(response) {
        if (response.available) {
            $('#name_form .status-message').html("Name:" + response.name + " available");
        } else {
            $('#name_form .status-message').html("Name:" + response.name + " not available");
        }
    });
}

function setName(name) {
    if (!name.length) {
        $('#name_form .status-message').html("Enter a name");
        return;
    }
    rootConnection.socket.emit('setName', name, true, function(response) {
        if (response.available) {
            log("Name: " + response.name + " set");
            $('#set_name').removeClass('enable');
            $('body').removeClass('disable');
            $('#username').html(response.name);
            user.groups["Open"] = new Group("Open");
            user.groups["Open"].selected(true);
        } else {
            log("Name:" + response.name + " not set");
            $('#name_form .status-message').html("Name:" + response.name + " not availabe");
        }
    });
}

function User() {
    this.name = undefined;
    this.groups = {};
}

var user = new User();

function Group(group) {
    this.name = group;
    var THIS = this;
    rootConnection.socket.emit('generateGroup', '/' + group);
    this.socket = io.connect(selectedChatServer + '/' + group);
    this.socket.on('connect', function() {
        log('Connected ' + group);
        document.getElementById('statusbar').className = 'connected';
        document.getElementById('status').textContent = 'Connected';
    });
    this.socket.on('message', function(data) {
        log(data.name + ": " + data.message);
        THIS.messageBox.showMessage(data.name, data.message);
    });
    this.socket.socket.connect();
    this.send = function(message) {
        if (THIS.socket && THIS.socket.socket.connected) {
            THIS.socket.emit("message", {
                name: user.name,
                message: message
            });
            return true;
        }
        return false;
    };
    this.selected = function(val) {
        if (val != undefined) $('.group-selected', THIS.messageBox).attr('checked', val);
        else return $('.group-selected', THIS.messageBox).attr('checked');
    };
    this.messageBox = new MessageBox(this);
    $('#message_box_container').append(this.messageBox);
}

function addGroup() {
    var group = $('#new_group_form #grouptext').val();
    user.groups[group] = new Group(group);
}

function initialize() {
    $('#set_name').addClass('enable');
    $('body').addClass('disable');
}

var MessageBox;
MessageBox = function(group) {
    var mb = $('<div class="messageBox">');
    mb.tab = $('<div class="tab"><input class="group-selected" type="checkbox" size="80"/>' + group.name + '<span class="close">x</span></div>');
    mb.messageContainer = $('<div class="message-container"></div>');
    mb.append(mb.tab);
    mb.append(mb.messageContainer);
    mb.group = group;
    mb.showMessage = function(name, message) {
        $('.message-container', mb).append($('<div class="message">' + name + ': ' + new Date() + '\n' + message + '</div>'));
    };
    mb.clearMessages = function() {
        $('.message-container', mb).html("");
    };
    return mb;
};

$(document).ready(function() {
    DOMReady = true;
    $('#sendButton').on('click', function(e) {
        send();
    });
    $('#message_form').submit(function(e) {
        send();
        return false;
    });
    $('#name_form').submit(function(e) {
        setName($('#name_form #nametext').val());
        return false;
    });
    $('#new_group_form').submit(function(e) {
        addGroup();
        return false;
    });
    $('#name_form #nametext').keypress(function(e) {
        //checkName($('#name_form #nametext').val());
    });
    if (rootConnection.status == 'connected') initialize();
});