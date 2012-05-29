var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    ioClient = require('socket.io-client'),
    //chatServers = ["http://agc.abhishekmunie.com", "http://agc1.abhishekmunie.com", "http://agc2.abhishekmunie.com", "http://agc3.abhishekmunie.com"],
    distributionServers = ["http://agcmd1.herokuapp.com", "http://agcmd2.herokuapp.com", "http://agcmd3.herokuapp.com"];
var distributionLen = distributionServers.length,
    distributionSockets = [],
    groups = {};

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
                socket.namespace.emit("message", data);
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

function generateGroup(group) {
    createGroup(group);
    distributionSockets[Math.floor(Math.random() * distributionLen)].emit('createGroup', {
        group: group
    });
}

var app = require('http').createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join(process.cwd(), uri);
    path.exists(filename, function(exists) {
        if (!exists) {
            filename = path.join(process.cwd(), url.parse('/index.html').pathname);
        }
        else if (fs.statSync(filename).isDirectory()) filename += '/index.html';
        res.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filename).split(".")[1]]
        });
        var ua = req.headers['user-agent'];
        if (ua && ua.indexOf('MSIE') > -1 && /html?($|\?|#)/.test(req.url)) {
            res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
        }
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
    socket.on('generateGroup', function(group) {
        generateGroup(group);
    });
    socket.namespace.emit("message", {
        name: "server",
        msg: "connected new member"
    });
});
createGroup("/");
var mimeTypes = {
    ".3gp": "video/3gpp",
    ".a": "application/octet-stream",
    ".ai": "application/postscript",
    ".aif": "audio/x-aiff",
    ".aiff": "audio/x-aiff",
    ".asc": "application/pgp-signature",
    ".asf": "video/x-ms-asf",
    ".asm": "text/x-asm",
    ".asx": "video/x-ms-asf",
    ".atom": "application/atom+xml",
    ".au": "audio/basic",
    ".avi": "video/x-msvideo",
    ".bat": "application/x-msdownload",
    ".bin": "application/octet-stream",
    ".bmp": "image/bmp",
    ".bz2": "application/x-bzip2",
    ".c": "text/x-c",
    ".cab": "application/vnd.ms-cab-compressed",
    ".cc": "text/x-c",
    ".chm": "application/vnd.ms-htmlhelp",
    ".class": "application/octet-stream",
    ".com": "application/x-msdownload",
    ".conf": "text/plain",
    ".cpp": "text/x-c",
    ".crt": "application/x-x509-ca-cert",
    ".css": "text/css",
    ".csv": "text/csv",
    ".cxx": "text/x-c",
    ".deb": "application/x-debian-package",
    ".der": "application/x-x509-ca-cert",
    ".diff": "text/x-diff",
    ".djv": "image/vnd.djvu",
    ".djvu": "image/vnd.djvu",
    ".dll": "application/x-msdownload",
    ".dmg": "application/octet-stream",
    ".doc": "application/msword",
    ".dot": "application/msword",
    ".dtd": "application/xml-dtd",
    ".dvi": "application/x-dvi",
    ".ear": "application/java-archive",
    ".eml": "message/rfc822",
    ".eps": "application/postscript",
    ".exe": "application/x-msdownload",
    ".f": "text/x-fortran",
    ".f77": "text/x-fortran",
    ".f90": "text/x-fortran",
    ".flv": "video/x-flv",
    ".for": "text/x-fortran",
    ".gem": "application/octet-stream",
    ".gemspec": "text/x-script.ruby",
    ".gif": "image/gif",
    ".gz": "application/x-gzip",
    ".h": "text/x-c",
    ".hh": "text/x-c",
    ".htm": "text/html",
    ".html": "text/html",
    ".ico": "image/vnd.microsoft.icon",
    ".ics": "text/calendar",
    ".ifb": "text/calendar",
    ".iso": "application/octet-stream",
    ".jar": "application/java-archive",
    ".java": "text/x-java-source",
    ".jnlp": "application/x-java-jnlp-file",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "application/javascript",
    ".json": "application/json",
    ".log": "text/plain",
    ".m3u": "audio/x-mpegurl",
    ".m4v": "video/mp4",
    ".man": "text/troff",
    ".mathml": "application/mathml+xml",
    ".mbox": "application/mbox",
    ".mdoc": "text/troff",
    ".me": "text/troff",
    ".mid": "audio/midi",
    ".midi": "audio/midi",
    ".mime": "message/rfc822",
    ".mml": "application/mathml+xml",
    ".mng": "video/x-mng",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".mp4v": "video/mp4",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".ms": "text/troff",
    ".msi": "application/x-msdownload",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ogg": "application/ogg",
    ".p": "text/x-pascal",
    ".pas": "text/x-pascal",
    ".pbm": "image/x-portable-bitmap",
    ".pdf": "application/pdf",
    ".pem": "application/x-x509-ca-cert",
    ".pgm": "image/x-portable-graymap",
    ".pgp": "application/pgp-encrypted",
    ".pkg": "application/octet-stream",
    ".pl": "text/x-script.perl",
    ".pm": "text/x-script.perl-module",
    ".png": "image/png",
    ".pnm": "image/x-portable-anymap",
    ".ppm": "image/x-portable-pixmap",
    ".pps": "application/vnd.ms-powerpoint",
    ".ppt": "application/vnd.ms-powerpoint",
    ".ps": "application/postscript",
    ".psd": "image/vnd.adobe.photoshop",
    ".py": "text/x-script.python",
    ".qt": "video/quicktime",
    ".ra": "audio/x-pn-realaudio",
    ".rake": "text/x-script.ruby",
    ".ram": "audio/x-pn-realaudio",
    ".rar": "application/x-rar-compressed",
    ".rb": "text/x-script.ruby",
    ".rdf": "application/rdf+xml",
    ".roff": "text/troff",
    ".rpm": "application/x-redhat-package-manager",
    ".rss": "application/rss+xml",
    ".rtf": "application/rtf",
    ".ru": "text/x-script.ruby",
    ".s": "text/x-asm",
    ".sgm": "text/sgml",
    ".sgml": "text/sgml",
    ".sh": "application/x-sh",
    ".sig": "application/pgp-signature",
    ".snd": "audio/basic",
    ".so": "application/octet-stream",
    ".svg": "image/svg+xml",
    ".svgz": "image/svg+xml",
    ".swf": "application/x-shockwave-flash",
    ".t": "text/troff",
    ".tar": "application/x-tar",
    ".tbz": "application/x-bzip-compressed-tar",
    ".tcl": "application/x-tcl",
    ".tex": "application/x-tex",
    ".texi": "application/x-texinfo",
    ".texinfo": "application/x-texinfo",
    ".text": "text/plain",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".torrent": "application/x-bittorrent",
    ".tr": "text/troff",
    ".txt": "text/plain",
    ".vcf": "text/x-vcard",
    ".vcs": "text/x-vcalendar",
    ".vrml": "model/vrml",
    ".war": "application/java-archive",
    ".wav": "audio/x-wav",
    ".wma": "audio/x-ms-wma",
    ".wmv": "video/x-ms-wmv",
    ".wmx": "video/x-ms-wmx",
    ".wrl": "model/vrml",
    ".wsdl": "application/wsdl+xml",
    ".xbm": "image/x-xbitmap",
    ".xhtml": "application/xhtml+xml",
    ".xls": "application/vnd.ms-excel",
    ".xml": "application/xml",
    ".xpm": "image/x-xpixmap",
    ".xsl": "application/xml",
    ".xslt": "application/xslt+xml",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".zip": "application/zip"
};