import simplejson as json
import lstn.rdio as rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user
from lstn.models import User, Room
from lstn.exceptions import APIException

from lstn import db, r

user = Blueprint('user', __name__, url_prefix='/api/user')

@user.route('/', methods=['GET'])
@login_required
def get_user():
  return jsonify(success=True, user=current_user.to_array(for_public=True))

@user.route('/<user_id>/vote/<direction>', methods=['POST'])
@login_required
def vote(user_id, direction):
  if user_id == current_user.id:
    raise APIException('You are unable to vote for yourself')

  voted_user = User.query.get(int(user_id))
  if not voted_user:
    raise APIException('Unable to find user', 404)

  room_id = request.json.get('room', None)
  if not room_id:
    raise APIException('You must specify a room id')

  room = Room.query.filter(Room.slug == room_id).first()

  if not room:
    room = Room.query.get(int(room_id))

  if not room:
    raise APIException('Unable to find room', 404)

  track_id = request.json.get('track', None)
  if not track_id:
    raise APIException('You must specify a track id')

  remaining = request.json.get('remaining', None)
  if not remaining:
    raise APIException('You must specify a track remaining time')

  remaining = int(remaining)

  voting_key = 'vote_%s_%s_%s_%s' % (current_user.id, user_id, room_id, track_id)
  voted = r.get(voting_key)
  if voted and voted == direction:
    raise APIException('You have already voted')

  if direction == 'downvote':
    voted_user.points = User.points - 1
  else:
    voted_user.points = User.points + 1

  db.session.add(voted_user)
  db.session.flush()

  r.set(voting_key, direction, remaining)

  return jsonify(success=True)

