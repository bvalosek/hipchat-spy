# hipchat-spy

[![NPM version](https://badge.fury.io/js/hipchat-spy.png)](http://badge.fury.io/js/hipchat-spy)

Express middleware for monitoring activity in HipChat.

Automatically setup webhooks to listen for activity via a simple `EventEmitter`
interface.

## Installation

```
$ npm install hipchat-spy
```

## Usage

Create an express app:

```javascript
var express    = require('express');
var hipchatSpy = require('hipchat-spy');

var app = express();

```

Create a new spy middleware by passing in your HipChat API key and the full
(publicly accessible) URL that will serve as the base of all the webhooks:

```javascript
var spy = hipchatSpy('your-api-key', 'http://myapp.com/webhooks');
```

Mount the middleware in our express app under the URL prefix that matches with
the URL we gave our spy factory above:

```javascript
app.use('/webhooks', spy);
```

The spy has an `emitter` property that is an `EventEmitter` instance. Have the
spy listen in on a few rooms and respond to events (see [HipChat
docs](https://www.hipchat.com/docs/apiv2/webhooks) for all events):

```javascript
// Use the roomId or the room name
spy.addRoom(12351);
spy.addRoom('Software Development');

spy.emitter.on('room_message', function(message) {
  console.log(message);
});

spy.emitter.on('room_exit', function(info) {
  console.log(info);
});
```

## License

MIT

