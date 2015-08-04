import os
import simplejson as json
import hashlib
import urllib, urllib2
import lstn.rdio as rdio

from flask import Flask, request, redirect, url_for, \
  render_template, Blueprint, current_app, session

from flask.ext.login import login_required, current_user, login_user, logout_user

from oauth2client.client import OAuth2WebServerFlow
from base64 import b64encode

from lstn import db, login_manager
from lstn.exceptions import WebException
from lstn.models import User

site = Blueprint('site', __name__)

@site.route('/login')
def login():
  csrf_token = b64encode(os.urandom(24))
  session['csrf_token'] = csrf_token

  rdio_manager = rdio.Api(current_app.config['RDIO_CLIENT_ID'],
      current_app.config['RDIO_CLIENT_SECRET'])

  flow = rdio_manager.get_flow(current_app.config['BASE_URL'] + '/auth')

  auth_url = '%s&state=%s' % (flow.step1_get_authorize_url(), csrf_token)
  return redirect(auth_url)

@site.route('/auth')
def auth():
  session_csrf_token = session.pop('csrf_token', None)
  csrf_token = request.args.get('state', None)
  code = request.args.get('code')

  if not session_csrf_token or not csrf_token:
    raise WebException('Invalid CSRF Token')

  if not code:
    raise WebException('Invalid authentication code')

  if csrf_token != session_csrf_token:
    raise WebException('Invalid CSRF Token')

  rdio_manager = rdio.Api(current_app.config['RDIO_CLIENT_ID'],
      current_app.config['RDIO_CLIENT_SECRET'])

  flow = rdio_manager.get_flow(current_app.config['BASE_URL'] + '/auth')

  credentials = flow.step2_exchange(code)

  rdio_manager.set_credentials(credentials)

  rdio_user = rdio_manager.current_user(['streamRegion'])
  if not rdio_user:
    raise WebException('Unable to retrieve user information from Rdio', 500)

  user = User.query.filter(User.external_id == rdio_user.key).first()

  oauth = json.loads(credentials.to_json())

  if not user:
    user = User(
      name=rdio_user.name,
      external_id=rdio_user.key,
      profile=rdio_user.url,
      picture=rdio_user._data['icon250'],
      points=0,
      region=rdio_user._data['streamRegion'],
      oauth=oauth
    )
    db.session.add(user)
    db.session.commit()
  else:
    user.name = rdio_user.name
    user.profile = rdio_user.url
    user.picture = rdio_user._data['icon250']
    user.region = rdio_user._data['streamRegion']
    user.oauth = oauth

    db.session.commit()

  if not user:
    raise WebException('Unable to update user', 500)

  login_user(user)

  next_url = session.get('next_url', "%s/#rooms" % url_for('site.index'))
  session.pop('next_url', None)

  return redirect(next_url)

@site.route('/logout')
@login_required
def logout():
  logout_user()
  return redirect(url_for('site.index'))

@site.route('/privacy')
def privacy():
  return render_template('privacy.html')

@site.route('/', defaults={'path': 'index'})
@site.route('/<path:path>')
def index(path):
  if path not in ['index', 'login', 'auth', 'privacy', 'terms']:
    if not current_user.is_authenticated():
      return current_app.login_manager.unauthorized()

  if current_user.is_anonymous():
    user_json = json.dumps({
      'name': 'Anonymous'
    })
  else:
    user_json = current_user.to_json(for_public=True)

  return render_template('index.html', user_json=user_json)
