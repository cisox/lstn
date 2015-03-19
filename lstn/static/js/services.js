(function() {
'use strict';

angular.module('lstn.services', ['mm.emoji.util', 'ngResource'])

.factory('Promise', [function() {
  var Promise = {};
  Promise.cancel = function(promise) {
    if (promise &&
      promise._httpTimeout &&
      promise._httpTimeout.resolve) {

      promise._httpTimeout.resolve();
    }
  };

  return Promise;
}])

.factory('Alert', [
  function() {
    var Alert = {};

    Alert.success = function(message, id) {
      this.add(message, 'success');
    };

    Alert.info = function(message, id) {
      this.add(message, 'info');
    };

    Alert.warning = function(message, id) {
      this.add(message, 'warning');
    };

    Alert.error = function(message, id) {
      this.add(message, 'error', id);
    };

    Alert.add = function(message, type, id) {
      type = type || 'info';

      var options = {
        content: message,
        style: 'snackbar--' + type,
        timeout: 0
      };

      if (id) {
        Alert.remove(id);
        options.id = id;
      }

      $.snackbar(options);
    };

    Alert.remove = function(id) {
      $('#' + id).snackbar('hide');
    };

    Alert.clear = function() {
      $('.snackbar').each(function() {
        $(this).snackbar('hide');
      });
    };

    return Alert;
  }
])

.factory('Favorite', ['CurrentUser', 'Alert',
  function(CurrentUser, Alert) {
    var Favorite = {
      bitset: []
    };

    Favorite.addTrack = function(track) {
      track.loading = true;

      return CurrentUser.addToFavorites({
        id: track.key
      }, function(response) {
        track.loading = false;
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to add the track to your favorites.');
          return;
        }

        Favorite.bitset[track.key] = true;
      }, function(response) {
        track.loading = false;
        Alert.error('Something went wrong while trying to add the track to your favorites.');
      }).$promise;
    };

    Favorite.removeTrack = function(track) {
      track.loading = true;

      return CurrentUser.removeFromFavorites({
        id: track.key
      }, function(response) {
        track.loading = false;
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to remove the track from your favorites.');
          return;
        }

        delete Favorite.bitset[track.key];
      }, function(response) {
        track.loading = false;
        Alert.error('Something went wrong while trying to remove the track from your favorites.');
      }).$promise;
    };

    return Favorite;
  }
])

.factory('Queue', ['CurrentUser', 'Alert',
  function(CurrentUser, Alert) {
    var Queue = {
      bitset: '',
      tracks: [],
      shuffle: false,
      loading: true
    };

    Queue.addTracks = function(tracks, position) {
      return CurrentUser.addToQueue({
        tracks: tracks
      }, function(response) {
        if (!response || !response.success || !response.queue) {
          Alert.error('Something went wrong while trying to add the tracks to your queue.');
          return;
        }

        Queue.tracks = response.queue;

        if (position === 'top') {
          Queue.moveToTop(Queue.tracks.length - tracks.length, tracks.length);
        }
      }, function(response) {
        Alert.error('Something went wrong while trying to add the track to your queue.');
      }).$promise;
    };

    Queue.addTrack = function(track, position) {
      track.loading = true;

      return CurrentUser.addToQueue({
        id: track.key
      }, function(response) {
        track.loading = false;
        if (!response || !response.success || !response.queue) {
          Alert.error('Something went wrong while trying to add the track to your queue.');
          return;
        }

        Queue.tracks = response.queue;

        if (position === 'top') {
          Queue.moveToTop(Queue.tracks.length - 1);
        }
      }, function(response) {
        track.loading = false;
        Alert.error('Something went wrong while trying to add the track to your queue.');
      }).$promise;
    };

    Queue.removeTrack = function(track, index) {
      track.loading = true;

      return CurrentUser.removeFromQueue({
        id: track.key,
        index: index
      }, function(response) {
        track.loading = false;
        if (!response || !response.success || !response.queue) {
          Alert.error('Something went wrong while trying to remove the track from your queue.');
          return;
        }

        Queue.tracks = response.queue;
      }, function(response) {
        track.loading = false;
        Alert.error('Something went wrong while trying to remove the track from your queue.');
      }).$promise;
    };

    Queue.moveToTop = function(index, length) {
      length = length || 1;

      var tracks = Queue.tracks.splice(index, length);
      if (!tracks || tracks.length === 0) {
        Alert.error('Something went wrong while trying to move the track to the top of your queue.');
        return;
      }

      // Add the splice arguments to the front of the track list
      tracks.splice(0, 0, 0, 0);

      // Add the tracks to the top of the queue
      Array.prototype.splice.apply(Queue.tracks, tracks);

      return CurrentUser.updateQueue({
        queue: Queue.tracks
      }, function(response) {
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to move the track to the top of your queue.');
          return;
        }
      }, function(response) {
        Alert.error('Something went wrong while trying to move the track to the top of your queue.');
      }).$promise;
    };

    Queue.moveToBottom = function(index) {
      var tracks = Queue.tracks.splice(index, 1);
      if (!tracks || tracks.length === 0) {
        Alert.error('Something went wrong while trying to move the track to the bottom of your queue.');
        return;
      }

      Queue.tracks.push(tracks[0]);

      return CurrentUser.updateQueue({
        queue: Queue.tracks
      }, function(response) {
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to move the track to the bottom of your queue.');
          return;
        }
      }, function(response) {
        Alert.error('Something went wrong while trying to move the track to the bottom of your queue.');
      }).$promise;
    };

    Queue.toggleShuffle = function() {
      Queue.shuffle = !Queue.shuffle;
    };

    Queue.clearTracks = function() {
      if (!confirm('Are you sure you want to clear your queue?')) {
        return;
      }

      Queue.tracks = [];

      return CurrentUser.clearQueue({
        queue: Queue.tracks
      }, function(response) {
        if (!response || !response.success) {
          Alert.error('Something went wrong while trying to clear your queue.');
          return;
        }
      }, function(response) {
        Alert.error('Something went wrong while trying to clear your queue.');
      }).$promise;
    };

    return Queue;
  }
])

