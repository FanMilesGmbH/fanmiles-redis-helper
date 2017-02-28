# fanmiles-redis-helper
Helper functions for nodejs redis client.

# Table of Contents

- [About](#about)
- [Running tests](#running-tests)
- [Usage](#usage)

## <a name="about">About</a>
Redis helper is used as a wrapper around nodejs redis client. At FanMiles we used Redis as event aggregator.
The `writeEvent` function writes the event to the Redis.
The `getEvents` function retrieves all the events up until the passed timestamp and removes them from Redis.

## <a name="running-tests">Running tests</a>

For running integration tests you will need to have redis running. Run:

```bash
npm test
```

## <a name="usage">Usage</a>

Example usage:

```javascript
const redisHelper = require('fanmiles-redis-helper').getInstance({
    sortedEventSetIdentifier: 'events-identifier',
    clientConfig: {
        host: 'localhost',  // redis ip
        port: '6379'        // redis port
    }
});

const firstEvent = {
    bucket: 'sample-bucket',
    key: 'unique-event-key-1',
    timestamp: '1488211815510'
};

const secondEvent = {
    bucket: 'sample-bucket',
    key: 'unique-event-key-2',
    timestamp: '1488211815520'
};

const thirdEvent = {
    bucket: 'sample-bucket',
    key: 'unique-event-key-3',
    timestamp: '1488211815530'
};

// write some events to Redis
yield redisHelper.writeEvent(firstEvent);
yield redisHelper.writeEvent(secondEvent);
yield redisHelper.writeEvent(thirdEvent);

// retrieve events by timestamp
const eventsFromRedis = yield redisHelper.takeEvents(1488211815515);
// eventsFromRedis content
//  [{
//    "bucket": "sample-bucket",
//    "key": "unique-event-key-1",
//    "timestamp": "1488211815510"
//  }]

// retrieve events by timestamp and limit

const eventsFromRedis = yield redisHelper.takeEvents(1488211815530, 1);
// eventsFromRedis content
//  [{
//    "bucket": "sample-bucket",
//    "key": "unique-event-key-1",
//    "timestamp": "1488211815510"
//  }]
```
