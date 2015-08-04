import simplejson as json
import lstn.rdio as rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user

from lstn import db
from lstn.exceptions import APIException

artist = Blueprint('artist', __name__, url_prefix='/api/artist')

@artist.route('/<artist_id>/albums/collection', methods=['GET'])
@login_required
def get_collection_albums(artist_id):
  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'getAlbumsForArtistInCollection',
    'artist': artist_id,
    'extras': 'radioKey,-tracks',
  };

  try:
    response = rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve albums: %s' % str(e))

  return jsonify(success=True, data=response)

@artist.route('/<artist_id>/albums', methods=['GET'])
@login_required
def get_albums(artist_id):
  rdio_manager = current_user.get_rdio_manager()

  try:
    response = rdio_manager.get_albums_for_artist(artist_id, False, ['radioKey'])
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve albums: %s' % str(e))

  albums = []
  if len(response) > 0:
    albums = [album._data for album in response]

  return jsonify(success=True, data=albums)