.factory('Rdio', ['Alert', '$log',
  function(Alert, $log) {
    var Rdio = {
      scope: null,
      api: null,
      state: 0,
      ready: false,
      flash: false,
      muted: false,
      user: null,
      queued: null,

      init: function(scope, playbackToken) {
        Rdio.scope = scope;

        Rdio.api = $('#api');
        if (!Rdio.api) {
          return;
        }

        Rdio.api.bind('ready.rdio', function(e, user) {
          $log.debug('ready.rdio', user);

          Rdio.scope.$evalAsync(function() {
            Rdio.flash = true;
            Rdio.ready = true;
            Rdio.user = user;
          });
        });

        Rdio.api.bind('freeRemainingChanged.rdio', function(e, remaining) {
          Alert.info('You have ' + remaining + ' remaining tracks left on your free account.');
        });

        Rdio.api.bind('playStateChanged.rdio', function(e, state) {
          Rdio.scope.$evalAsync(function() {
            Rdio.state = state;
          });
        });

        Rdio.api.bind('playingTrackChanged.rdio', function(e, track, position) {
          $log.debug('playingTrackChanged.rdio', track, position);
          Rdio.scope.$evalAsync(function() {
            Rdio.track = track;
            Rdio.position = position;
          });
        });

        Rdio.api.bind('positionChanged.rdio', function(e, position) {
          $log.debug('positionChanged.rdio', position);
          window.playingPosition = position || 0;

          var progressBar = $('#progress');

          var duration = parseInt(progressBar.attr('data-duration'), 10);
          duration = isNaN(duration) ? 0 : duration;

          var currentValue = parseInt(position, 10);
          currentValue = isNaN(currentValue) ? 0 : currentValue;

          var percentage = 0;
          if (duration > 0) {
            percentage = Math.ceil((currentValue / duration) * 100);
            percentage = isNaN(percentage) ? 0 : Math.min(100, percentage);
          }

          var currentSeconds = currentValue % 60;
          var currentMinutes = (currentValue - currentSeconds) / 60;

          var maxSeconds = duration % 60;
          var maxMinutes = (duration - maxSeconds) / 60;

          var time = currentMinutes + ':';
          time += (currentSeconds < 10) ? '0' + currentSeconds : currentSeconds;
          time += ' / ' + maxMinutes + ':';
          time += (maxSeconds < 10) ? '0' + maxSeconds : maxSeconds;

          $('#time').html(time);

          progressBar.attr('aria-valuenow', currentValue);
          progressBar.css('width', percentage + '%');
        });

        Rdio.api.bind('playingSomewhereElse.rdio', function() {
          Alert.error("You're playing music from a different source. Rdio only allows one source to play music at a time.");
        });

        // playingSourceChanged.rdio
        // volumeChanged.rdio
        // muteChanged.rdio
        // queueChanged.rdio
        // shuffleChanged.rdio
        // repeatChanged.rdio
        // updateFrequencyData.rdio

        Rdio.api.rdio(playbackToken);
      },
      play: function(track, config) {
        if (!Rdio.api || !Rdio.ready) {
          return;
        }

        Rdio.api.rdio().play(track, config);
      },
      stop: function() {
        if (!Rdio.api) {
          return;
        }

        Rdio.api.rdio().stop();
      },
      mute: function() {
        Rdio.muted = !Rdio.muted;

        if (!Rdio.api) {
          return;
        }

        Rdio.api.rdio().setMute(Rdio.muted);

        if (!Rdio.muted) {
          Rdio.volume(0.7);
        }
      },
      volume: function(volume) {
        if (!Rdio.api) {
          return;
        }

        Rdio.api.rdio().setVolume(volume);
      }
    };

    return Rdio;
  }
])

