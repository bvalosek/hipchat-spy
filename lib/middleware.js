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
      emitter.emit(event, req.body);
      res.send(200);
    });
  });

  return router;
}
