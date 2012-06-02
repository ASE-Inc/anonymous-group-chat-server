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
    }
    catch (a) {
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
    selectedChatServer = chatServers[Math.floor(Math.random() * chatLen)];

onerror = function(msg) {
    log(msg);
}

function RootConnection() {
    this.socket = io.connect(selectedChatServer);
    this.sessionID = null;
    this.transportName = null;
    this.status = "Idle";
    var THIS = this;
    this.socket.on('connect', function() {
        log('Connected ');
    });
    this.socket.on('message', function(data) {
        log(data.name + ": " + data.msg);
    });
    this.socket.socket.connect();
    this.reconnect = function() {
        THIS.socket.socket.connect();
    }
    this.update = function() {
        if (THIS.socket && THIS.socket.socket && THIS.socket.socket.transport) {
            THIS.sessionID = THIS.socket.socket.transport.sessid;
            THIS.transportName = THIS.socket.socket.transport.name;
        }
        else {
            THIS.sessionID = null;
            THIS.transportName = null;
            //THIS.reconnect();
        }
    }
}
log('Connecting to AGC server...');
var rootConnection = new RootConnection();
setInterval(rootConnection.update, 10);

function send() {
    if (rootConnection.socket && rootConnection.socket.socket.connected) {
        var message = document.getElementById('messagetext').value;
        for (var len = user.groups.length; len;)
        if (user.groups[--len].selected()) user.groups[len].send(message);
        return true;
    }
    return false;
}

function setName() {
    rootConnection.socket.emit($('#name_form #nametext').val(), function(response) {
        if (response) {
            log("Name set");
        }
        else {
            log("Name not set");
        }
    })
}

function User() {
    this.name;
    this.groups = {};
}

var user = new User();

function Group(group) {
    this.name = group;
    var THIS = this;
    rootConnection.socket.emit('generateGroup', group);
    this.socket = io.connect(selectedChatServer + '/' + group);
    this.socket.on('connect', function() {
        log('Connected ' + group);
        document.getElementById('statusbar').className = 'Connected';
        document.getElementById('status').textContent = 'Connected';
    });
    this.socket.on('message', function(data) {
        log(data.name + ": " + data.msg);
        THIS.messageBox.showMessage(data.name, data.msg);
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
    }
    this.selected = function() {
        return $('.group-selected', THIS.messageBox).attr('checked');
    }
    this.messageBox = new MessageBox(this);
    $('#message_box_container').append(this.messageBox);
}

function addGroup() {
    var group = $('#new_group_form #grouptext').val();
    user.groups[group] = new Group(group);
}

var MessageBox;
(function($) {
/*$.fn.MessageBox = function(o) {
        o = $.extend({}, o);
        return this.each(function() {
            var $this = $(this)
        });
    }*/

    MessageBox = function(group) {
        var mb = $('<div class="messageBox">');
        mb.tab = $('<div class="tab"><input class="group-selected" type="checkbox" size="80"/>' + group + '<span class="close">x</span></div>');
        mb.messageContainer = $('<div class="message-container"></div>');
        mb.append(mb.tab);
        mb.append(mb.messageContainer);
        mb.group = group;
        mb.showMessage = function(name, message) {
            $('.message-container', mb).append($('<div class="message">' + name + ': ' + new Date() + '\n' + message + '</div>'));
        }
        mb.clearMessages = function() {
            $('.message-container', mb).html("");
        }
        return mb;
    }

    $(document).ready(function() {
        $('#sendButton').on('click', function(e) {
            send();
        });
        $('#name_form').submit(function(e) {
            setName();
            return false;
        });
        $('#new_group_form').submit(function(e) {
            addGroup();
            return false;
        });
    });
})(jQuery);