.factory('Preview', [
  function() {
    var Preview = {
      enabled: false,
      context: null
    };

    Preview.init = function() {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        Preview.context = new AudioContext();

        Preview.enabled = true;
      } catch(e) {
        Preview.enabled = false;
      }
    };

    Preview.play = function(url) {
      console.log('Preview.play', url, Preview);
      if (!url || !Preview.enabled || !Preview.context) {
        return;
      }

      console.log('ready to play');

      // Stop the current sound
      if (Preview.source) {
        console.log('has source');
        if (!Preview.source.stop) {
          Preview.source.noteOff(0);
        } else {
          Preview.source.stop(0);
        }
      }

      // Fetch the current sound
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      request.onload = function() {
        // Decode the audio data
        Preview.context.decodeAudioData(request.response, function(buffer) {
          // Setup the sound source
          Preview.source = Preview.context.createBufferSource();
          Preview.source.buffer = buffer;
          Preview.source.connect(context.destination);

          if (!Preview.source.start) {
            Preview.source.noteOn(0);
          } else {
            Preview.source.start(0);
          }
        });
      };

      request.send();
    };

    return Preview;
  }
])

.factory('socket', ['config', 'socketFactory', 'emojiToUnicodeFilter', function(config, socketFactory, emojiToUnicodeFilter) {
  var ioSocket = io.connect(config.WS_URL);
  var socket = socketFactory({
    ioSocket: ioSocket
  });

  socket.releaseControl = function(id, user) {
    this.emit('room:controller:release');
  };

  socket.requestControl = function(id, user) {
    this.emit('room:controller:request');
  };

  socket.roomConnect = function(id, user) {
    this.emit('room:connect', {
      id: id,
      user: user
    });
  };

  socket.roomUpdate = function(user) {
    this.emit('room:update', user);
  };

  socket.registerRoom = function(id, user) {
    this.roomConnect(id, user);
  };

  socket.updatePosition = function(position) {
    this.emit('room:controller:playing:position', position);
  };

  socket.sendFinished = function() {
    this.emit('room:controller:playing:finished');
  };

  socket.sendSkipped = function(reason) {
    var type = 'room:controller:playing:skipped';
    if (reason) {
      type += ':' + reason;
    }

    this.emit(type);
  };

  socket.sendUpvote = function() {
    this.emit('room:controller:upvote');
  };

  socket.sendDownvote = function() {
    this.emit('room:controller:downvote');
  };

  socket.sendMessage = function(message) {
    message.text = emojiToUnicodeFilter(message.text);
    message.created = moment().format();
    this.emit('room:chat:message', message);
  };

  return socket;
}])

.factory('CurrentRoom', [
  function() {
    var Room = {
      id: 0,
      name: null,
      slug: null,
      regions: ['US', 'CA']
    };

    var regionListeners = {};
    
    Room.update = function(room) {
      $.extend(this, this, room);
    };

    Room.clear = function() {
      this.id = 0;
      this.name = null;
      this.slug = null;
      this.regions = ['US', 'CA'];
    };

    Room.setRegions = function(regions) {
      regions = regions || [];
      
      // Always set US and CA
      regions.push('US');
      regions.push('CA');

      this.regions = regions;

      Object.keys(regionListeners).forEach(function(id) {
        regionListeners[id]();
      });
    };

    Room.addRegionListener = function(id, callback) {
      regionListeners[id] = callback;
    };

    Room.removeRegionListener = function(id) {
      if (!(id in regionListeners)) {
        return;
      }

      delete regionListeners[id];
    };

    return Room;
  }
])

