// Setup basic express server
var express = require("express");
var app = express();
var path = require("path");
var os = require("os");
var server = require("http").createServer(app);
var io = require("socket.io")(server, { serveClient: true });
var port = process.env.PORT || 3000;
const myLoggers = require("log4js");

//setup logger
myLoggers.configure({
    appenders: {
        file_history: { type: "file", filename: "logs/log_history.txt" },
        file_session: { type: "file", filename: "logs/log.txt", flags: "w" }
    },
    categories: {
        default: { appenders: ["file_history", "file_session"], level: "ALL" }
    }
});
const logger = myLoggers.getLogger("default");

//logger function to write to the console, the log4JS logger and any clients who are watching
function log(message) {
    console.log(message);
    logger.info(message);
    io.sockets.emit("newlog"); // alert all watchers
}

server.listen(port, () => {
    log("server started");

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === "IPv4") {
                addresses.push(address.address);
            }
        }
    }

    for (var _i = 0, addresses_1 = addresses; _i < addresses_1.length; _i++) {
        var address = addresses_1[_i];
        log("http://" + address + ":" + port);
    }
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Access all log files from anywhere on the network
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.get("/logs", function(req, res) {
    res.sendFile(path.join(__dirname, "logs.html"));
});

var usersByRooms = {};
var rooms = [];
var numLogWatchers = 0; // in case it is ever useful to know

// Socket event handlers
io.sockets.on("connection", function(socket) {
    log("new socket.io client connected");

    // Register client as log watcher
    socket.on("addlogwatcher", function() {
        socket.isLogWatcher = true;
        numLogWatchers++;
    });

    socket.on("adduser", function(username, room) {
        log("add user: " + username + ", " + room);
        socket.username = username;
        socket.join(room, function(err) {
            handleJoinRoom(socket, room, err);
        });
    });

    socket.on("sendchat", function(data) {
        io.to(socket.room).emit("updatechat", {
            username: socket.username,
            data: data
        });
    });

    socket.on("switchroom", function(room) {
        socket.leave(socket.room, function(err) {
            if (handleLeaveRoom(socket, err)) {
                socket.join(room, function(err) {
                    handleJoinRoom(socket, room, err);
                });
            }
        });
    });

    // For generic messaging capabilities
    socket.on("sendmessage", function(cmd, data) {
        log(
            "User '" +
                socket.username +
                "' is sending a message to room '" +
                socket.room +
                "'..."
        );
        log("Message");
        log("-------");
        log("cmd: " + cmd);
        log("data: " + (data.length < 20 ? data : data.slice(0, 20) + "...")); // truncate data if very long

        socket.broadcast.to(socket.room).emit(cmd, {
            username: socket.username,
            data: data
        });
    });

    socket.on("disconnect", function() {
        if (socket.isLogWatcher) {
            numLogWatchers--;
            return;
        }

        try {
            log("User '" + socket.username + "' disconnected");
            handleLeaveRoom(socket);
        } catch (error) {
            log(
                "Error disconnecting: something did not subscribe. Most likely, someone closed the chat window without logging in."
            );
        }
    });
});

// Helper functions
function handleJoinRoom(socket, room, err) {
    if (err) {
        console.log(
            "Error adding '" + socket.username + "' to room '" + room + "': ",
            err
        );
        return false;
    }
    socket.room = room;

    if (!usersByRooms.hasOwnProperty(room)) {
        usersByRooms[room] = {};
        rooms.push(room);
    }
    usersByRooms[room][socket.id] = socket.username;

    io.to(socket.room).emit("serverupdate", {
        type: "userjoined",
        username: socket.username,
        room: socket.room,
        rooms: rooms,
        users: usersByRooms[socket.room]
    });

    log(
        "Successfully added user '" +
            socket.username +
            "' to room '" +
            socket.room +
            "'."
    );

    logSocketRoomInfo(socket);
    updateRoomsAndNotifyEveryone();

    return true;
}

function handleLeaveRoom(socket, err) {
    if (err) {
        console.log(
            "Error removing '" + username + "' from room '" + room + "': ",
            err
        );
        return false;
    }
    delete usersByRooms[socket.room][socket.id];

    io.to(socket.room).emit("serverupdate", {
        type: "userleft",
        username: socket.username,
        room: socket.room,
        rooms: rooms,
        users: usersByRooms[socket.room]
    });

    log(
        "Successfully removed user '" +
            socket.username +
            "' from room '" +
            socket.room +
            "'."
    );

    logSocketRoomInfo(socket);
    updateRoomsAndNotifyEveryone(socket);

    return true;
}

function updateRoomsAndNotifyEveryone() {
    // Keep 'rooms' and 'usersByRoom' up to date
    Object.keys(usersByRooms).forEach(r => {
        if (Object.keys(usersByRooms[r]).length < 1) {
            rooms = rooms.filter(room => room != r);
            delete usersByRooms[r];
        }
    });

    // Let each socket which room it is in,
    // as well as other available rooms
    Object.values(io.sockets.connected).forEach(s =>
        s.emit("updaterooms", {
            current_room: s.room,
            rooms: rooms
        })
    );
}

function logSocketRoomInfo(socket) {
    log(
        "Number of users in room '" +
            socket.room +
            "': " +
            Object.keys(usersByRooms[socket.room]).length
    );
}
