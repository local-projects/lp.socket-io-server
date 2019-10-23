// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var os = require("os");
var server = require('http').createServer(app);
var io = require('socket.io')(server, { serveClient: true })
//var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at: ');

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
        console.log("http://" + address + ":" + port);
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

		 console.log('just logged in '+username+', users in '+room+': '+Object.keys(usersByRooms[room]).length );
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
		
		
		
		console.log('just logged out '+socket.username+', users in '+room+': '+Object.keys(usersByRooms[room]).length );



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
		console.log('error disconnecting, somebody didnt subscribe' );

		}
	});
});