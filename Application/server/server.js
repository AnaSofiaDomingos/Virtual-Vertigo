 /* ------------------------------------------------------------------------------------
 file : server.js
 author : António Domingos Ana Sofia
 date : hepia Spring 2015
 description : Script NodeJS with the serveur Web Virtual Vertigo using the module socket.io 
 			   and express
  ------------------------------------------------------------------------------------- */

var express = require("express"),
	app = express(),
	server = require('http').createServer(app);

// redirection on /public who content the file 
app.use(express.static(__dirname + '/public'));

// launch the server
server.listen(3000, function(){
  console.log('listening on *:3000');
});


var io = require('socket.io').listen(server, { 'destroy buffer size': Infinity });
io.set('log level', 1);

io.sockets.on('connection', function(socket){
	console.info('Client connected');

	// reception of datas captured by the kinect
	socket.on("squelette", function(json){
		io.sockets.emit("dataKinect", json);
	});

	socket.on("orientation", function(start, end, rotation){
		var json = {"start" : start, "end" : end, "rotation" : rotation };
		io.sockets.emit("boneOrientation", json);
	});
	
	socket.on('disconnect', function() {
		console.info('Client is gone');
	});
	
});
