# fanmiles-redis-helper
Helper functions for nodejs redis client.

# Table of Contents

- [About](#about)
- [Configuration](#configuration)
- [Running tests](#running-tests)
- [Usage](#usage)

## <a name="about">About</a>
Redis helper is used as a wrapper around nodejs redis client. At FanMiles we used Redis as event aggregator.
The `writeEvent` function writes the event to the Redis.
The `getEvents` function retrieves all the events up until the passed timestamp and removes them from Redis.

## <a name="configuration">Configuration</a>

Copy `config.local.example.js` to `config.local.js` and change the variables according to your environment.

## <a name="running-tests">Running tests</a>

For running integration tests you will need to have redis running. Run:

```bash
npm test
```

## <a name="usage">Usage</a>

Example usage:

```javascript
const redisHelper = require('fanmiles-redis-helper').getInstances();

const firstEvent = {
    bucket: 'sample-bucket',    // to which bucket does this event belong to
    key: 'unique-event-key-1',  // just unique event key
    timestamp: 10               // timestamp used for retrieving
};

const secondEvent = {
    bucket: 'sample-bucket',    // to which bucket does this event belong to
    key: 'unique-event-key-2',  // just unique event key
    timestamp: 20               // timestamp used for retrieving
};

// write some events to Redis
yield redisHelper.writeEvent(firstEvent);
yield redisHelper.writeEvent(secondEvent);

// retrieve events
const eventsFromRedis = yield redisHelper.getEvents(15);
// eventsFromRedis content
//  [{
//    "bucket": "sample-bucket",
//    "key": "unique-event-key-1",
//    "timestamp": "10"
//  }]

```