@user.route('/playlists', methods=['GET'])
@login_required
def get_playlists():
  rdio_manager = current_user.get_rdio_manager()

  try:
    playlist_set = rdio_manager.get_playlists(['radioKey'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to get playlists: %s' % str(e))

  playlists = {
    'owned': [],
    'collab': [],
    'favorites': [],
  }

  if hasattr(playlist_set, 'owned_playlists'):
    playlists['owned'] = [playlist._data for playlist in playlist_set.owned_playlists if hasattr(playlist, '_data') and playlist.key != current_user.queue]

  if hasattr(playlist_set, 'collab_playlists'):
    playlists['collab'] = [playlist._data for playlist in playlist_set.collab_playlists if hasattr(playlist, '_data')]

  if hasattr(playlist_set, 'favorites_playlists'):
    playlists['favorites'] = [playlist._data for playlist in playlist_set.favorites_playlists if hasattr(playlist, '_data')]

  return jsonify(success=True, data=playlists)

@user.route('/playlists/<list_type>', methods=['GET'])
@login_required
def get_playlist_type(list_type):
  rdio_manager = current_user.get_rdio_manager()

  if list_type not in ['owned', 'collab', 'favorites']:
    raise APIException('Invalid list type')

  data = {
    'method': 'getUserPlaylists',
    'user': current_user.external_id,
    'kind': list_type,
    'extras': 'radioKey',
  }

  try:
    response = rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve playlist: %s' % str(e))

  playlists = [playlist for playlist in response if playlist['key'] != current_user.queue]

  return jsonify(success=True, data=playlists)

@user.route('/stations/<station_type>', methods=['GET'])
@login_required
def get_station_type(station_type):
  rdio_manager = current_user.get_rdio_manager()

  methods = {
    'you': {
      'method': 'getStations',
      'user': current_user.external_id,
      'v': '20140512',
    },
    'friends': {
      'method': 'getFriendAndTastemakerStations',
      'v': '20140512',
    },
    'recent': {
      'method': 'getRecentStationsHistoryForUser',
      'user': current_user.external_id,
      'v': '20140512',
    },
    'genre': {
      'method': 'getGenreStations',
      'v': '20140512',
      'genre': request.args.get('genre')
    },
    'top': {
      'method': 'getCuratedContent',
      'curationType': 'top_stations',
      'v': '20140512'
    },
    'new': {
      'method': 'getCuratedContent',
      'curationType': 'new_releases_weekly_station',
    },
    'spotlight': {
      'method': 'getCuratedContent',
      'curationType': 'spotlight',
    }
  }

  if station_type not in methods:
    raise APIException('Invalid station type')

  try:
    response = rdio_manager.call_api_authenticated(methods[station_type])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve station: %s' % str(e))

  return jsonify(success=True, data=response['items'])

@user.route('/queue', methods=['GET', 'PUT', 'DELETE', 'POST'])
@login_required
def user_queue():
  if request.method == 'PUT':
    return update_queue()

  if request.method == 'DELETE':
    return clear_queue()

  if request.method == 'POST':
    return bulk_add_queue()

  queue = current_user.get_queue()
  return jsonify(success=True, queue=queue)

def update_queue():
  if 'queue' not in request.json:
    raise APIException('You must specify queue data')

  if not current_user.queue:
    raise APIException('Unable to set user queue', 500)

  rdio_manager = current_user.get_rdio_manager()

  tracks = [track['key'] for track in request.json['queue']]

  if tracks:
    try:
      rdio_manager.set_playlist_order(current_user.queue, tracks)
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to reorder your queue: %s' % str(e))

  return jsonify(success=True)

def clear_queue():
  if not current_user.queue:
    raise APIException('Unable to clear user queue', 500)

  rdio_manager = current_user.get_rdio_manager()

  queue = current_user.get_queue()
  if queue:
    tracks = [track['key'] for track in queue]

    try:
      rdio_manager.remove_from_playlist(current_user.queue, tracks)
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to reorder your queue: %s' % str(e))

  return jsonify(success=True)

def bulk_add_queue():
  rdio_manager = current_user.get_rdio_manager()

  queue_playlist = current_user.get_queue_id()

  data = request.get_json()

  if not data or 'tracks' not in data:
    raise APIException('Unable to add the tracks to your queue: %s' % str(e))

  if queue_playlist:
    try:
      rdio_manager.add_to_playlist(queue_playlist, data['tracks'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to add the tracks to your queue: %s' % str(e))
  else:
    try:
      playlist = rdio_manager.create_playlist('Lstn to Rdio', 'User Queue for Lstn', data['tracks'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to add the track to your queue: %s' % str(e))

    # Throw an error if we couldn't create it
    if not playlist:
      raise APIException('Unable to create Rdio playlist', 500)

    queue_playlist = playlist.key

    # Update the user's queue field
    current_user.queue = queue_playlist
    db.session.add(current_user)
    db.session.flush()

  # Get the user's queue
  queue = current_user.get_queue()
  return jsonify(success=True, queue=queue)

@user.route('/queue/<track_id>', methods=['POST', 'DELETE'])
@login_required
def user_queue_track(track_id):
  if request.method == 'POST':
    return add_queue(track_id)

  return delete_queue(track_id)

def add_queue(track_id):
  rdio_manager = current_user.get_rdio_manager()

  queue_playlist = current_user.get_queue_id()

  if queue_playlist:
    try:
      rdio_manager.add_to_playlist(queue_playlist, [track_id])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to add the track to your queue: %s' % str(e))
  else:
    try:
      playlist = rdio_manager.create_playlist('Lstn to Rdio', 'User Queue for Lstn', [track_id])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to add the track to your queue: %s' % str(e))

    # Throw an error if we couldn't create it
    if not playlist:
      raise APIException('Unable to create Rdio playlist', 500)

    queue_playlist = playlist.key

    # Update the user's queue field
    current_user.queue = queue_playlist
    db.session.add(current_user)
    db.session.flush()

  # Get the user's queue
  queue = current_user.get_queue()
  return jsonify(success=True, queue=queue)

def delete_queue(track_id):
  if not current_user.queue:
    raise APIException('Unable to delete track from non-existant playlist')

  rdio_manager = current_user.get_rdio_manager()

  index = request.args.get('index', 0)
  try:
    rdio_manager.remove_from_playlist(current_user.queue, [track_id], index)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to remove that track from your queue: %s' % str(e))

  queue = current_user.get_queue()
  return jsonify(success=True, queue=queue)

@user.route('/search', methods=['GET'])
def search():
  query = request.args.get('query', None)
  if not query:
    raise APIException('You must specify a search query')

  if len(query) < 3:
    return jsonify(success=True, data=[])

  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'search',
    'query': query,
    'types': 'track,artist,album',
    'extras': 'albumCount,streamRegions,radioKey,sampleUrl',
  }

  try:
    response = rdio_manager.call_api(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to search music: %s' % str(e))

  return jsonify(success=True, data=response['results'])

@user.route('/favorites', methods=['GET'])
@login_required
def user_favorites():
  try:
    favorites = current_user.get_favorites()
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to get your favorites: %s' % str(e))

  return jsonify(success=True, data=favorites)

@user.route('/favorites/<track_id>', methods=['POST', 'DELETE'])
@login_required
def user_favorite_track(track_id):
  if request.method == 'POST':
    return add_favorite(track_id)

  return delete_favorite(track_id)

def add_favorite(track_id):
  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'addToFavorites',
    'keys': track_id,
  }

  try:
    rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to add the track to your favorites: %s' % str(e))

  return jsonify(success=True)

def delete_favorite(track_id):
  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'removeFromFavorites',
    'keys': track_id,
  }

  try:
    rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to remove that track from your favorites: %s' % str(e))

  return jsonify(success=True)

@user.route('/collection', methods=['GET'])
@login_required
def user_collection():
  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'getArtistsInCollection',
    'user': current_user.external_id,
    'extras': 'albumCount,radioKey,count',
  }

  try:
    response = rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to get your collection: %s' % str(e))

  artists = []
  for artist in response:
    artist['length'] = artist['count']
    artists.append(artist)

  return jsonify(success=True, data=artists)

@user.route('/settings', methods=['POST'])
@login_required
def set_settings():
  current_user.settings = request.json
  db.session.add(current_user)
  db.session.flush()

  return jsonify(success=True)
