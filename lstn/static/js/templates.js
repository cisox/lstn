angular.module('lstn.templates', []).run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/static/partials/directives/carousel.html',
    "<div class=\"lstn-carousel\">\n" +
    "  <div class=\"slide__wrapper\">\n" +
    "    <ul class=\"slides\">\n" +
    "      <li class=\"slide__container\" data-ng-repeat=\"slide in slides\">\n" +
    "        <lstn-slide\n" +
    "          data-load=\"load\"\n" +
    "          data-close=\"close\"\n" +
    "          data-current=\"slide\"\n" +
    "          data-context=\"context\"></lstn-slide>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/chat-message.html',
    "<div id=\"message-{{ $id }}\" class=\"chat__message\" data-ng-class=\"getMessageClass()\">\n" +
    "  <div class=\"chat__image item__image\">\n" +
    "    <img data-ng-src=\"{{ message.user.picture }}\" src=\"/images/no-image.png\" />\n" +
    "    <div class=\"item__image__overlay\"></div>\n" +
    "    <i class=\"fa item__image__overlay__icon\" data-ng-class=\"getOverlayClass()\"></i>\n" +
    "  </div>\n" +
    "  <div class=\"chat__user-info item__info\">\n" +
    "    <div class=\"item__title\">\n" +
    "      <span class=\"chat__message__user\" data-ng-bind=\"message.user.name\"></span>&nbsp;\n" +
    "      <span data-ng-switch=\"message.type\" class=\"chat__message__message-type\">\n" +
    "        <span class=\"chat__message--playing\" data-ng-switch-when=\"playing\">started playing</span>\n" +
    "        <span class=\"chat__message--upvoted\" data-ng-switch-when=\"upvote\">upvoted</span>\n" +
    "        <span class=\"chat__message--downvoted\" data-ng-switch-when=\"downvote\">downvoted</span>\n" +
    "        <span class=\"chat__message--skipped\" data-ng-switch-when=\"skipped\">skipped</span>\n" +
    "        <span class=\"chat__message--skipped\" data-ng-switch-when=\"skipped:downvoted\">skipped (downvoted)</span>\n" +
    "        <span class=\"chat__message--message\" data-ng-switch-when=\"message\">said</span>\n" +
    "        <span class=\"chat__message--disconnect\" data-ng-switch-when=\"disconnect\">left the room</span>\n" +
    "        <span class=\"chat__message--connect\" data-ng-switch-when=\"connect\">joined the room</span>\n" +
    "      </span>\n" +
    "      <div class=\"chat__timestamp text-muted\" data-time-from-now=\"message.created\"></div>\n" +
    "    </div>\n" +
    "    <div class=\"chat__message__message\" data-ng-if=\"message.type === 'message'\">\n" +
    "      <div class=\"wordwrap\" data-ng-bind-html=\"message.text|linkify|emojione\"></div>\n" +
    "    </div>\n" +
    "    <div class=\"chat__track-info text-muted\" data-ng-if=\"message.type !== 'message'\">\n" +
    "      <div class=\"chat__track text-truncate\">\n" +
    "        <a data-ng-href=\"http://rdio.com{{ message.track.url }}\" data-ng-bind=\"message.track.name\" target=\"_blank\"></a>\n" +
    "      </div>\n" +
    "      <div class=\"chat__artist text-truncate\">\n" +
    "        <a data-ng-href=\"http://rdio.com{{ message.track.artistUrl }}\" data-ng-bind=\"message.track.artist\" target=\"_blank\"></a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/drilldown-back.html',
    "<div class=\"carousel__back text-left\">\n" +
    "  <a data-ng-click=\"clickHandler()\">\n" +
    "    <i class=\"fa fa-fw fa-chevron-left\"></i><span data-ng-bind=\"current.name\" data-tooltip=\"Back\" data-tooltip-placement=\"right\"></span>\n" +
    "  </a>\n" +
    "\n" +
    "  <div class=\"pull-right\">\n" +
    "    <a data-ng-click=\"refreshHandler()\" class=\"carousel__action\" data-ng-show=\"!showMenu() && !current.loading && !current.constant\">\n" +
    "      <i class=\"fa fa-fw fa-refresh fa-lg\"></i>\n" +
    "    </a>\n" +
    "\n" +
    "    <span class=\"dropdown\" data-dropdown data-is-open=\"status.open\">\n" +
    "      <a\n" +
    "        class=\"fa fa-fw fa-ellipsis-v carousel__action\"\n" +
    "        data-ng-hide=\"current.loading || !showMenu()\"\n" +
    "        data-ng-click=\"toggleDropdown($event)\"></a>\n" +
    "      <ul class=\"dropdown-menu dropdown-menu-right\" role=\"menu\">\n" +
    "        <li>\n" +
    "          <a data-ng-click=\"bulkAddHandler(current.keys, 'top')\">\n" +
    "            <i class=\"fa fa-fw fa-plus-circle carousel__dropdown--add\"></i>\n" +
    "            Add All to Top of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li>\n" +
    "          <a data-ng-click=\"bulkAddHandler(current.keys)\">\n" +
    "            <i class=\"fa fa-fw fa-plus-circle carousel__dropdown--add\"></i>\n" +
    "            Add All to Bottom of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li class=\"divider\"></li>\n" +
    "        <li>\n" +
    "          <a data-ng-click=\"refreshHandler()\" data-ng-show=\"refreshHandler\">\n" +
    "            <i class=\"fa fa-fw fa-refresh carousel__dropdown--refresh\"></i>\n" +
    "            Refresh {{ name }}\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </span>\n" +
    "    <i\n" +
    "      class=\"fa fa-fw fa-circle-o-notch fa-spin fa-lg carousel__action\"\n" +
    "      data-ng-show=\"current.loading\"\n" +
    "      data-tooltip=\"Refreshing\"\n" +
    "      data-tooltip-placement=\"left\"></i>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/drilldown-item.html',
    "<div id=\"generic{{ $id }}\" class=\"drilldown__item generic\">\n" +
    "  <div class=\"item__image\">\n" +
    "    <span data-ng-if=\"!content.icon\">\n" +
    "      <i class=\"fa fa-fw fa-music fa-3x\"></i>\n" +
    "    </span>\n" +
    "    <span data-ng-if=\"content.icon\">\n" +
    "      <img data-ng-src=\"{{ content.icon }}\" alt=\"{{ content.name }}\">\n" +
    "      <div class=\"item__image__overlay\" data-ng-if=\"favorites.bitset[content.key]\"></div>\n" +
    "      <i class=\"fa fa-heart item__image__overlay__icon item__image__overlay__icon--favorite\" data-ng-if=\"favorites.bitset[content.key]\"></i>\n" +
    "    </span>\n" +
    "  </div>\n" +
    "  <div class=\"item__info\">\n" +
    "    <div\n" +
    "      class=\"item__title\"\n" +
    "      data-ng-class=\"className\"\n" +
    "      data-ng-bind=\"content.name\"></div>\n" +
    "    <div\n" +
    "      class=\"item__artist\"\n" +
    "      data-ng-if=\"content.artist\"\n" +
    "      data-ng-bind=\"content.artist\"></div>\n" +
    "    <div\n" +
    "      class=\"item__count\"\n" +
    "      data-ng-if=\"content.albumCount\"\n" +
    "      data-ng-pluralize\n" +
    "      count=\"content.albumCount\"\n" +
    "      when=\"{'one': '{} album', 'other': '{} albums'}\"></div>\n" +
    "    <div\n" +
    "      class=\"item__count\"\n" +
    "      data-ng-if=\"content.length\"\n" +
    "      data-ng-pluralize\n" +
    "      count=\"content.length\"\n" +
    "      when=\"{'one': '{} track', 'other': '{} tracks'}\"></div>\n" +
    "  </div>\n" +
    "  <div class=\"item__actions\">\n" +
    "    <a\n" +
    "      class=\"fa fa-fw fa-chevron-right\"\n" +
    "      data-ng-show=\"!content.loading\"\n" +
    "      data-ng-click=\"load(content)\"\n" +
    "      data-tooltip=\"Load\"\n" +
    "      data-tooltip-placement=\"left\"\n" +
    "      data-tooltip-popup-delay=\"1000\"></a>\n" +
    "    <a\n" +
    "      class=\"fa fa-fw fa-circle-o-notch fa-spin\"\n" +
    "      data-ng-show=\"content.loading\"\n" +
    "      data-tooltip=\"Loading\"\n" +
    "      data-tooltip-placement=\"left\"\n" +
    "      data-tooltip-popup-delay=\"1000\"></a>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/emoticon-list.html',
    "<ul class=\"list-group emoticon-list\">\n" +
    "  <li data-mentio-menu-item=\"emoticon\" data-ng-repeat=\"emoticon in items\" class=\"list-group-item\">\n" +
    "    <span tooltip-placement=\"bottom\" tooltip=\"{{ emoticon.text }}\" data-ng-bind-html=\"emoticon.value|emojione\"></span>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('/static/partials/directives/more-music.html',
    "<div class=\"more-music\">\n" +
    "  <div class=\"search__box\">\n" +
    "    <input\n" +
    "      type=\"search\"\n" +
    "      class=\"form-control\"\n" +
    "      data-ng-model=\"searchQuery\"\n" +
    "      placeholder=\"Search music...\">\n" +
    "  </div>\n" +
    "\n" +
    "  <lstn-carousel\n" +
    "    data-context=\"more-music\"\n" +
    "    data-root=\"musicRoot\"\n" +
    "    data-ng-show=\"!searchQuery || searchQuery.length === 0\"\n" +
    "    data-ng-if=\"musicRoot\"></lstn-carousel>\n" +
    "\n" +
    "  <lstn-carousel\n" +
    "    data-context=\"search\"\n" +
    "    data-root=\"searchRoot\"\n" +
    "    data-ng-show=\"searchQuery && searchQuery.length > 0\"\n" +
    "    data-ng-if=\"searchRoot\"></lstn-carousel>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/playing-info.html',
    "<div class=\"playing__info-container\">\n" +
    "\n" +
    "  <div data-ng-hide=\"playing\" class=\"playing__info--stopped\">\n" +
    "    <a data-ng-show=\"queue.tracks.length\" data-ng-click=\"toggleBroadcast()\">\n" +
    "      <i class=\"playing__info--ready fa fa-play-circle\" />\n" +
    "    </a>\n" +
    "    <p class=\"playing__info--waiting\" data-ng-show=\"!queue.tracks.length\">Waiting for a broadcaster&hellip;</p>\n" +
    "  </div>\n" +
    "\n" +
    "  <div data-ng-show=\"playing\" class=\"playing__info playing__info--playing\" data-album-cover-background>\n" +
    "    <div class=\"playing__meta\">\n" +
    "      <h3 class=\"playing__title text-truncate\" data-ng-bind=\"playing.track.title\"></h3>\n" +
    "      <h4 class=\"playing__artist text-truncate\" data-ng-bind=\"playing.track.artist\"></h4>\n" +
    "      <lstn-room-controls></lstn-room-controls>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"progress\" data-ng-show=\"playing.track.duration && playing.track.canStream\">\n" +
    "    <div\n" +
    "      id=\"progress\"\n" +
    "      class=\"progress-bar progress-bar-info progress-bar-striped active\"\n" +
    "      role=\"progressbar\"\n" +
    "      data-duration=\"{{ playing.track.duration }}\"\n" +
    "      aria-valuenow=\"0\"\n" +
    "      aria-valuemin=\"0\"\n" +
    "      aria-valuemax=\"{{ playing.track.duration }}\"></div>\n" +
    "\n" +
    "    <span id=\"time\" class=\"time\"></span>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/room-activity.html',
    "<div class=\"room-activity\">\n" +
    "  <input\n" +
    "    id=\"chat-input-{{ $id }}\"\n" +
    "    type=\"text\"\n" +
    "    placeholder=\"Send message...\"\n" +
    "    data-mentio\n" +
    "    data-ng-trim=\"false\"\n" +
    "    class=\"form-control chat__input\"\n" +
    "    data-ng-show=\"!chat.loading\"\n" +
    "    data-ng-model=\"message.text\"\n" +
    "    data-lstn-enter=\"sendMessage()\"></input>\n" +
    "\n" +
    "  <mentio-menu\n" +
    "    id=\"mention-menu-{{ $id }}\"\n" +
    "    class=\"mention-menu\"\n" +
    "    mentio-for=\"'chat-input-' + $id\"\n" +
    "    mentio-trigger-char=\"'@'\"\n" +
    "    mentio-items=\"mentionNames\"\n" +
    "    mentio-template-url=\"/static/partials/directives/roster-mention.html\"\n" +
    "    mentio-search=\"searchRoster(term)\"\n" +
    "    mentio-select=\"getUser(item)\"></mentio-menu>\n" +
    "\n" +
    "  <mentio-menu\n" +
    "    id=\"emoticon-menu-{{ $id }}\"\n" +
    "    class=\"emoticon-menu\"\n" +
    "    mentio-for=\"'chat-input-' + $id\"\n" +
    "    mentio-trigger-char=\"':'\"\n" +
    "    mentio-items=\"emoticons\"\n" +
    "    mentio-template-url=\"/static/partials/directives/emoticon-list.html\"\n" +
    "    mentio-search=\"searchEmoticons(term)\"\n" +
    "    mentio-select=\"getEmoticon(item)\"></mentio-menu>\n" +
    "\n" +
    "  <ul id=\"messages\" class=\"messages list-group\" data-ng-show=\"!chat.loading && messageCount > 0\">\n" +
    "    <li data-ng-repeat=\"item in chat.messages\" data-ng-show=\"current_user.settings.chat.joinleave === 'show' || (item.type !== 'connect' && item.type !== 'disconnect')\">\n" +
    "      <lstn-chat-message data-message=\"item\"></lstn-chat-message>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <div class=\"messages--empty\" data-ng-show=\"!chat.loading && messageCount === 0\">\n" +
    "    <i class=\"fa fa-comment\"></i>\n" +
    "  </div>\n" +
    "  <div class=\"messages--loading\" data-ng-show=\"chat.loading\">\n" +
    "    <i class=\"fa fa-circle-o-notch fa-spin\"></i>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/room-control-downvote.html',
    "<span>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    data-ng-show=\"!playing.downvoted && !isCurrentController\"\n" +
    "    data-ng-disabled=\"!playing.track.key || playing.track.voted\"\n" +
    "    class=\"control__button btn btn-danger\"\n" +
    "    aria-label=\"Downvote\"\n" +
    "    data-ng-click=\"downvote()\"\n" +
    "    data-tooltip=\"Downvote\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-thumbs-down fa-lg\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    data-ng-show=\"playing.downvoted\"\n" +
    "    disabled=\"disabled\"\n" +
    "    class=\"control__button btn btn-danger\"\n" +
    "    aria-label=\"Downvoted\"\n" +
    "    data-tooltip=\"Downvoted\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-check fa-lg\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "</span>\n"
  );


  $templateCache.put('/static/partials/directives/room-control-favorite.html',
    "<span>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    data-ng-hide=\"favorites.bitset[playing.track.key]\"\n" +
    "    class=\"control__button btn btn-default\"\n" +
    "    aria-label=\"Favorite\"\n" +
    "    data-ng-click=\"favorites.addTrack(playing.track)\"\n" +
    "    data-tooltip=\"Favorite\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-heart-o fa-lg text-danger\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    data-ng-show=\"favorites.bitset[playing.track.key]\"\n" +
    "    class=\"control__button btn btn-default\"\n" +
    "    aria-label=\"Unfavorite\"\n" +
    "    data-ng-click=\"favorites.removeTrack(playing.track)\"\n" +
    "    data-tooltip=\"Unfavorite\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-heart fa-lg text-danger\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "</span>\n"
  );


  $templateCache.put('/static/partials/directives/room-control-skip.html',
    "<span>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    data-ng-show=\"isCurrentController\"\n" +
    "    data-ng-disabled=\"!playing.track.key\"\n" +
    "    class=\"control__button btn btn-danger\"\n" +
    "    aria-label=\"Skip Song\"\n" +
    "    data-ng-click=\"skipTrack()\"\n" +
    "    data-tooltip=\"Skip Song\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <span class=\"fa fa-step-forward fa-lg\" aria-hidden=\"true\"></span>\n" +
    "  </button>\n" +
    "</span>\n"
  );


  $templateCache.put('/static/partials/directives/room-control-upvote.html',
    "<span>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    class=\"control__button btn btn-success\"\n" +
    "    aria-label=\"Upvote\"\n" +
    "    data-ng-if=\"!playing.upvoted && !isCurrentController && playing.track.key\"\n" +
    "    data-ng-click=\"upvote()\"\n" +
    "    data-tooltip=\"Upvote\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-thumbs-up fa-lg\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "  <button\n" +
    "    type=\"button\"\n" +
    "    class=\"control__button btn btn-success\"\n" +
    "    aria-label=\"Upvoted\"\n" +
    "    disabled=\"disabled\"\n" +
    "    data-ng-if=\"playing.upvoted\"\n" +
    "    data-tooltip=\"Upvoted\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-check fa-lg\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "</span>\n"
  );


  $templateCache.put('/static/partials/directives/room-control-volume.html',
    "<span>\n" +
    "  <button\n" +
    "    data-ng-show=\"!rdio.muted\"\n" +
    "    data-ng-disabled=\"!playing.track.key\"\n" +
    "    type=\"button\"\n" +
    "    class=\"control__button btn btn-default\"\n" +
    "    aria-label=\"Mute\"\n" +
    "    data-ng-click=\"rdio.mute()\"\n" +
    "    data-tooltip=\"Mute\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-lg fa-volume-off\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "  <button\n" +
    "    data-ng-show=\"rdio.muted\"\n" +
    "    data-ng-disabled=\"!playing.track.key\"\n" +
    "    type=\"button\"\n" +
    "    class=\"control__button btn btn-default\"\n" +
    "    aria-label=\"Unmute\"\n" +
    "    data-ng-click=\"rdio.mute()\"\n" +
    "    data-tooltip=\"Unmute\"\n" +
    "    data-tooltip-placement=\"bottom\">\n" +
    "    <i class=\"fa fa-lg fa-volume-up\" aria-hidden=\"true\"></i>\n" +
    "  </button>\n" +
    "</span>\n"
  );


  $templateCache.put('/static/partials/directives/room-controls.html',
    "<div class=\"playing__controls\">\n" +
    "  <lstn-room-control-volume></lstn-room-control-volume>\n" +
    "  <lstn-room-control-downvote></lstn-room-control-downvote>\n" +
    "  <lstn-room-control-skip></lstn-room-control-skip>\n" +
    "  <lstn-room-control-upvote></lstn-room-control-upvote>\n" +
    "  <lstn-room-control-favorite></lstn-room-control-favorite>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/room-list.html',
    "<div class=\"rooms__container\">\n" +
    "  <table class=\"table table-striped rooms\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th class=\"name\">Name</th>\n" +
    "        <th class=\"owner\">Owner</th>\n" +
    "        <th>Actions</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr data-ng-show=\"(!rooms || rooms.length === 0) && !showCreateRoom && !loading\" class=\"rooms__empty\">\n" +
    "        <td colspan=\"3\" class=\"text-center\">\n" +
    "          <h3>\n" +
    "            You don't have any rooms yet. <a data-ng-click=\"createRoom()\">Create one</a> now.\n" +
    "          </h3>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "      <tr data-ng-repeat=\"room in rooms\" data-ng-show=\"rooms && rooms.length > 0 && !loading\">\n" +
    "        <td data-ng-show=\"!room.editing\">\n" +
    "          <a data-ng-href=\"/room/{{ room.slug }}\" data-ng-bind=\"room.name\"></a>\n" +
    "          (<span data-ng-bind=\"room.slug\"></span>)\n" +
    "        </td>\n" +
    "        <td data-ng-show=\"room.editing\" class=\"form-inline\">\n" +
    "          <label for=\"room-name\" class=\"sr-only\">Room Name</label>\n" +
    "          <input type=\"text\" id=\"room-name\" data-ng-model=\"room.name\" class=\"form-control input-sm\" placeholder=\"Room Name\" />\n" +
    "        </td>\n" +
    "        <td data-ng-bind=\"room.owner.name\"></div>\n" +
    "        <td data-ng-show=\"!room.editing\">\n" +
    "          <button class=\"btn btn-default btn-xs\" data-ng-click=\"editRoom($index)\">Edit</button>\n" +
    "          <button class=\"btn btn-default btn-xs\" data-ng-click=\"deleteRoom($index)\">Delete</button>\n" +
    "        </td>\n" +
    "        <td data-ng-show=\"room.editing\">\n" +
    "          <button class=\"btn btn-primary btn-xs\" data-ng-click=\"saveEditRoom($index)\">Save</button>\n" +
    "          <button class=\"btn btn-default btn-xs\" data-ng-click=\"cancelEditRoom($index)\">Cancel</button>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "      <tr data-ng-show=\"showCreateRoom\">\n" +
    "        <td class=\"form-inline\">\n" +
    "          <label for=\"room-name\" class=\"sr-only\">Room Name</label>\n" +
    "          <input type=\"text\" id=\"room-name\" data-ng-model=\"newRoom.name\" class=\"form-control input-sm\" placeholder=\"Room Name\" />\n" +
    "        </td>\n" +
    "        <td></td>\n" +
    "        <td>\n" +
    "          <button class=\"btn btn-primary btn-xs\" data-ng-click=\"saveCreateRoom()\">Create</button>\n" +
    "          <button class=\"btn btn-default btn-xs\" data-ng-click=\"cancelCreateRoom()\">Cancel</button>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/room-queue.html',
    "<div class=\"queue__container\">\n" +
    "  <div class=\"queue__controls\" data-ng-show=\"!queue.loading && queue.tracks && queue.tracks.length > 0\">\n" +
    "    <button class=\"btn\" data-ng-click=\"queue.toggleShuffle()\" data-ng-class=\"{'toggled': queue.shuffle}\">\n" +
    "      <i class=\"fa fa-fw fa-random\"></i>\n" +
    "      Shuffle\n" +
    "    </button><!--\n" +
    "    --><button class=\"btn btn-default\" data-ng-click=\"queue.clearTracks()\">\n" +
    "      <i class=\"fa fa-fw fa-times\"></i>\n" +
    "      Clear\n" +
    "    </button>\n" +
    "  </div>\n" +
    "  <ul id=\"queue\" class=\"queue queue--full track__list drilldown__list\" data-ng-show=\"!queue.loading && queue.tracks && queue.tracks.length > 0\" data-ui-sortable=\"sortableOptions\" ng-model=\"queue.tracks\">\n" +
    "    <li data-ng-repeat=\"track in queue.tracks\">\n" +
    "      <lstn-track\n" +
    "        data-track=\"track\"\n" +
    "        data-context=\"queue\"\n" +
    "        data-index=\"$index\"\n" +
    "        data-count=\"queue.tracks.length\"></lstn-track>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <div class=\"queue--empty\" data-ng-show=\"!queue.loading && (!queue.tracks || queue.tracks.length === 0)\">\n" +
    "    <p>Your queue is empty.</p>\n" +
    "    <div><button type=\"button\" class=\"btn btn-active\" data-ng-click=\"selectTab('music')\">Add Music</button></div>\n" +
    "  </div>\n" +
    "  <div class=\"queue--loading\" data-ng-show=\"queue.loading\">\n" +
    "    <i class=\"fa fa-circle-o-notch fa-spin\"></i>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/room-roster.html',
    "<div class=\"roster__container room__container\">\n" +
    "  <div class=\"roster__broadcasting\">\n" +
    "    <div data-ng-show=\"isController\" class=\"broadcasting broadcasting--on\">\n" +
    "      <a data-ng-click=\"toggleBroadcast()\">\n" +
    "        <i class=\"fa fa-microphone-slash\"></i>\n" +
    "        <div class=\"broadcasting-btn\">STOP BROADCASTING</div>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <div data-ng-show=\"!isController\" class=\"broadcasting broadcasting--off\" data-ng-class=\"{'broadcasting--disabled': !queue || !queue.tracks || queue.tracks.length === 0}\">\n" +
    "      <a data-ng-click=\"toggleBroadcast()\" data-ng-if=\"queue && queue.tracks && queue.tracks.length > 0\">\n" +
    "        <i class=\"fa fa-microphone\"></i>\n" +
    "        <div class=\"broadcasting-btn\">START BROADCASTING</div>\n" +
    "      </a>\n" +
    "      <span data-ng-if=\"!queue || !queue.tracks || queue.tracks.length === 0\" data-tooltip=\"You can't broadcast without tracks in your queue\" data-tooltip-placement=\"bottom\">\n" +
    "        <i class=\"fa fa-microphone\"></i>\n" +
    "        <div class=\"broadcasting-btn\">START BROADCASTING</div>\n" +
    "      </span>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"roster__category\">\n" +
    "    <div class=\"roster__category-label\">Broadcasting</div>\n" +
    "    <ul class=\"roster roster--controllers\">\n" +
    "      <li class=\"empty\" data-ng-show=\"!roster || roster.controllersCount === 0\">No Broadcasters</li>\n" +
    "      <li class=\"roster__item--controller\"\n" +
    "        data-ng-show=\"roster && roster.controllersCount > 0\" data-ng-repeat=\"user_id in roster.controllerOrder\">\n" +
    "        <a data-ng-href=\"http://www.rdio.com{{ roster.controllers[user_id].profile }}\" target=\"_blank\"\n" +
    "          tooltip=\"{{ roster.controllers[user_id].name }} ({{ roster.controllers[user_id].points }})\" data-tooltip-placement=\"bottom\">\n" +
    "          <img data-ng-src=\"{{ roster.controllers[user_id].picture }}\" class=\"avatar xs\"\n" +
    "            data-ng-class=\"{upvoted: playing.upvotes[user_id], downvoted: playing.downvotes[user_id]}\"\n" +
    "            alt=\"{{ roster.controllers[user_id].name }}\" />\n" +
    "            <i data-ng-if=\"user_id === currentController\" class=\"fa fa-volume-up\" />\n" +
    "        </a>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"roster__category\">\n" +
    "    <div class=\"roster__category-label\">Listening</div>\n" +
    "    <ul class=\"roster roster--listeners\" data-ng-show=\"roster && roster.usersCount > 0\">\n" +
    "      <li class=\"empty\" data-ng-show=\"!roster || roster.users.length === 0\">No Listeners</li>\n" +
    "      <li data-ng-repeat=\"(user_id, user) in roster.users | orderBy:name\">\n" +
    "      <a class=\"roster__user\"\n" +
    "        data-ng-href=\"http://www.rdio.com{{ user.profile }}\"\n" +
    "        target=\"_blank\"\n" +
    "        tooltip=\"{{ user.name }} ({{ user.points }})\" data-tooltip-placement=\"bottom\">\n" +
    "        <img data-ng-src=\"{{ user.picture }}\"\n" +
    "        data-ng-class=\"{upvoted: playing.upvotes[user_id], downvoted: playing.downvotes[user_id]}\"\n" +
    "        class=\"avatar xs\" alt=\"{{ user.name }}\" />\n" +
    "      </a>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/roster-mention.html',
    "<ul class=\"list-group user-search\">\n" +
    "  <li data-mentio-menu-item=\"person\" data-ng-repeat=\"person in items\" class=\"list-group-item\">\n" +
    "    <img data-ng-src=\"{{ person.picture }}\" class=\"user-photo\">\n" +
    "    <span class=\"text-primary\" data-ng-bind-html=\"person.name | mentioHighlight:typedTerm:'menu-highlighted' | unsafe\"></span>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('/static/partials/directives/slide.html',
    "<div class=\"slide\">\n" +
    "  <div class=\"carousel__back text-left\" data-ng-show=\"current.type === 'search'\">\n" +
    "    <a data-ng-click=\"current.clear()\">\n" +
    "      <i class=\"fa fa-fw fa-times-circle-o\"></i> Clear Search Results\n" +
    "    </a>\n" +
    "    <div class=\"carousel__action pull-right\" data-ng-show=\"current.loading\">\n" +
    "      <i class=\"fa fa-circle-o-notch fa-lg fa-spin\"></i>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <lstn-drilldown-back\n" +
    "    data-ng-if=\"current.position > 0\"\n" +
    "    data-click-handler=\"close\"\n" +
    "    data-refresh-handler=\"refresh\"\n" +
    "    data-bulk-add-handler=\"addTracks\"\n" +
    "    data-current=\"current\"></lstn-drilldown-back>\n" +
    "\n" +
    "  <ul class=\"drilldown__list text-left\">\n" +
    "    <li class=\"slide--empty\" data-ng-if=\"!data || data.length === 0\">\n" +
    "      <i class=\"fa fa-music\"></i>\n" +
    "    </li>\n" +
    "\n" +
    "    <lstn-drilldown-item\n" +
    "      data-ng-if=\"current.radioKey\"\n" +
    "      data-context=\"{{ current.type }}\"\n" +
    "      data-radio=\"current\"\n" +
    "      data-load=\"load\"></lstn-drilldown-item>\n" +
    "\n" +
    "    <li data-ng-repeat=\"item in data\" data-ng-if=\"data && data.length > 0\">\n" +
    "      <div data-ng-switch=\"getType(item.type)\">\n" +
    "        <lstn-track\n" +
    "          data-ng-switch-when=\"track\"\n" +
    "          data-context=\"{{ current.type }}\"\n" +
    "          data-track=\"item\"\n" +
    "          data-index=\"$index\"></lstn-track>\n" +
    "\n" +
    "        <lstn-drilldown-item\n" +
    "          data-ng-switch-default\n" +
    "          data-context=\"{{ current.type }}\"\n" +
    "          data-content=\"item\"\n" +
    "          data-load=\"load\"></lstn-drilldown-item>\n" +
    "      </div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/directives/track.html',
    "<div id=\"track-{{ $id }}\" class=\"drilldown__item track\">\n" +
    "  <div class=\"item__image\">\n" +
    "    <img data-ng-src=\"{{ track.icon }}\" alt=\"{{ track.album }}\">\n" +
    "    <div class=\"item__image__overlay\">\n" +
    "      <span class=\"fa fa-stack item__image__overlay__icon item__image__overlay__icon--preview\" data-ng-click=\"preview()\" data-ng-if=\"track.canSample\"></i>\n" +
    "        <i class=\"fa fa-circle fa-stack-1x\"></i>\n" +
    "        <i class=\"fa fa-play-circle fa-stack-1x\"></i>\n" +
    "      </span>\n" +
    "      <i class=\"fa fa-heart item__image__overlay__icon item__image__overlay__icon--favorite\" data-ng-if=\"favorites.bitset[track.key]\"></i>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"item__info\">\n" +
    "    <div\n" +
    "      class=\"item__title\"\n" +
    "      data-ng-class=\"{'text-muted': (context !== 'queue' && queue.bitset[track.key]) || !track.canStream}\"\n" +
    "      data-ng-bind=\"track.name\"></div>\n" +
    "    <div\n" +
    "      class=\"item__artist\"\n" +
    "      data-ng-class=\"{'text-muted': (context !== 'queue' && queue.bitset[track.key]) || !track.canStream}\"\n" +
    "      data-ng-bind=\"track.artist\"></div>\n" +
    "    <div\n" +
    "      class=\"item__duration text-muted\"\n" +
    "      data-ng-bind=\"track.duration | duration\"></div>\n" +
    "  </div>\n" +
    "  <div class=\"item__actions\">\n" +
    "    <i\n" +
    "      class=\"fa fa-exclamation-triangle\"\n" +
    "      data-ng-show=\"!track.canStream\"\n" +
    "      data-tooltip=\"This track can't be streamed in your region\"\n" +
    "      data-tooltip-placement=\"left\"></i>\n" +
    "    <i\n" +
    "      class=\"fa fa-exclamation-triangle\"\n" +
    "      data-ng-show=\"track.canStream && track.restrictedRegions\"\n" +
    "      data-tooltip=\"This track has limited regional availability\"\n" +
    "      data-tooltip-placement=\"left\"></i>\n" +
    "    <i\n" +
    "      class=\"fa fa-fw fa-circle-o-notch fa-spin\"\n" +
    "      data-ng-show=\"track.loading\"></i>\n" +
    "    <i\n" +
    "      class=\"fa fa-fw fa-check\"\n" +
    "      data-ng-show=\"(track.in_queue || queue.bitset[track.key]) && context !== 'queue'\"\n" +
    "      data-tooltip=\"This track is already in your queue\"\n" +
    "      data-tooltip-placement=\"left\"\n" +
    "      data-tooltip-popup-delay=\"1000\"></i>\n" +
    "\n" +
    "    <span class=\"dropdown\" data-dropdown data-is-open=\"status.open\">\n" +
    "      <a\n" +
    "        class=\"fa fa-fw fa-ellipsis-v\"\n" +
    "        data-ng-hide=\"track.loading || ((track.in_queue || queue.bitset[track.key]) && context !== 'queue')\"\n" +
    "        data-ng-click=\"toggleDropdown($event)\"></a>\n" +
    "      <ul\n" +
    "        class=\"dropdown-menu dropdown-menu-right\"\n" +
    "        data-ng-hide=\"track.loading\"\n" +
    "        role=\"menu\">\n" +
    "        <li data-ng-show=\"track.in_queue && context === 'queue' && count > 1 && index != 0\">\n" +
    "          <a data-ng-click=\"queue.moveToTop(index)\">\n" +
    "            <i class=\"fa fa-fw fa-arrow-circle-up item__actions__move-to-top\"></i>\n" +
    "            Move to Top of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li data-ng-show=\"track.in_queue && context === 'queue' && count > 1 && index != (count - 1)\">\n" +
    "        <a data-ng-click=\"queue.moveToBottom(index)\">\n" +
    "            <i class=\"fa fa-fw fa-arrow-circle-down item__actions__move-to-bottom\"></i>\n" +
    "            Move to Bottom of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li data-ng-show=\"(track.in_queue || queue.bitset[track.key]) && context === 'queue'\">\n" +
    "          <a data-ng-click=\"queue.removeTrack(track, index)\">\n" +
    "            <i class=\"fa fa-fw fa-minus-circle\"></i>\n" +
    "            Remove From Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li data-ng-hide=\"!track.canStream || track.in_queue || queue.bitset[track.key]\">\n" +
    "          <a data-ng-click=\"queue.addTrack(track, 'top')\">\n" +
    "            <i class=\"fa fa-fw fa-plus-circle item__actions__add\"></i>\n" +
    "            Add to Top of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li data-ng-hide=\"!track.canStream || track.in_queue || queue.bitset[track.key]\">\n" +
    "          <a data-ng-click=\"queue.addTrack(track)\">\n" +
    "            <i class=\"fa fa-fw fa-plus-circle item__actions__add\"></i>\n" +
    "            Add to Bottom of Queue\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li class=\"divider\" data-ng-hide=\"!track.canStream && context != 'queue'\"></li>\n" +
    "        <li data-ng-hide=\"favorites.bitset[track.key]\">\n" +
    "          <a data-ng-click=\"favorites.addTrack(track)\">\n" +
    "            <i class=\"fa fa-fw fa-heart item__actions__favorite\"></i>\n" +
    "            Favorite Track\n" +
    "          </a>\n" +
    "        </li>\n" +
    "        <li data-ng-show=\"favorites.bitset[track.key]\">\n" +
    "          <a data-ng-click=\"favorites.removeTrack(track)\">\n" +
    "            <i class=\"fa fa-fw fa-heart-o item__actions__unfavorite\"></i>\n" +
    "            Unfavorite Track\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </span>\n" +
    "    <i\n" +
    "      class=\"fa fa-fw fa-bars item__actions__drag-handle\"\n" +
    "      data-ng-show=\"track.in_queue && context === 'queue'\"></i>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/help.html',
    "<div>\n" +
    "    <p>This product uses the Rdio API but is not endorsed, certified or otherwise approved in any way by Rdio®.</p>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/index.html',
    "<div>\n" +
    "  <div class=\"hero jumbotron\">\n" +
    "    <div class=\"container\">\n" +
    "      <h1><span class=\"hero-lstn\">Lstn</span> to <span class=\"hero-music\">Music</span> with Friends</h1>\n" +
    "      <p>Create a room and start listening to music with your friends.</p>\n" +
    "      <p>\n" +
    "        <a data-ng-show=\"!current_user.id\" class=\"btn btn-primary btn-lg\" href=\"/login\" role=\"button\" target=\"_self\">Get Started</a>\n" +
    "        <a data-ng-show=\"current_user.id\" class=\"btn btn-primary btn-lg\" href=\"/rooms\" role=\"button\">Get Started</a>\n" +
    "      </p>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/modals/profile.html',
    "<div>\n" +
    "  <div class=\"modal-header\"><h3 data-ng-bind=\"current_user.name\"></h3></div>\n" +
    "  <div class=\"modal-body\">\n" +
    "    <div class=\"profile__header\">Queue</div>\n" +
    "    <div class=\"form-group\">\n" +
    "      <label for=\"queue-behavior\">When a track is played from my queue:</label>\n" +
    "      <select data-ng-model=\"settings.queue.behavior\">\n" +
    "        <option value=\"bottom\">Move to bottom of queue</option>\n" +
    "        <option value=\"remove\">Remove the track</option>\n" +
    "      </select>\n" +
    "    </div>\n" +
    "    <div class=\"profile__header\">Chat</div>\n" +
    "    <div class=\"form-group\">\n" +
    "      <label for=\"joinleave\">When a user joins/leaves the room:</label>\n" +
    "      <select data-ng-model=\"settings.chat.joinleave\">\n" +
    "        <option value=\"show\">Show join/leave messages</option>\n" +
    "        <option value=\"hide\">Hide join/leave messages</option>\n" +
    "      </select>\n" +
    "    </div>\n" +
    "    <div class=\"form-group\">\n" +
    "      <label for=\"emoticons\">When sending a text emoticon:</label>\n" +
    "      <select data-ng-model=\"settings.chat.emoticons\">\n" +
    "        <option value=\"keep\">Keep as text emoticon</option>\n" +
    "        <option value=\"replace\">Replace with image emoticon</option>\n" +
    "      </select>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-accent\" ng-click=\"cancel()\">Cancel</button>\n" +
    "    <button class=\"btn btn-active\" ng-click=\"ok()\">Save</button>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/room.html',
    "<div class=\"room\">\n" +
    "  <div class=\"col-md-3 col-sm-4 room__left\">\n" +
    "    <lstn-playing-info></lstn-playing-info>\n" +
    "    <lstn-room-roster></lstn-room-roster>\n" +
    "  </div>\n" +
    "  <div class=\"col-md-5 col-sm-8 room__middle\">\n" +
    "    <tabset class=\"queue__tabs\">\n" +
    "      <tab id=\"my-queue-tab\" data-select=\"selectTab('queue')\" data-active=\"tabs.queue\">\n" +
    "        <tab-heading>MY QUEUE</tab-heading>\n" +
    "        <lstn-room-queue></lstn-room-queue>\n" +
    "      </tab>\n" +
    "      <tab id=\"more-music-tab\" data-select=\"selectTab('music')\" data-active=\"tabs.music\">\n" +
    "        <tab-heading>MORE MUSIC</tab-heading>\n" +
    "        <lstn-more-music></lstn-more-music>\n" +
    "      </tab>\n" +
    "      <tab data-ng-if=\"!desktop\">\n" +
    "        <tab-heading>ROOM ACTIVITY</tab-heading>\n" +
    "        <lstn-room-activity></lstn-room-activity>\n" +
    "      </tab>\n" +
    "    </tabset>\n" +
    "  </div>\n" +
    "  <div class=\"col-md-4 room__right\" data-ng-if=\"desktop\">\n" +
    "    <lstn-room-activity></lstn-room-activity>\n" +
    "  </div>\n" +
    "  <div id=\"api\"></div>\n" +
    "</div>\n"
  );


  $templateCache.put('/static/partials/rooms.html',
    "<div class=\"rooms\">\n" +
    "  <h1>\n" +
    "    Your Rooms\n" +
    "    <button class=\"btn btn-success pull-right\" data-ng-click=\"createRoom()\">Create Room</button>\n" +
    "  </h1>\n" +
    "  <lstn-room-list></lstn-room-list>\n" +
    "</div>\n"
  );

}]);
