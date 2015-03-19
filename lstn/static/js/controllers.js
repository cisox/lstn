(function() {
'use strict';

angular.module('lstn.controllers', [])

.controller('AppController', ['$scope', '$modal', '$log', 'Alert', 'CurrentRoom', 'CurrentUser', 'AuthUser',
  function($scope, $modal, $log, Alert, CurrentRoom, CurrentUser, AuthUser) {
    $scope.$on('socket:error', function(ev, data) {
      $log.debug('socket:error', ev, data);
    });

    $scope.currentRoom = CurrentRoom;
    $scope.alerts = Alert;
    
    // Update AuthUser
    AuthUser.update($scope.current_user);

    // Profile
    $scope.openProfile = function() {
      var profileInstance = $modal.open({
        templateUrl: '/partials/modals/profile.html',
        controller: 'ProfileController',
        size: 'sm'
      });

      profileInstance.result.then(function(settings) {
        CurrentUser.settings(settings);
      });
    };
  }
])

.controller('RoomsController', ['$scope', '$location', 'Promise', 'Alert', 'Room', function($scope, $location, Promise, Alert, Room) {
  var promises = {};

  $scope.loading = true;
  $scope.showCreateRoom = false;

  $scope.$on('$destroy', function(e) {
    $.each(promises, function(name, promise) {
      Promise.cancel(promise);
    });
  });

  promises.listRoom = Room.list({}, function(response) {
    $scope.loading = false;
    if (!response || !response.success || !response.rooms) {
      Alert.error('Something went wrong while trying to load the rooms list.');
      return;
    }

    $scope.rooms = response.rooms;
  }, function(response) {
    $scope.loading = false;
    Alert.error('Something went wrong while trying to load the rooms list.');
  });

  $scope.newRoom = {
    name: null
  };

  $scope.createRoom = function() {
    $scope.showCreateRoom = true;
  };

  $scope.saveCreateRoom = function() {
    promises.createRoom = Room.save({}, $scope.newRoom, function(response) {
      if (!response || !response.success || !response.slug) {
        Alert.error('Something went wrong while trying to create the new room.');
        return false;
      }

      $location.path('/room/' + response.slug);
    }, function(response) {
      Alert.error('Something went wrong while trying to create the new room.');
    });
  };

  $scope.cancelCreateRoom = function() {
    $scope.showCreateRoom = false;
    $scope.newRoom.name = null;
    
    if (promises.createRoom) {
      Promise.cancel(promises.createRoom);
    }
  };

  $scope.editRoom = function(index) {
    $scope.rooms[index].editing = true;
  };

  $scope.saveEditRoom = function(index) {
    promises.updateRoom = Room.update({
      id: $scope.rooms[index].id
    }, $scope.rooms[index], function(response) {
      if (!response || !response.success || !response.room) {
        Alert.error('Something went wrong while trying to save the room.');
        return false;
      }

      $scope.rooms[index] = response.room;
    }, function(response) {
      Alert.error('Something went wrong while trying to save the room.');
    });
  };

  $scope.cancelEditRoom = function(index) {
    $scope.rooms[index].editing = false;

    if (promises.updateRoom) {
      Promise.cancel(promises.updateRoom);
    }
  };

  $scope.deleteRoom = function(index) {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    promises.deleteRoom = Room.delete({
      id: $scope.rooms[index].id
    }, function(response) {
      if (!response || !response.success) {
        Alert.error('Something went wrong while trying to delete the room.');
        return;
      }

      $scope.rooms.splice(index, 1);
    }, function(response) {
      Alert.error('Something went wrong while trying to delete the room.');
    });
  };
}])

.controller('RoomController', ['$scope', '$routeParams', '$timeout', '$log', 'socket', 'Promise', 'Rdio', 'CurrentRoom', 'Room', 'CurrentUser', 'User', 'Queue', 'Favorite', 'Alert', 'screenSize', '$localStorage', '$sessionStorage', 'Preview',
  function($scope, $routeParams, $timeout, $log, socket, Promise, Rdio, CurrentRoom, Room, CurrentUser, User, Queue, Favorite, Alert, screenSize, $localStorage, $sessionStorage, Preview) {
    var promises = {};
    var timeouts = {};

    // Setup Emoticons
    var setEmoticons = function(newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }

      emojione.ascii = newVal === 'replace';
    };

    $scope.$watch('current_user.settings.chat.emoticons', setEmoticons);

    var emoticons = 'keep';
    if ($scope.current_user &&
      $scope.current_user.settings &&
      $scope.current_user.settings.chat &&
      $scope.current_user.settings.chat.emoticons) {

      emoticons = $scope.current_user.settings.chat.emoticons;
    }

    setEmoticons(emoticons, 'keep');

    // Setup Tabs
    $scope.tabs = {
      queue: true,
      music: false
    };

    $scope.selectTab = function(tab) {
      $.each($scope.tabs, function(name, active) {
        $scope.tabs[name] = false;
      });

      $scope.tabs[tab] = true;
    };

    // Setup Controller Status
    $scope.isController = false;
    $scope.isCurrentController = false;
    $scope.currentController = null;

    $scope.voting = false;

    // Setup Chat
    $scope.chat = {
      loading: true,
      messages: []
    };

    // Setup Services
    $scope.queue = Queue;
    $scope.room = CurrentRoom;
    $scope.favorites = Favorite;
    $scope.rdio = Rdio;
    
    Preview.init();

    // Screen size
    $scope.desktop = screenSize.on('md, lg', function(match) {
      $scope.desktop = match;
    });

    // Clear sessionStorage
    $sessionStorage.$reset();

    // Handle destroy
    $scope.$on('$destroy', function(e) {
      $.each(promises, function(name, promise) {
        Promise.cancel(promise);
      });

      $.each(timeouts, function(name, promise) {
        $timeout.cancel(promise);
      });

      $scope.room.clear();
      $scope.alerts.clear();
    });

    // Notifications (TODO: Move to service)
    $scope.notificationPermission = 'default';
    if (window.Notification) {
      Notification.requestPermission(function(status) {
        $scope.notificationPermission = status;

        if (Notification.permission !== status) {
          Notification.permission = status;
        }
      });
    }

    $scope.sendNotification = function(title, body, icon, timeout, handler) {
      if (!window.Notification || $scope.notificationPermission !== 'granted') {
        return;
      }

      if (!title) {
        return;
      }

      var options = {};
      if (body) {
        options.body = body;
      }

      if (icon) {
        options.icon = icon;
      }

      var notification = new Notification(title + ' on Lstn.fm', options);

      if (timeout) {
        notification.onshow = function() {
          setTimeout(notification.close.bind(notification), timeout);
        };
      }

      if (handler) {
        notification.onclick = handler;
      }
    };

    // Setup sockets
    socket.on('connect', function() {
      $log.debug('socket', 'connect');

      if ($scope.room && $scope.room.id) {
        socket.registerRoom($scope.room.id, $scope.current_user);
      }
    });

    socket.on('disconnect', function() {
      $scope.isController = false;
      $scope.isCurrentController = false;

      $scope.playing = false;
      $scope.rdio.stop();
    });

    socket.on('room:connect:error', function(data) {
      $log.debug('socket', 'room:connect:error', data);
      Alert.error('Something went wrong while trying to connect to the room.');
    });

    socket.on('room:chat:history', function(data) {
      $log.debug('socket', 'room:chat:history', data);
      $scope.chat.messages = data;
      $scope.chat.loading = false;

      timeouts.chatHistory = $timeout(function() {
        if ($('#messages').length === 0) {
          return;
        }

        $('#messages').animate({
          scrollTop: 0
        }, 200);
      }, 10);
    });

    socket.on('room:roster:update', function(data) {
      $log.debug('socket', 'room:roster:update', data);
      $scope.roster = data;
      $scope.roster.controllersCount = $scope.roster.controllerOrder.length;
      $scope.roster.usersCount = Object.keys($scope.roster.users).length;

      $scope.room.setRegions($scope.roster.regions);
    });

    socket.on('room:controller:playing:request', function(data) {
      $log.debug('socket', 'room:controller:playing:request', data);
      $scope.isCurrentController = true;

      if (!$scope.queue.tracks || $scope.queue.tracks.length === 0) {
        $scope.isController = false;
        $scope.isCurrentController = false;
        socket.emit('room:controller:empty');

        Alert.info("You've been made a listener because your queue ran out of music.", 'listener');
        return;
      }

      var queueBehavior = 'bottom';
      if ($scope.current_user &&
        $scope.current_user.settings &&
        $scope.current_user.settings.queue &&
        $scope.current_user.settings.queue.behavior) {

        queueBehavior = $scope.current_user.settings.queue.behavior;
      }

      var track;
      if ($scope.queue.shuffle) {
        var index = Math.floor(Math.random() * $scope.queue.tracks.length);
        track = $scope.queue.tracks[index];

        if (queueBehavior === 'remove') {
          $scope.queue.tracks.splice(index, 1);
          $scope.queue.removeTrack(track, index);
        }
      } else {
        track = $scope.queue.tracks.shift();

        if (queueBehavior === 'bottom') {
          $scope.queue.tracks.push(track);
        } else {
          $scope.queue.removeTrack(track, 0);
        }
      }

      socket.emit('room:controller:playing', track);

      promises.updateQueue = CurrentUser.updateQueue({
        queue: $scope.queue.tracks
      }, function(response) {
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to move the track to the bottom of your queue.');
          return;
        }
      }, function(response) {
        Alert.error('Something went wrong while trying to move the track to the bottom of your queue.');
      });
    });

    socket.on('room:playing', function(data) {
      $log.debug('socket', 'room:playing', data);
      if (!$scope.rdio.ready) {
        $scope.rdio.queued = data;
        return;
      }

      $scope.playTrack(data);
    });

    socket.on('room:upvote', function(upvote) {
      $log.debug('socket', 'room:upvote', upvote);
      if ($scope.playing) {
        if (!$scope.playing.upvotes) {
          $scope.playing.upvotes = {};
        }

        $scope.playing.upvotes[upvote.user] = true;
      }

      if (!$scope.isCurrentController) {
        return;
      }

      promises.getCurrentUser = CurrentUser.get({}, function(response) {
        if (!response || !response.success || !response.user) {
          Alert.warning('Something went wrong while trying to get your latest score.');
          return;
        }

        socket.roomUpdate(response.user);
      }, function(response) {
        Alert.warning('Something went wrong while trying to get your latest score.');
      });
    });

    socket.on('room:downvote', function(downvote) {
      $log.debug('socket', 'room:downvote', downvote);
      if ($scope.playing) {
        if (!$scope.playing.downvotes) {
          $scope.playing.downvotes = {};
        }

        $scope.playing.downvotes[downvote.user] = true;
      }

      if (!$scope.isCurrentController) {
        return;
      }

      promises.getCurrentUser = CurrentUser.get({}, function(response) {
        if (!response || !response.success || !response.user) {
          Alert.warning('Something went wrong while trying to get your latest score.');
          return;
        }

        socket.roomUpdate(response.user);
      }, function(response) {
        Alert.warning('Something went wrong while trying to get your latest score.');
      });

      if (downvote.votes <= -2) {
        $scope.skipTrack('downvoted');
      }
    });

    socket.on('room:chat:message', function(message) {
      $log.debug('socket', 'room:chat:message', message);
      $scope.chat.messages.unshift(message);

      if (message &&
        message.mentionNames &&
        message.mentionedNames.indexOf($scope.current_user.mention.toLowerCase()) !== -1) {

        $scope.sendNotification(message.user, message.text, message.picture, 5000);
        $scope.$broadcast('mentioned', true);
      }

      timeouts.chatMessage = $timeout(function() {
        $('#messages').animate({
          scrollTop: 0
        }, 200);
      }, 10);
    });

    $scope.playTrack = function(data) {
      if (!$scope.rdio.ready) {
        $scope.rdio.queued = data;
        return;
      }

      if (!data || !data.key) {
        $scope.isCurrentController = false;

        $scope.rdio.stop();
        return;
      }

      // Play the track through Rdio
      $scope.rdio.play(data.key, {
        initialPosition: data.position || 0
      });

      // Update the current controller
      $scope.currentController = data.controller || null;

      // If we're not the controller, return
      if (!$scope.isCurrentController) {
        return;
      }

      // Cancel the update timeout
      if (timeouts.updatePosition) {
        $timeout.cancel(timeouts.updatePosition);
      }

      // Create a new update timeout
      timeouts.updatePosition = $timeout($scope.updatePosition, 1 * 2000, false);
    };

    $scope.trackFinished = function() {
      $scope.isCurrentController = false;
      socket.sendFinished();
    };

    $scope.updatePosition = function() {
      if (!$scope.playing) {
        return;
      }

      if (window.playingPosition >= $scope.playing.track.duration) {
        return;
      }

      socket.updatePosition(window.playingPosition);

      timeouts.updatePosition = $timeout($scope.updatePosition, 1 * 1000, false);
    };

    window.toggleBroadcast = $scope.toggleBroadcast = function() {
      Alert.remove('listener');
      $scope.isController = !$scope.isController;
    };

    window.upvote = $scope.upvote = function() {
      if (!$scope.playing ||
        $scope.voting ||
        !$scope.currentController ||
        $scope.isCurrentController) {

        return;
      }

      var remaining = Math.floor($scope.playing.track.duration - window.playingPosition);
      if (remaining <= 0) {
        return;
      }

      $scope.voting = true;

      promises.upvoteUser = User.upvote({
        id: $scope.currentController,
        room: $scope.room.id,
        track: $scope.playing.track.key,
        remaining: remaining
      }, function(response) {
        $scope.voting = false;

        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to upvote the track.');
          return;
        }

        if (!$scope.playing) {
          return;
        }

        $scope.playing.voted = true;
        $scope.playing.upvoted = true;
        $scope.playing.downvoted = false;

        if (!('vote' in $localStorage)) {
          $localStorage.vote = {};
        }

        $localStorage.vote[$scope.playing.track.key] = {
          expires: Date.now() + remaining,
          type: 'upvote'
        };

        socket.sendUpvote();
      }, function(response) {
        $scope.voting = false;
        Alert.error('Something went wrong while trying to upvote the track.');
      });
    };

    window.downvote = $scope.downvote = function() {
      if (!$scope.playing ||
        $scope.voting ||
        !$scope.currentController ||
        $scope.isCurentController) {

        return;
      }

      // This is to give us a target expiration for the Redis key
      var remaining = Math.floor($scope.playing.track.duration - window.playingPosition);
      if (remaining <= 0) {
        return;
      }

      $scope.voting = true;

      promises.downvoteUser = User.downvote({
        id: $scope.currentController,
        room: $scope.room.id,
        track: $scope.playing.track.key,
        remaining: remaining
      }, function(response) {
        $scope.voting = false;

        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to downvote the track.');
          return false;
        }

        if (!$scope.playing) {
          return;
        }

        $scope.playing.voted = true;
        $scope.playing.downvoted = true;
        $scope.playing.upvoted = false;

        if (!('vote' in $localStorage)) {
          $localStorage.vote = {};
        }

        $localStorage.vote[$scope.playing.track.key] = {
          expires: Date.now() + remaining,
          type: 'downvote'
        };

        socket.sendDownvote();
      }, function(response) {
        $scope.voting = false;
        Alert.error('Something went wrong while trying to downvote the track.');
      });
    };

    window.skipTrack = $scope.skipTrack = function(reason) {
      if (!$scope.isCurrentController) {
        return;
      }

      $scope.isCurrentController = false;
      socket.sendSkipped(reason);
    };

    $scope.rdioToLstn = function(rdioTrack) {
      var lstnTrack = {
        key: rdioTrack.key,
        link: rdioTrack.shortUrl,
        image: rdioTrack.icon,
        title: rdioTrack.name,
        artist: rdioTrack.artist,
        album: rdioTrack.album,
        position: 0,
        duration: rdioTrack.duration,
        canStream: rdioTrack.canStream,
        user: 0
      };

      if (rdioTrack.icon400) {
        lstnTrack.image = rdioTrack.icon400;
      }

      return lstnTrack;
    };

    // Watches
    $scope.$watch('queue.tracks', function() {
      var set = {};
      for (var i = 0; i < $scope.queue.tracks.length; i++) {
        set[$scope.queue.tracks[i].key] = true;
      }

      $scope.queue.bitset = set;
    });

    $scope.$watch('isController', function(newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }

      if (newVal) {
        socket.requestControl($scope.room.id, $scope.current_user.id);
      } else {
        socket.releaseControl($scope.room.id, $scope.current_user.id);
      }
    });

    $scope.$watch('rdio.ready', function(newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }

      // If Rdio isn't ready yet, return
      if (!newVal) {
        return;
      }

      // Set initial volume
      $scope.rdio.volume(0.7);

      // If we don't have a track to play, return
      if (!$scope.rdio.queued) {
        return;
      }

      // Play the track
      $scope.playTrack($scope.rdio.queued);
    });

    $scope.$watch('rdio.track.key', function(newVal, oldVal) {
      Alert.remove('canStream');

      $log.debug('rdio.track.key', newVal, oldVal);
      if (newVal === oldVal) {
        return;
      }

      $log.debug('rdio.track', $scope.rdio.track);

      // Signal that the track is finished
      if (!newVal) {
        $scope.playing = null;

        // If we're the current controller, tell the server we finished
        if (oldVal && $scope.isCurrentController) {
          $scope.trackFinished(oldVal);
        }

        return;
      }

      // Skip auto play tracks from Rdio
      if ($scope.rdio.track.type === 'ap') {
        $scope.playing = null;
        return;
      }

      $scope.playing = {
        track: $scope.rdioToLstn($scope.rdio.track),
        voted: 0,
        upvoted: 0,
        downvoted: 0
      };

      if ($scope.rdio.queued) {
        $scope.playing.voted = $scope.rdio.queued.voted || 0;
        $scope.playing.upvoted = $scope.rdio.queued.upvoted || 0;
        $scope.playing.downvoted = $scope.rdio.queued.downvoted || 0;

        // Clear the rdio queued variable
        $scope.rdio.queued = null;
      }

      if ('vote' in $localStorage) {
        if (newVal in $localStorage.vote && $localStorage.vote[newVal].expires > Date.now()) {
          $scope.playing.voted = true;
          $scope.playing.upvoted = $localStorage.vote[newVal].type === 'upvote';
          $scope.playing.downvoted = !$scope.playing.upvoted;
        } else {
          delete $localStorage.vote;
        }
      }

      if (!$scope.rdio.track.canStream) {
        Alert.error('Streaming for this track is unavailable in your area', 'canStream');
        return;
      }
    });

    promises.getRoom = Room.get({
      id: $routeParams.id
    }, function(response) {
      $scope.queue.loading = false;

      if (!response || !response.success || !response.room) {
        Alert.error('Something went wrong while trying to load the room data.');
        return;
      }

      $scope.room.update(response.room);

      if (response.queue) {
        $scope.queue.tracks = response.queue;
      }

      if (response.favorites) {
        angular.forEach(response.favorites, function(favorite) {
          $scope.favorites.bitset[favorite] = true;
        });
      }

      socket.registerRoom($scope.room.id, $scope.current_user);
      $scope.rdio.init($scope, response.playback);

      timeouts.flashCheck = $timeout(function() {
        if ($scope.rdio.flash === false) {
          Alert.error('Flash doesn\'t appear to be enabled. Make sure it\'s installed and you\'ve enabled it.');
        }
      }, 5000);
    }, function(response) {
      Alert.error('Something went wrong while trying to load the room data.');
    });
  }
])

.controller('ProfileController', ['$scope', '$modalInstance', function($scope, $modalInstance) {
  $scope.settings = $scope.current_user.settings || {};

  $scope.settings.queue = $scope.settings.queue || {};
  $scope.settings.queue.behavior = $scope.settings.queue.behavior || 'bottom';

  $scope.settings.chat = $scope.settings.chat || {};
  $scope.settings.chat.joinleave = $scope.settings.chat.joinleave || 'show';
  $scope.settings.chat.emoticons = $scope.settings.chat.emoticons || 'keep';

  $scope.ok = function() {
    $modalInstance.close($scope.settings);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };
}])

.controller('UserController', ['$scope', function($scope) {
}]);

})();
