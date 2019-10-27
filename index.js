// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var os = require("os");
var server = require('http').createServer(app);
var io = require('socket.io')(server, { serveClient: true })
var port = process.env.PORT || 3000;
const myLoggers = require('log4js');

//setup logger
myLoggers.configure({
    appenders: { mylogger: { type: "file", filename: "logs/log.txt" } },
    categories: { default: { appenders: ["mylogger"], level: "ALL" } }
});
const logger = myLoggers.getLogger("default");

//logger function to write to both the console and the log4JS logger
function log(message) {
    console.log(message);
    logger.info(message);
}

server.listen(port, () => {
    log('server started');

  var interfaces = os.networkInterfaces();
var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4') {
                    addresses.push(address.address);
                }
            }
        }

for (var _i = 0, addresses_1 = addresses; _i < addresses_1.length; _i++) {
	var address = addresses_1[_i];
    log("http://" + address + ":" + port);
}
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var usersByRooms={};
var rooms = [];

io.sockets.on('connection', function (socket) {
	
	socket.on('adduser', function(username, room){
		socket.username = username;
        socket.room = room;

		if(!usersByRooms.hasOwnProperty(room)){
			usersByRooms[room]={};
			rooms.push(room);
		}
		usersByRooms[room][socket.id] = username;

		for (var k in usersByRooms) {
			if(k.length<1){
				delete rooms[k];
				delete k;
			}
		}

		socket.join(room);

		socket.emit('serverupdate', {
			type:'userjoined',
			username: socket.username,
			room: socket.room,
			rooms: rooms,
			users: usersByRooms[socket.room]
		});

		socket.broadcast.to(socket.room).emit('serverupdate', {
			type:'userjoined',
			username: socket.username,
			room: socket.room,
			rooms: rooms,
			users: usersByRooms[socket.room]
		});

		 log('just logged in '+username+', users in '+room+': '+Object.keys(usersByRooms[room]).length );
	});

	socket.on('sendmessage', function (cmd, data) {
		socket.broadcast.to(socket.room).emit(cmd, {
			username: socket.username,
			data: data
		});
	});


	socket.on('disconnect', function(){
		try	{
		delete usersByRooms[socket.room][socket.id];

		for (var k in usersByRooms) 
		{
			if(k.length<1)
			{
				delete rooms[k];
				delete k;
			}
		}
		
		log('just logged out '+socket.username+', users in '+room+': '+Object.keys(usersByRooms[room]).length );

		socket.emit('serverupdate', {
			type:'userleft',
			username: socket.username,
			room: socket.room,
			rooms: rooms,
			users: usersByRooms[socket.room]
		});

		socket.broadcast.to(socket.room).emit('serverupdate', {
			type:'userleft',
			username: socket.username,
			room: socket.room,
			rooms: rooms,
			users: usersByRooms[socket.room]
		});

		socket.leave(socket.room);
		}catch(error)
		{
		log('error disconnecting, something did not subscribe' );

		}
	});
});