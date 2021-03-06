import simplejson as json
import lstn.rdio as rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user

from lstn import db
from lstn.exceptions import APIException

station = Blueprint('station', __name__, url_prefix='/api/station')

@station.route('/<station_id>/tracks', methods=['GET'])
@login_required
def get_tracks(station_id):
  rdio_manager = current_user.get_rdio_manager()

  data = {
    'method': 'generateStation',
    'station_key': station_id,
    'count': 10,
    'extras': 'trackKeys,streamRegions,sampleUrl',
  }

  try:
    station = rdio_manager.call_api_authenticated(data)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve station tracks: %s' % str(e))

  current_app.logger.debug(station)

  track_keys = []
  if 'tracks' in station:
    track_keys = [track['key'] for track in station['tracks']]

  tracks = []
  if track_keys:
    try:
      tracks = rdio_manager.get(track_keys, ['radioKey', 'streamRegions', 'sampleUrl'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to retrieve station tracks: %s' % str(e))

    tracks = [track._data for track in tracks]

  return jsonify(success=True, data=tracks)