.factory('Room', ['$resource', function($resource) {
  var Room = $resource('/api/room/:id/:action/:target', {
    id: '@id',
    target: '@target'
  },{
    list: {
      method: 'GET'
    },
    roster: {
      method: 'GET',
      params: {
        action: 'roster'
      }
    },
    update: {
      method: 'PUT'
    }
  });

  return Room;
}])

.factory('User', ['$resource', function($resource) {
  return $resource('/api/user/:id/:action/:argument', {
    id: '@id'
  },{
    upvote: {
      method: 'POST',
      params: {
        action: 'vote',
        argument: 'upvote'
      }
    },
    downvote: {
      method: 'POST',
      params: {
        action: 'vote',
        argument: 'downvote'
      }
    }
  });
}])

.factory('AuthUser', [
  function() {
    var AuthUser = {};

    AuthUser.update = function(user) {
      $.extend(this, this, this, user);
    };

    AuthUser.getCollectionKey = function() {
      if (!AuthUser.external_id) {
        return null;
      }

      var id = AuthUser.external_id.replace(/\D/g, '');
      if (!id) {
        return null;
      }

      return 'c' + id;
    };

    AuthUser.getHeavyRotationKey = function() {
      if (!AuthUser.external_id) {
        return null;
      }

      var id = AuthUser.external_id.replace(/\D/g, '');
      if (!id) {
        return null;
      }

      return 'e' + id;
    };

    return AuthUser;
  }
])

.factory('CurrentUser', ['$resource', function($resource) {
  var CurrentUser = $resource('/api/user/:action/:id', {
    id: '@id'
  },{
    playlists: {
      method: 'GET',
      params: {
        action: 'playlists'
      }
    },
    stations: {
      method: 'GET',
      params: {
        action: 'stations'
      }
    },
    favorites: {
      method: 'GET',
      params: {
        action: 'favorites'
      }
    },
    collection: {
      method: 'GET',
      params: {
        action: 'collection'
      }
    },
    addToFavorites: {
      method: 'POST',
      params: {
        action: 'favorites'
      }
    },
    removeFromFavorites: {
      method: 'DELETE',
      params: {
        action: 'favorites'
      }
    },
    addToQueue: {
      method: 'POST',
      params: {
        action: 'queue'
      }
    },
    removeFromQueue: {
      method: 'DELETE',
      params: {
        action: 'queue'
      }
    },
    updateQueue: {
      method: 'PUT',
      params: {
        action: 'queue'
      }
    },
    clearQueue: {
      method: 'DELETE',
      params: {
        action: 'queue'
      }
    },
    search: {
      method: 'GET',
      params: {
        action: 'search'
      }
    },
    settings: {
      method: 'POST',
      params: {
        action: 'settings'
      }
    }
  });

  CurrentUser.getPlaylists = function(type) {
    return CurrentUser.playlists({
      id: type
    }).$promise;
  };

  CurrentUser.getStations = function(type, genre) {
    var data = {
      id: type
    };

    if (genre) {
      data.genre = genre;
    }
    
    return CurrentUser.stations(data).$promise;
  };

  CurrentUser.getFavorites = function(type) {
    return CurrentUser.favorites({
      id: type
    }).$promise;
  };

  CurrentUser.getCollection = function() {
    return CurrentUser.collection().$promise;
  };

  return CurrentUser;
}])

.factory('Playlist', ['$resource',
  function($resource) {
    var Playlist = $resource('/api/playlist/:id/:action', {
      id: '@id'
    },{
      tracks: {
        method: 'GET',
        params: {
          action: 'tracks'
        }
      }
    });

    Playlist.getTracks = function(playlist) {
      return this.tracks({
        id: playlist
      }).$promise;
    };

    return Playlist;
  }
])

