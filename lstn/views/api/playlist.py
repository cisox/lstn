import simplejson as json
import rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user

from lstn import db
from lstn.exceptions import APIException

playlist = Blueprint('playlist', __name__, url_prefix='/api/playlist')

@playlist.route('/<playlist_id>/tracks', methods=['GET'])
@login_required
def get_tracks(playlist_id):
  rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
    current_app.config['RDIO_CONSUMER_SECRET'],
    current_user.oauth_token,
    current_user.oauth_token_secret)

  try:
    playlists = rdio_manager.get([playlist_id], ['trackKeys'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve playlist tracks: %s' % str(e))

  if not playlists:
    return []

  playlist = playlists[0]

  if not hasattr(playlist, 'track_keys') or len(playlist.track_keys) == 0:
    return []

  try:
    tracks = rdio_manager.get(playlist.track_keys, ['radioKey', 'streamRegions'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve playlist tracks: %s' % str(e))

  tracks = [track._data for track in tracks]

  return jsonify(success=True, data=tracks)

@playlist.route('/<playlist_id>/<track_id>', methods=['DELETE'])
@login_required
def remove_track(playlist_id, track_id):
  rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
    current_app.config['RDIO_CONSUMER_SECRET'],
    current_user.oauth_token,
    current_user.oauth_token_secret)

  try:
    playlists = rdio_manager.remove_from_playlist(playlist_id, [track_id])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to remove the track from the playlist: %s' % str(e))

  return jsonify(success=True)

@playlist.route('', methods=['DELETE'])
@login_required
def remove_playlist():
  rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
    current_app.config['RDIO_CONSUMER_SECRET'],
    current_user.oauth_token,
    current_user.oauth_token_secret)

  try:
    playlists = rdio_manager.delete_playlist(playlist_id)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to remove the track from the playlist: %s' % str(e))

  return jsonify(success=True)
