module.exports = HipchatSpy;

var Hipchatter   = require('hipchatter');
var debug        = require('debug')('HipchatSpy');
var Router       = require('express').Router;
var Promise      = require('es6-promise').Promise;

var EVENTS = HipchatSpy.EVENTS = {
  ROOM_ENTER        : 'room_enter',
  ROOM_EXIT         : 'room_exit',
  ROOM_MESSAGE      : 'room_message',
  ROOM_NOTIFICATION : 'room_notification',
  ROOM_TOPIC_CHANGE : 'room_topic_change'
};

/**
 * Setup webhooks to monitor hipchat rooms
 * @constructor
 */
function HipchatSpy(token, url, name)
{
  this.client = new Hipchatter(token);
  this.url    = url;
  this.name   = name;

  this.rooms  = [];
}

HipchatSpy.prototype.eventName = function(event)
{
  return this.name + '-' + event;
};

/**
 * Add a room to our list
 * @param {string} room A room ID or room name
 * @return {Promise}
 */
HipchatSpy.prototype.addRoom = function(room)
{
  var _this = this;
  return new Promise(function(resolve, reject) {

    _this.client.get_room(room, function(err, info) {
      if (err) return reject(err);

      // Add the room to the list if we haven't already entered it
      var roomId = info.id;
      if (!~_this.rooms.indexOf(roomId)) {
        _this.rooms.push(roomId);
        debug('added room: %s', info.name);
      }

      resolve(info);
    });

  }).then(function(room) {
    return _this._clearHooksInRoom(room.id);
  }).then(function(roomId) {
    return _this._addHooksInRoom(roomId);
  });
};

/**
 * @return {Promise}
 */
HipchatSpy.prototype.addHooks = function()
{
  var _this = this;
  return this._rooms.reduce(function(seq, roomId) {
    return seq.then(function() {
      return _this._addHooksInRoom(roomId);
    });
  }, Promise.resolve());
};

/**
 * @param {string} roomId
 * @return {Promise}
 * @private
 */
HipchatSpy.prototype._addHooksInRoom = function(roomId)
{
  debug('adding hooks for room %s', roomId);
  var _this = this;
  return Object.keys(EVENTS).reduce(function(seq, key) {
    return seq.then(function() {
      return _this._addHook(roomId, EVENTS[key]);
    });
  }, Promise.resolve());
};

/**
 * @param {string} roomId
 * @return {Promise}
 * @private
 */
HipchatSpy.prototype._clearHooksInRoom = function(roomId)
{
  var _this = this;
  return this._getHooksInRoom(roomId).then(function(hooks) {
    return hooks.reduce(function(seq, hook) {
      return seq.then(function() {
        // TODO: only delete our hooks
        return _this._deleteHook(roomId, hook.id);
      });
    }, Promise.resolve()).then(function() { return roomId; });
  });
};

/**
 * @param {string} roomId
 * @return {Promise}
 * @private
 */
HipchatSpy.prototype._getHooksInRoom = function(roomId)
{
  var _this = this;
  return new Promise(function(resolve, reject) {
    _this.client.webhooks(roomId, function(err, resp) {
      if (err) return reject(err);
      debug('found %d hooks in room %s', resp.items.length, roomId);
      resolve(resp.items);
    });
  });
};

/**
 * @return {Promise}
 * @private
 */
HipchatSpy.prototype._addHook = function(roomId, event)
{
  var _this = this;

  var opts = {};
  opts.name    = this.eventName(event);
  opts.pattern = '.*';
  opts.event   = event;
  opts.url     = this.url + '/' + opts.name;

  return new Promise(function(resolve, reject) {
    _this.client.create_webhook(roomId, opts, function(err, hook) {
      if (err) return reject(err);
      debug('added hook %s to room %s', hook.id, roomId);
      debug('%s -> %s', opts.event, opts.url);
      resolve(hook);
    });
  });
};

/**
 * @param {string} roomId
 * @param {strgin} param
 * @return {Promise}
 * @private
 */
HipchatSpy.prototype._deleteHook = function(roomId, hookId)
{
  var _this = this;
  return new Promise(function(resolve, reject) {
    _this.client.delete_webhook(roomId, hookId, function(err) {
      if (err) return reject(err);
      debug('deleted hook %s in room %s', hookId, roomId);
      resolve(roomId);
    });
  });
};