.factory('Artist', ['$resource', function($resource) {
  var Artist = $resource('/api/artist/:id/:action/:type', {
    id: '@id'
  },{
    albums: {
      method: 'GET',
      params: {
        action: 'albums',
        type: '@collection'
      }
    }
  });

  Artist.getAlbums = function(artistId, type) {
    return Artist.albums({
      id: artistId,
      type: type
    }).$promise;
  };

  return Artist;
}])

.factory('Album', ['$resource', function($resource) {
  var Album = $resource('/api/album/:id/:action/:type', {
    id: '@id'
  },{
    tracks: {
      method: 'GET',
      params: {
        action: 'tracks',
        type: '@collection'
      }
    }
  });

  Album.getTracks = function(artistId, type) {
    return this.tracks({
      id: artistId,
      type: type
    }).$promise;
  };

  return Album;
}])

.factory('Station', ['$resource', function($resource) {
  var Station = $resource('/api/station/:id/:action', {
    id: '@id'
  },{
    tracks: {
      method: 'GET',
      params: {
        action: 'tracks'
      }
    }
  });

  Station.getTracks = function(station) {
    return this.tracks({
      id: station
    }).$promise;
  };

  return Station;
}])

.constant('RdioType', {
  a: 'album', // Album
  c: 'station', // UserCollectionStation
  e: 'station', // HeavyRotationUserStation
  h: 'station', // HeavyRotationStation
  l: 'label', // Label
  p: 'playlist', // Playlist
  r: 'artist', // Artist
  t: 'track', // Track
  al: 'collectionAlbum', // CollectionAlbum
  ap: 'station', // AutoplayStation
  tp: 'station', // TasteProfileStation
  ar: 'station', // AlbumStation
  gr: 'station', // GenreStation
  lr: 'station', // LabelStation
  pr: 'station', // PlaylistStation
  rl: 'collectionArtist', // CollectionArtist
  rr: 'station', // ArtistStation
  sr: 'station', // SongStation
  tr: 'station', // ArtistTopSongsStation
})

.constant('RdioName', {
  a: 'Album', // Album
  c: 'Station', // UserCollectionStation
  e: 'Station', // HeavyRotationUserStation
  h: 'Station', // HeavyRotationStation
  l: 'Label', // Label
  p: 'Playlist', // Playlist
  r: 'Artist', // Artist
  t: 'Track', // Track
  al: 'Album', // CollectionAlbum
  ap: 'Station', // AutoplayStation
  tp: 'Station', // TasteProfileStation
  ar: 'Station', // AlbumStation
  gr: 'Station', // GenreStation
  lr: 'Station', // LabelStation
  pr: 'Station', // PlaylistStation
  rl: 'Artist', // CollectionArtist
  rr: 'Station', // ArtistStation
  sr: 'Station', // SongStation
  tr: 'Station', // ArtistTopSongsStation
})

.constant('Category', {
  playlists: ['Playlists', true],
  stations: ['Stations', true],
  favorites: ['Favorites', false],
  collection: ['Collection', false]
})

.constant('PlaylistType', {
  owned: ['Your Playlists', false],
  collab: ['Collaborative Playlists', false],
  favorites: ['Favorited Playlists', false]
})

.constant('StationType', {
  you: ['Your Stations', false],
  friends: ["Friend's Stations", false],
  recent: ['Recent Stations', false],
  genre: ['Genre Stations', true, 'genre'],
  collection: ['Collection Station', false, 'station'],
  heavyRotation: ['Heavy Rotation Station', false, 'station']
})

.constant('Genre', {
  Reggae: ['Reggae', false],
  Rock: ['Rock', false],
  Latin: ['Latin', false],
  Christian_Gospel: ['Christian Gospel', false],
  World: ['World', false],
  Classical: ['Classical', false],
  Dance: ['Dance', false],
  Country: ['Country', false],
  Songwriters_Folk: ['Songwriters/Folk', false],
  Jazz: ['Jazz', false],
  Pop: ['Pop', false],
  Indie: ['Indie', false],
  R_and_B: ['R&B', false],
  Hip_Hop: ['Hip Hop', false],
  Alternative: ['Alternative', false],
  Holiday: ['Holiday', false],
  Electronic: ['Electronic', false],
  Blues: ['Blues', false],
  More: ['More', false]
})

