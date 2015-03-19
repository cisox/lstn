import datetime
import simplejson as json
import rdio
import time
import re

from lstn import db, r
from lstn.exceptions import APIException

from flask import current_app
from flask.ext.login import UserMixin, current_user
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import TypeDecorator, TEXT
from slugify import slugify

class ModelMixin(object):
  def to_array(self):
    return dict((key, getattr(self, key)) for key in self.__dict__ if not key.startswith('_') and not isinstance(self.__dict__[key], ModelMixin) and not isinstance(self.__dict__[key], list))

  def to_json(self):
    return json.dumps(self.to_array(), cls=ModelEncoder)

class DateTimeEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, datetime.datetime):
      return obj.isoformat()
    elif isinstance(obj, datetime.date):
      return obj.isoformat()
    elif isinstance(obj, datetime.timedelta):
      return (datetime.datetime.min + obj).time().isoformat()
    else:
      return super(DateTimeEncoder, self).default(obj)

class ModelEncoder(DateTimeEncoder):
  def default(self, obj):
    if isinstance(obj, ModelMixin):
      return obj.to_array()
    else:
      return super(ModelEncoder, self).default(obj)

class JSONEncodedDict(TypeDecorator):
  impl = TEXT

  def process_bind_param(self, value, dialect):
    if value is not None:
      value = json.dumps(value)
    return value;

  def process_result_value(self, value, dialect):
    if value is not None:
      value = json.loads(value)
    return value

Base = declarative_base()

class User(db.Model, ModelMixin, UserMixin):
  __tablename__ = 'user'

  id = db.Column(db.BigInteger, primary_key=True)
  name = db.Column(db.String(255))
  external_id = db.Column(db.String(255))
  profile = db.Column(db.String(255))
  oauth_token=db.Column(db.String(255))
  oauth_token_secret=db.Column(db.String(255))
  queue = db.Column(db.String(255))
  picture = db.Column(db.String(32))
  points = db.Column(db.BigInteger)
  region = db.Column(db.String(3))
  settings = db.Column(JSONEncodedDict())
  created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())

  owned = db.relationship('Room', backref='owner')

  def is_anonymous(self):
    return False

  def to_json(self, for_public=False):
    return json.dumps(self.to_array(for_public=for_public), cls=ModelEncoder)

  def to_array(self, for_public=False):
    data = super(User, self).to_array()
    if for_public:
      data.pop('oauth_token', None)
      data.pop('oauth_token_secret', None)

    data['mention'] = ''.join(word.capitalize() for word in slugify(self.name).split('-'))

    return data

  def get_queue_id(self):
    if self.queue:
      return self.queue

    data = {
      'method': 'getUserPlaylists',
      'user': self.external_id,
    };

    rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
      current_app.config['RDIO_CONSUMER_SECRET'],
      self.oauth_token,
      self.oauth_token_secret)

    try:
      results = rdio_manager.call_api_authenticated(data);
      if results:
        for playlist in results:
          if playlist['name'] == u'Lstn to Rdio':
            self.queue = playlist['key']
            break
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to create Lstn playlist: %s' % str(e))

    if not self.queue:
      return None

    db.session.add(self)
    db.session.commit()

    return self.queue

  def get_queue(self):
    rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
      current_app.config['RDIO_CONSUMER_SECRET'],
      self.oauth_token,
      self.oauth_token_secret)

    queue_id = self.get_queue_id()
    if not queue_id:
      return []

    try:
      playlists = rdio_manager.get([queue_id], ['trackKeys'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to retrieve your queue: %s' % str(e))

    if not playlists:
      return []

    playlist = playlists[0]

    queue = []
    if not hasattr(playlist, 'track_keys') or len(playlist.track_keys) == 0:
      return []

    try:
      tracks = rdio_manager.get(playlist.track_keys, ['radioKey', 'streamRegions', 'sampleUrl'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to retrieve your queue: %s' % str(e))

    trackDict = {}
    for track in tracks:
      data = track._data
      data['in_queue'] = 1

      trackDict[track.key] = data

    queue = []
    for trackKey in playlist.track_keys:
      queue.append(trackDict[trackKey])

    return queue

  def get_favorite_keys(self):
    rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
      current_app.config['RDIO_CONSUMER_SECRET'],
      self.oauth_token,
      self.oauth_token_secret)

    data = {
      'method': 'getKeysInFavorites',
      'user': self.external_id,
    }

    try:
      response = rdio_manager.call_api_authenticated(data)
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to retrieve your favorites: %s' % str(e))

    if not response:
      return []

    return response['keys']

  def get_favorites(self):
    rdio_manager = rdio.Api(current_app.config['RDIO_CONSUMER_KEY'],
      current_app.config['RDIO_CONSUMER_SECRET'],
      self.oauth_token,
      self.oauth_token_secret)

    keys = self.get_favorite_keys()
    keys = [key for key in keys if not key.startswith('tp')]

    if not keys:
      return []

    try:
      response = rdio_manager.get(keys, ['radioKey', 'streamRegions', 'albumCount', 'sampleUrl'])
    except Exception as e:
      current_app.logger.debug(e)
      raise APIException('Unable to retrieve favorites: %s' % str(e))

    favoriteDict = {}
    for favorite in response:
      favoriteDict[favorite.key] = favorite._data

    favorites = []
    for key in keys:
      favorites.append(favoriteDict[key])

    return favorites;

  def get_owned_rooms(self):
    rooms = {}
    for room in self.owned:
      data = room.to_array()
      data['owner'] = room.owner.to_array(for_public=True)
      rooms[data['id']] = data;

    return rooms

  def get_recent_rooms(self):
    # Fetch recent rooms from Redis
    userKey = 'user_%s' % self.id
    start_time = int(time.time()) - (60 * 60 * 24 * 7);
    recent_room_ids = r.zrevrangebyscore(userKey, '+inf', start_time)
    recent_room_ids = [room_id for room_id in recent_room_ids]

    rooms = {}
    if recent_room_ids:
      recent_rooms = Room.query.filter(Room.id.in_(recent_room_ids)).all()
      for room in recent_rooms:
        data = room.to_array()
        data['owner'] = room.owner.to_array(for_public=True)
        rooms[data['id']] = data

    return rooms

  def get_rooms(self):
    owned_rooms = self.get_owned_rooms()
    recent_rooms = self.get_recent_rooms()
    owned_rooms.update(recent_rooms)

    return owned_rooms

  def get_room_count(self):
    return len(self.get_rooms())

  @staticmethod
  def get_users(include_self=True):
    query = User.query.order_by(User.name)

    if not include_self:
      query = query.filter(User.id != current_user.id)

    users = query.all()
    return users

class Room(db.Model, ModelMixin):
  __tablename__ = 'room'

  id = db.Column(db.BigInteger, primary_key=True)
  name = db.Column(db.String(255))
  slug = db.Column(db.String(255))
  owner_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
  settings = db.Column(db.Text)
  created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
