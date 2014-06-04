module.exports = middlewareSpy;

var HipchatSpy   = require('./HipchatSpy.js');
var Router       = require('express').Router;
var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')('HipchatSpy');

/**
 * Middleware function to connect express routes to the spy object.
 * @param {string} token Hipchat API token
 * @param {string} url Full base URL of webhooks
 * @param {name} name Bots name
 */
function middlewareSpy(token, url, name)
{
  var spy     = new HipchatSpy(token, url, name);
  var emitter = new EventEmitter();
  var router  = new Router();

  // Add on ability to setup rooms
  router.addRoom = function(room) {
    return spy.addRoom(room);
  };

  // Expose the emitter
  router.emitter = emitter;

  // Setup all routes
  Object.keys(HipchatSpy.EVENTS).forEach(function(key) {
    var event = HipchatSpy.EVENTS[key];
    router.post('/' + spy.eventName(event), function(req, res, next) {
      var message = req.body;

      switch (message.event) {
        case 'room_enter':
          debug('room_enter: %s', message.item.sender.id);
          break;
        case 'room_exit':
          debug('room_exit: %s', message.item.sender.id);
          break;
        case 'room_message':
          debug('room_message: %s: %s',
            message.item.from.name,
            message.item.message.message);
          break;
        case 'room_notification':
          break;
        case 'room_topic_change':
          break;
      }

      emitter.emit(event, message);
      res.send(200);
    });
  });

  return router;
}
