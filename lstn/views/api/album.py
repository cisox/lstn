import simplejson as json
import rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user

from lstn import db
from lstn.exceptions import APIException

album = Blueprint('album', __name__, url_prefix='/api/album')

@album.route('/<album_id>/tracks/collection', methods=['GET'])
@login_required
def get_collection_tracks(album_id):
  rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
    current_app.config['RDIO_CONSUMER_SECRET'],
    current_user.oauth_token,
    current_user.oauth_token_secret)

  try:
    response = rdio_manager.get_tracks_for_album_in_collection(album_id, current_user.external_id, ['radioKey', 'streamRegions'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve tracks: %s' % str(e))

  tracks = [track._data for track in response]

  return jsonify(success=True, data=tracks)

@album.route('/<album_id>/tracks', methods=['GET'])
@login_required
def get_tracks(album_id):
  rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
    current_app.config['RDIO_CONSUMER_SECRET'],
    current_user.oauth_token,
    current_user.oauth_token_secret)

  try:
    albums = rdio_manager.get([album_id], ['trackKeys'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve albums: %s' % str(e))

  tracks = []

  if len(albums) > 0:
    if hasattr(albums[0], 'track_keys') and len(albums[0].track_keys) > 0:
      try:
        response = rdio_manager.get(albums[0].track_keys, ['radioKey', 'streamRegions'])
      except Exception as e:
        current_app.logger.debug(e)
        raise APIException('Unable to retrieve album tracks: %s' % str(e))

      trackDict = {}
      for track in response:
        trackDict[track.key] = track._data

      tracks = []
      for trackKey in albums[0].track_keys:
        tracks.append(trackDict[trackKey])

  return jsonify(success=True, data=tracks)