.factory('Loader', ['$q', 'Alert', 'AuthUser', 'CurrentUser', 'RdioType', 'Category', 'PlaylistType', 'Playlist', 'StationType', 'Station', 'Artist', 'Album', 'Genre', '$sessionStorage',
  function($q, Alert, AuthUser, CurrentUser, RdioType, Category, PlaylistType, Playlist, StationType, Station, Artist, Album, Genre, $sessionStorage) {
    var Loader = {
      skipCache: ['station', 'search', 'favorites'],
      toResponse: function(object, type) {
        var data = [];

        angular.forEach(object, function(data, key) {
          this.push({
            key: key,
            name: data[0],
            type: data[2] || type,
            constant: data[1],
          });
        }, data);

        return {
          success: true,
          data: data
        };
      },
      search: function(query) {
        if (!query || query.length < 3) {
          var deferred = $q.defer();
          deferred.resolve(Loader.toResponse([], 'searchResult'));
          return deferred.promise;
        }

        return CurrentUser.search({
          query: query
        }).$promise;
      },
      music: function(key) {
        var deferred = $q.defer();
        deferred.resolve(Loader.toResponse(Category, 'category'));
        return deferred.promise;
      },
      genre: function(key) {
        var deferred = $q.defer();
        deferred.resolve(Loader.toResponse(Genre, 'genreStationType'));
        return deferred.promise;
      },
      genreStationType: function(key) {
        return CurrentUser.getStations('genre', key);
      },
      category: function(key) {
        var deferred = $q.defer();

        if (key === 'playlists') {
          deferred.resolve(Loader.toResponse(PlaylistType, 'playlistType'));
        } else if (key === 'stations') {
          deferred.resolve(Loader.toResponse(StationType, 'stationType'));
        } else if (key === 'favorites') {
          return CurrentUser.getFavorites();
        } else if (key === 'collection') {
          return CurrentUser.getCollection();
        } else {
          deferred.reject('Category not found');
        }

        return deferred.promise;
      },
      playlistType: function(key) {
        return CurrentUser.getPlaylists(key);
      },
      playlist: function(key) {
        return Playlist.getTracks(key);
      },
      stationType: function(key) {
        return CurrentUser.getStations(key);
      },
      station: function(key) {
        if (key === 'collection') {
          key = AuthUser.getCollectionKey();
        } else if (key === 'heavyRotation') {
          key = AuthUser.getHeavyRotationKey();
        }

        if (!key) {
          var deferred = $q.defer();
          deferred.reject('Station not found');
          return deferred.promise;
        }

        return Station.getTracks(key);
      },
      artist: function(key) {
        return Artist.getAlbums(key);
      },
      album: function(key) {
        return Album.getTracks(key);
      },
      collectionArtist: function(key) {
        return Artist.getAlbums(key, 'collection');
      },
      collectionAlbum: function(key) {
        return Album.getTracks(key, 'collection');
      }
    };

    Loader.load = function(item, refresh) {
      if (!item) {
        return null;
      }

      if (!item.type || !item.key) {
        Alert.error('Something went wrong while trying to load ' + item.name);
        return null;
      }

      var type = item.type;
      if (item.type in RdioType) {
        type = RdioType[item.type];
      }
      
      if (!(type in Loader)) {
        Alert.error('Something went wrong while trying to load ' + item.name);
        return null;
      }

      /*
      var loaderKey = 'loader-' + type;

      if (!refresh &&
          this.skipCache.indexOf(type) === -1 &&
          $sessionStorage &&
          loaderKey in $sessionStorage && item.key in $sessionStorage[loaderKey] &&
          ($sessionStorage[loaderKey][item.key].cached + (60 * 60 * 12)) > Date.now()) {

        var deferred = $q.defer();
        deferred.resolve($sessionStorage[loaderKey][item.key]);
        return deferred.promise;
      }
      */

      var promise = Loader[type](item.key, refresh);
      /*
      promise.then(function(response) {
        if (!response ||
          !response.success ||
          !response.data ||
          !$sessionStorage ||
          Loader.skipCache.indexOf(type) !== -1) {

          var deferred = $q.defer();
          deferred.reject(response);
          return deferred.promise;
        }

        if (!(loaderKey in $sessionStorage)) {
          $sessionStorage[loaderKey] = {};
        }

        response.cached = Date.now();
        $sessionStorage[loaderKey][item.key] = response;
      });
      */

      return promise;
    };

    return Loader;
  }
]);

})();
