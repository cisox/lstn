var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var moment = require('moment');
var nconf = require('nconf');
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');

// Read the command line and environment variables
nconf.argv().env();

// Read the config file
nconf.file({
  file: 'config.json'
});

// Set some development defaults
nconf.defaults({
  http: {
    port: 3000
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

// Setup Redis Cache
var cache = redis(nconf.get('redis:port'), nconf.get('redis:host'));
cache.on('error', function(err) {
  console.log('Error connecting to redis cache', err);
});

// Setup Redis Pub/Sub connections for Socket.IO
var pub = redis(nconf.get('redis:port'), nconf.get('redis:host'));
pub.on('error', function(err) {
  console.log('Error connecting to redis publish', err);
});

var sub = redis(nconf.get('redis:port'), nconf.get('redis:host'), {
  detect_buffers: true
});
sub.on('error', function(err) {
  console.log('Error connecting to redis subscribe', err);
});

io.adapter(adapter({
  pubClient: pub,
  subClient: sub
}));

// Start Listening
server.listen(nconf.get('http:port'));

var PLAYING_REQUEST_TIMEOUT = 2 * 1000;
var playing = {};
var roster = {};
var connections = {};
var timeouts = {};
var currentController = {};
var chatHistory = {};

var Lstn = function(socket) {
  this.socket = socket;
  this.roomId = socket.roomId;
  this.userId = socket.userId;
};

Lstn.prototype.isCurrentController = function(userId) {
  userId = userId || this.userId;
  return this.getCurrentController() === userId;
};

Lstn.prototype.setCurrentController = function(controller) {
  controller = controller || this.userId;
  currentController[this.roomId] = controller;
};

Lstn.prototype.getCurrentController = function() {
  if (!(this.roomId in currentController)) {
    return null;
  }

  return currentController[this.roomId];
};

Lstn.prototype.getUser = function(user) {
  if (!(this.roomId in roster)) {
    return null;
  }

  user = user || this.userId;

  if (user in roster[this.roomId].controllers) {
    return roster[this.roomId].controllers[user];
  }

  if (user in roster[this.roomId].users) {
    return roster[this.roomId].users[user];
  }

  return null;
};

Lstn.prototype.getTrack = function() {
  if (!(this.roomId in playing)) {
    return null;
  }

  if (!playing[this.roomId]) {
    return null;
  }

  if (!('key' in playing[this.roomId])) {
    return null;
  }

  return playing[this.roomId];
};

Lstn.prototype.clearTimeouts = function() {
  if (!(this.roomId in timeouts)) {
    return;
  }

  for (var timeout in timeouts[this.roomId]) {
    if (!timeout || !timeouts[this.roomId].hasOwnProperty(timeout)) {
      continue;
    }

    this.clearTimeout(timeout);
  }
};

Lstn.prototype.clearTimeout = function(type, socket) {
  socket = socket || this.socket;

  if (!(this.roomId in timeouts)) {
    return;
  }

  if (!(type in timeouts[socket.roomId])) {
    return;
  }

  if (!timeouts[socket.roomId][type]) {
    return;
  }

  clearTimeout(timeouts[socket.roomId][type]);
  timeouts[socket.roomId][type] = 0;
};

Lstn.prototype.setTimeout = function(type, callback, timeout) {
  if (!(this.roomId in timeouts)) {
    timeouts[this.roomId] = {};
  }

  timeouts[this.roomId][type] = setTimeout(callback, timeout);
};

Lstn.prototype.addPlayingRequestTimeout = function(socket) {
  this.setTimeout('playing_request', function() {
    this.initController(this.getNextController(socket));
  }.bind(this), this.PLAYING_REQUEST_TIMEOUT);
};

Lstn.prototype.addPlayingTimeout = function() {
  if (!playing ||
    !(this.roomId in playing) ||
    !playing[this.roomId] ||
    !playing[this.roomId].duration) {

    return;
  }

  var playingTimeout = (parseInt(playing[this.roomId].duration, 10) + 10) * 1000;

  this.setTimeout('playing', function() {
    this.initController(this.getNextController());
  }.bind(this), playingTimeout);
};

Lstn.prototype.isController = function() {
  return roster[this.roomId] &&
    roster[this.roomId].controllers &&
    this.userId in roster[this.roomId].controllers;
};

Lstn.prototype.getControllerCount = function() {
  if (!roster[this.roomId] ||
      !roster[this.roomId].controllerOrder) {

    return 0;
  }

  return roster[this.roomId].controllerOrder.length;
};

Lstn.prototype.getNextController = function() {
  // Check to see if we have any other controllers
  if (!roster[this.roomId] ||
    !roster[this.roomId].controllerOrder ||
    roster[this.roomId].controllerOrder.length === 0) {

    return false;
  }

  var controllerPosition = roster[this.roomId].controllerOrder.indexOf(this.userId) + 1;
  if (controllerPosition >= roster[this.roomId].controllerOrder.length) {
    controllerPosition = 0;
  }

  var controller = roster[this.roomId].controllerOrder[controllerPosition];
  if (!controller) {
    return false;
  }

  if (!(controller in connections[this.roomId])) {
    return false;
  }

  var socketIds = Object.keys(connections[this.roomId][controller]);
  if (!socketIds || socketIds.length === 0) {
    return false;
  }

  return connections[this.roomId][controller][socketIds[0]];
};

Lstn.prototype.initController = function(socket) {
  // Clear any room timeouts
  this.clearTimeouts();

  // Clear the playing info
  this.clearPlaying();
  this.sendPlaying(true);

  // Abort if we don't have a user to contact
  if (!socket) {
    return false;
  }

  this.setCurrentController(socket.userId);

  // Notify the user that they're now the active controller
  socket.emit('room:controller:playing:request');

  // Create a playing_request timeout just in case
  /*
   * TODO: It seems weird to me to interact directly with
   * the next socket without somehow not using this object
   */
  // this.addPlayingRequestTimeout(socket);

  return true;
};

Lstn.prototype.addToRoster = function(user) {
  // Create the room roster if needed
  if (!(this.roomId in roster)) {
    roster[this.roomId] = {
      controllers: {},
      controllerOrder: [],
      users: {},
      mentionNames: {}
    };
  }

  roster[this.roomId].users[this.userId] = user;
  roster[this.roomId].mentionNames[this.userId] = {
    id: this.userId,
    label: user.mention,
    name: user.name,
    picture: user.picture
  };
};

Lstn.prototype.updateRoster = function(user) {
  if (!(this.roomId in roster)) {
    roster[this.roomId] = {
      controllers: {},
      controllerOrder: [],
      users: {},
      mentionNames: {}
    };
  }

  if (this.isController()) {
    roster[this.roomId].controllers[this.userId] = user;
  } else {
    roster[this.roomId].users[this.userId] = user;
  }

  if (!(this.userId in roster[this.roomId].mentionNames)) {
    roster[this.roomId].mentionNames[this.userId] = {
      id: this.userId
    };
  }

  roster[this.roomId].mentionNames[this.userId].label = user.mention;
  roster[this.roomId].mentionNames[this.userId].name = user.name;
  roster[this.roomId].mentionNames[this.userId].picture = user.picture;
};

Lstn.prototype.removeFromRoster = function() {
  // Delete the user from the room's roster
  if (this.userId in roster[this.roomId].controllers) {
    this.removeFromControllers();
  } else if (this.userId in roster[this.roomId].users) {
    this.removeFromUsers();
  }

  delete roster[this.roomId].mentionNames[this.userId];
};

Lstn.prototype.removeFromControllers = function() {
  // Remove the user from the round-robin list
  var controllerPosition = roster[this.roomId].controllerOrder.indexOf(this.userId);
  if (controllerPosition !== -1) {
    roster[this.roomId].controllerOrder.splice(controllerPosition, 1);
  }

  // Delete the user from the controller list
  delete roster[this.roomId].controllers[this.userId];
};

Lstn.prototype.removeFromUsers = function() {
  // Delete the user from the users list
  delete roster[this.roomId].users[this.userId];
};

Lstn.prototype.addToControllers = function() {
  // Update the controllers list
  roster[this.roomId].controllers[this.userId] = roster[this.roomId].users[this.userId];

  // Update the round-robin list
  roster[this.roomId].controllerOrder.push(this.userId);
};

Lstn.prototype.addToUsers = function() {
  roster[this.roomId].users[this.userId] = roster[this.roomId].controllers[this.userId];
};

Lstn.prototype.sendRoster = function() {
  var currentRoster = JSON.parse(JSON.stringify(roster[this.roomId]));
  if (currentRoster) {
    currentRoster.mentionNames = Object.keys(currentRoster.mentionNames || {}).map(function(key) {
      return currentRoster.mentionNames[key];
    });

    var regions = {};
    Object.keys(currentRoster.controllers).forEach(function(userId) {
      var region = currentRoster.controllers[userId].region || 'US';
      regions[region] = 1;
    });

    Object.keys(currentRoster.users).forEach(function(userId) {
      var region = currentRoster.users[userId].region || 'US';
      regions[region] = 1;
    });

    currentRoster.regions = Object.keys(regions);
  }

  io.sockets.in(this.roomId).emit('room:roster:update', currentRoster);
};

Lstn.prototype.getChatHistory = function() {
  if (!(this.roomId in chatHistory)) {
    return [];
  }

  return chatHistory[this.roomId].filter(function(message) {
    return message.type !== 'connect' && message.type !== 'disconnect';
  });
};

Lstn.prototype.sendChatHistory = function() {
  this.socket.emit('room:chat:history', this.getChatHistory());
};

Lstn.prototype.sendChatMessage = function(message) {
  message.created = moment().format();

  io.sockets.in(this.roomId).emit('room:chat:message', message);

  if (!(this.roomId in chatHistory)) {
    chatHistory[this.roomId] = [];
  }

  chatHistory[this.roomId].unshift(message);

  /*
  var limit = 500;
  var length = chatHistory[this.roomId].length;
  if (length > limit) {
    chatHistory[this.roomId].splice(limit - 1, length - limit);
  }
  */
};

Lstn.prototype.addConnection = function() {
  // Create the room's connection pool if needed
  if (!(this.roomId in connections)) {
    connections[this.roomId] = {};
  }

  // Create the sessions for the room/user
  if (!(this.userId in connections[this.roomId])) {
    connections[this.roomId][this.userId] = {};
  }

  // Update our sessions for the room/user
  connections[this.roomId][this.userId][this.socket.id] = this.socket;
};

Lstn.prototype.removeConnection = function() {
  // Delete the connection to the room
  delete connections[this.roomId][this.userId][this.socket.id];

  // Check if the user still has an open connection to the room
  if (Object.keys(connections[this.roomId][this.userId]).length !== 0) {
    return false;
  }

  return true;
};

Lstn.prototype.setPlaying = function(data) {
  playing[this.roomId] = data;
};

Lstn.prototype.setPlayingPosition = function(data) {
  if (!playing[this.roomId]) {
    return;
  }

  playing[this.roomId].position = data;
};

Lstn.prototype.incrPlayingVotes = function() {
  if (!playing[this.roomId]) {
    return 0;
  }

  if (!playing[this.roomId].points) {
    playing[this.roomId].points = 0;
  }

  playing[this.roomId].points += 1;

  return playing[this.roomId].points;
};

Lstn.prototype.decrPlayingVotes = function() {
  if (!playing[this.roomId]) {
    return 0;
  }

  if (!playing[this.roomId].points) {
    playing[this.roomId].points = 0;
  }

  playing[this.roomId].points -= 1;

  return playing[this.roomId].points;
};

Lstn.prototype.clearPlaying = function() {
  playing[this.roomId] = null;
};

Lstn.prototype.sendPlaying = function(broadcast) {
  var data = {
    key: null,
    position: 0,
    controller: null,
    voted: 0,
    upvoted: 0,
    downvoted: 0
  };

  if (playing &&
    this.roomId in playing &&
    playing[this.roomId]) {

    if ('key' in playing[this.roomId]) {
      data.key = playing[this.roomId].key;
    }

    if ('position' in playing[this.roomId]) {
      data.position = playing[this.roomId].position;
    }

    data.controller = this.getCurrentController();
    if (data.key && data.controller) {
      var votingKey = 'vote_' + this.userId + '_' + data.controller + '_' + this.roomId + '_' + data.key;
      var direction = cache.get(votingKey);
      
      if (direction === 'upvote') {
        data.voted = 1;
        data.upvoted = 1;
      } else if (direction === 'downvote') {
        data.voted = 1;
        data.downvoted = 1;
      }
    }
  }

  if (broadcast) {
    io.sockets.in(this.roomId).emit('room:playing', data);

    var controller = this.getCurrentController();
    var user = this.getUser(controller);
    var track = this.getTrack();

    if (controller && user && track) {
      this.sendChatMessage({
        sender: this.getCurrentController(),
        track: track,
        user: user,
        type: 'playing',
      });
    }
  } else {
    this.socket.emit('room:playing', data);
  }
};

Lstn.prototype.onDisconnect = function(data) {
  console.log(this.userId + ' disconnected from ' + this.roomId);

  // Check if this room is registered
  if (!(this.roomId in connections)) {
    return;
  }

  // Check if this user is registered
  if (!(this.userId in connections[this.roomId])) {
    return;
  }

  // Check if this connection is registered
  if (!(this.socket.id in connections[this.roomId][this.userId])) {
    return;
  }

  // Check if we still have open connections from this user
  if (!this.removeConnection()) {
    return;
  }

  var user = this.getUser(this.userId);

  if (user) {
    this.sendChatMessage({
      sender: this.userId,
      user: user,
      type: 'disconnect'
    });
  }

  // Remove the user from the roster and send an updated version
  this.removeFromRoster();
  this.sendRoster();

  // If the user is the current controller, process controllers
  if (this.isCurrentController()) {
    // Select the next controller in the list
    this.initController(this.getNextController());
  }
};

Lstn.prototype.onRoomConnect = function(data) {
  // Check for a room id in the event data
  if (!('id' in data)) {
    this.socket.emit('room:connect:error', {
      status: 'bad_request',
      error: 'Missing Room ID'
    });

    return;
  }

  // Check for a user in the event data
  if (!('user' in data) || !('id' in data.user)) {
    this.socket.emit('room:connect:error', {
      status: 'bad_request',
      error: 'Missing User'
    });

    return;
  }

  console.log(data.user.id + ' connected to ' + data.id);

  // Set the socket's room and user ids
  this.roomId = this.socket.roomId = data.id;
  this.userId = this.socket.userId = data.user.id;

  // Join the socket.io room
  this.socket.join(data.id);

  // Add a connection for this socket
  this.addConnection();

  // Update the roster for the room
  this.addToRoster(data.user);

  // Register room for user in Redis
  var userKey = 'user_' + this.userId;
  var currentTime = Math.floor(Date.now() / 1000);
  cache.zadd(userKey, currentTime, this.roomId);

  // Purge expired rooms
  var expiration = currentTime - (60 * 60 * 24 * 7);
  console.log('expiring to ' + expiration);
  cache.zremrangebyscore(userKey, '-inf', expiration);

  // Send the updated roster
  this.sendRoster();

  // Send the chat history
  this.sendChatHistory();

  // Send playing status
  this.sendPlaying();

  // Send connect message
  this.sendChatMessage({
    sender: this.userId,
    user: data.user,
    type: 'connect'
  });
};

Lstn.prototype.onRoomUpdate = function(data) {
  this.updateRoster(data);
  this.sendRoster();
};

Lstn.prototype.onControllerRelease = function() {
  console.log('request to release from control from ' + this.userId + ' for ' + this.roomId);

  if (!this.isController()) {
    console.log(this.userId + ' was not a controller of ' + this.roomId);
    return;
  }

  this.addToUsers();
  this.removeFromControllers();
  this.sendRoster();

  // If the user is the current controller, process controllers
  if (this.isCurrentController()) {
    // Select the next controller in the list
    this.initController(this.getNextController());
  }
};

Lstn.prototype.onControllerRequest = function() {
  console.log('request to become controller from ' + this.userId + ' for ' + this.roomId);

  // Make sure this user isn't a controller already
  if (this.isController()) {
    console.log(this.userId + ' was already a controller of ' + this.roomId);
    return;
  }

  // Update roster
  this.addToControllers();
  this.removeFromUsers();
  this.sendRoster();

  // Check if we have controllers already
  if (this.getControllerCount() > 1) {
    return;
  }

  // Send the controller play request
  if (!this.initController(this.socket)) {
    console.log('Unable to initialize controller');
    return;
  }
};

Lstn.prototype.onControllerEmpty = function(data) {
  // Clear the playing_request timeout
  this.clearTimeout('playing_request');

  console.log(this.userId + ' has an empty queue');

  // Update roster
  this.addToUsers();
  this.removeFromControllers();
  this.sendRoster();

  // If the user is the current controller, process controllers
  if (this.isCurrentController()) {
    // Select the next controller in the list
    this.initController(this.getNextController());
  }
};

Lstn.prototype.onControllerPlaying = function(data) {
  console.log(this.userId + ' says to play ' + data.name + ' in ' + this.roomId);

  // Set the current controller
  this.setCurrentController();

  // Clear the playing_request timeout
  this.clearTimeout('playing_request');

  // Set the playing info
  this.setPlaying(data);

  // Tell the room what's playing
  this.sendPlaying(true);

  // Create a timeout to advance the queue if necessary
  this.addPlayingTimeout();

  // Update the redis keys
  cache.hincrby('played', data.key, 1);
  cache.hincrby('played:' + this.roomId, data.key, 1);
};

Lstn.prototype.onControllerPlayingPosition = function(data) {
  this.setPlayingPosition(data);
};

Lstn.prototype.onControllerPlayingFinished = function(data) {
  console.log(this.userId + ' says track in ' + this.roomId + ' has finished');

  // If the user is the current controller, process controllers
  if (this.isCurrentController()) {
    // Select the next controller in the list
    this.initController(this.getNextController());
  }
};

Lstn.prototype.onControllerPlayingSkipped = function(data, reason) {
  console.log(this.userId + ' says track in ' + this.roomId + ' was skipped');

  var controller = this.getCurrentController();
  var user = this.getUser(controller);
  var track = this.getTrack();

  var type = 'skipped';
  if (reason) {
    type += ':' + reason;
  }

  if (controller && user && track) {
    this.sendChatMessage({
      sender: this.getCurrentController(),
      track: track,
      user: user,
      type: type,
    });
  }

  // If the user is the current controller, process controllers
  if (this.isCurrentController()) {
    // Select the next controller in the list
    this.initController(this.getNextController());
  }
};

Lstn.prototype.onControllerUpvote = function() {
  var votes = this.incrPlayingVotes();
  io.sockets.in(this.roomId).emit('room:upvote', {
    user: this.userId,
    votes: votes
  });

  var user = this.getUser();
  var track = this.getTrack();

  if (user && track) {
    this.sendChatMessage({
      sender: this.userId,
      track: track,
      user: user,
      type: 'upvote'
    });
  }
};

Lstn.prototype.onControllerDownvote = function() {
  var votes = this.decrPlayingVotes();
  io.sockets.in(this.roomId).emit('room:downvote', {
    user: this.userId,
    votes: votes
  });

  var user = this.getUser();
  var track = this.getTrack();

  if (user && track) {
    this.sendChatMessage({
      sender: this.userId,
      track: track,
      user: user,
      type: 'downvote'
    });
  }
};

Lstn.prototype.onChatMessage = function(message) {
  if (!message) {
    return;
  }

  message.mentionedNames = [];

  var mentioned = message.text.match(/@(\S+)/ig);
  if (mentioned) {
    // Populate mentioned names
    var mentionedNames = {};

    mentioned.forEach(function(value) {
      mentionedNames[value.toLowerCase().substring(1)] = 1;
    }, this);

    message.mentionedNames = Object.keys(mentionedNames);
  }

  this.sendChatMessage(message);
};

io.sockets.on('connection', function(socket) {
  console.log('new socket', socket.id);
  var lstn = new Lstn(socket);

  // Client handling
  socket.on('room:connect', lstn.onRoomConnect.bind(lstn));
  socket.on('room:update', lstn.onRoomUpdate.bind(lstn));
  socket.on('disconnect', lstn.onDisconnect.bind(lstn));

  // Controller registration handling
  socket.on('room:controller:request', lstn.onControllerRequest.bind(lstn));
  socket.on('room:controller:release', lstn.onControllerRelease.bind(lstn));
  socket.on('room:controller:empty', lstn.onControllerEmpty.bind(lstn));

  // Controller playback handling
  socket.on('room:controller:playing', lstn.onControllerPlaying.bind(lstn));
  socket.on('room:controller:playing:position', lstn.onControllerPlayingPosition.bind(lstn));
  socket.on('room:controller:playing:finished', lstn.onControllerPlayingFinished.bind(lstn));
  socket.on('room:controller:playing:skipped', lstn.onControllerPlayingSkipped.bind(lstn));
  socket.on('room:controller:playing:skipped:downvoted', lstn.onControllerPlayingSkipped.bind(lstn, 'downvoted'));

  // Controller voting
  socket.on('room:controller:upvote', lstn.onControllerUpvote.bind(lstn));
  socket.on('room:controller:downvote', lstn.onControllerDownvote.bind(lstn));

  // Chat
  socket.on('room:chat:message', lstn.onChatMessage.bind(lstn));
});
