import string
import simplejson as json
import lstn.rdio as rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, jsonify

from flask.ext.login import login_required, current_user
from slugify import slugify

from lstn import db
from lstn.models import Room
from lstn.exceptions import APIException

room = Blueprint('room', __name__, url_prefix='/api/room')

@room.route('', methods=['GET', 'POST'])
@login_required
def room_action():
  if request.method == 'POST':
    return room_post_action()

  rooms = current_user.get_rooms()

  response = {
    'success': 1,
    'rooms': rooms.values()
  }

  return jsonify(response)

def room_post_action():
  name = request.json.get('name', None)
  if not name:
    raise APIException('You must specify a room name')

  name_slug = slugify(name)
  slug = name_slug
  count = 0

  room = Room.query.filter(Room.slug == name_slug).first()
  while room:
    count += 1
    slug = "%s-%s" % (name_slug, count)
    room = Room.query.filter(Room.slug == slug).first()

  room = Room(
    name=name,
    slug=slug,
    owner_id=current_user.id
  )

  db.session.add(room)
  db.session.commit()

  response = {
    'success': True,
    'id': room.id,
    'slug': slug
  }

  return jsonify(response)

@room.route('/<room_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def room_id_action(room_id):
  if request.method == 'PUT':
    return room_update_action(room_id)

  if request.method == 'DELETE':
    return room_delete_action(room_id)

  room = Room.query.filter(Room.slug == room_id).first()

  if not room:
    room = Room.query.get(int(room_id))

  if not room:
    raise APIException('Room not found', 404)

  rdio_manager = current_user.get_rdio_manager()

  hostname = request.headers['Host']
  if ':' in hostname:
    components = string.split(hostname, ':')
    hostname = components[0]

  try:
    playback = rdio_manager.get_playback_token(hostname)
  except Exception as e:
    current_app.logger.debug(e)
    raise APIException('Unable to retrieve playback credentials: %s' % str(e))

  if not playback:
      raise APIException('Unable to retrieve playback token', 500)

  queue = current_user.get_queue()
  favorites = current_user.get_favorite_keys()

  response = {
    'success': 1,
    'room': room,
    'playback': playback,
    'queue': queue,
    'favorites': favorites,
  }

  return jsonify(response)

def room_update_action(room_id):
  room = Room.query.filter(Room.slug == room_id).first()

  if not room:
    room = Room.query.get(int(room_id))

  if not room:
    raise APIException('Room not found', 404)

  if room.owner_id != current_user.id:
    raise APIExceition('Forbidden', 403)

  name = request.json.get('name', None)
  if not name:
    raise APIException('You must specify a room name')

  response = {
    'success': True,
    'room': room.to_array(),
  }

  if name == room.name:
    return jsonify(response)

  name_slug = slugify(name)
  slug = name_slug
  count = 0

  found_room = Room.query.filter(Room.slug == name_slug).first()
  while found_room:
    count += 1
    slug = "%s-%s" % (name_slug, count)
    found_room = Room.query.filter(Room.slug == slug).first()

  room.name = name
  room.slug = slug

  db.session.add(room)
  db.session.flush()

  response['room'] = room
  return jsonify(response)

def room_delete_action(room_id):
  room = Room.query.filter(Room.slug == room_id).first()

  if not room:
    room = Room.query.get(int(room_id))

  if not room:
    raise APIException('Room not found', 404)

  if room.owner_id != current_user.id:
    raise APIExceition('Forbidden', 403)

  db.session.delete(room)
  db.session.flush()

  response = {
    'success' : True,
  }

  return jsonify(response)
