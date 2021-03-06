(function() {
'use strict';

angular.module('lstn', [
  'ngRoute',
  'ngSanitize',
  'ui.bootstrap',
  'ui.sortable',
  'btford.socket-io',
  'mentio',
  'linkify',
  'matchMedia',
  'ngStorage',
  'lstn.config',
  'lstn.services',
  'lstn.controllers',
  'lstn.filters',
  'lstn.directives',
  'lstn.templates'
])

.config(['$routeProvider', '$locationProvider', '$logProvider', function($routeProvider, $locationProvider, $logProvider) {
  var routes = {
    '/': {
      templateUrl: '/static/partials/index.html',
      controller: 'AppController',
      controllerAs: 'appCtrl'
    },
    '/rooms': {
      templateUrl: '/static/partials/rooms.html',
      controller: 'RoomsController',
      controllerAs: 'roomsCtrl'
    },
    '/room/:id': {
      templateUrl: '/static/partials/room.html',
      controller: 'RoomController',
      controllerAs: 'roomCtrl'
    }
  };

  for (var path in routes) {
    $routeProvider.when(path, routes[path]);
  }

  $routeProvider.otherwise({
    redirectTo: '/'
  });

  $locationProvider.html5Mode(true);

  $logProvider.debugEnabled(true);

  emojione.imageType = 'svg';
  emojione.sprites = true;
  emojione.imagePathSVGSprites = '/bower_components/emojione/assets/sprites/emojione.sprites.svg';
}])

.run(['$rootScope', function($rootScope) {
  // Publish the user on the root scope.
  var user = document.getElementById('user');
  if (user) {
    user = angular.element(user);
    $rootScope.current_user = angular.fromJson(user.html());
  }

  // Turn on debugging for SocketIO
  /*
  if (window.localStorage) {
    window.localStorage.debug = '*';
  }
  */
}]);

})();
