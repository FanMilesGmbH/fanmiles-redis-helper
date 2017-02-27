'use strict';

// Libraries
const redis = require('redis');
const _ = require('lodash');
const Promise = require('bluebird');

const async = Promise.coroutine;

Promise.promisifyAll(redis.RedisClient.prototype);

// Handlers

function createWriteEventMethod(deps) {
  const client = deps.client;
  const sortedEventSetKey = deps.sortedEventSetIdentifier;
  const getEventIdentifier = deps.getEventIdentifier;

  return async(function* writeEvent(event) {
    const eventIdentifier = getEventIdentifier(event.key);

    yield client.zaddAsync(sortedEventSetKey, event.timestamp, eventIdentifier);

    yield client.hmsetAsync(eventIdentifier, _.flatten(_.toPairs(event)));
  });
}

function createTakeEventsMethod(deps) {
  const client = deps.client;
  const sortedEventSetKey = deps.sortedEventSetIdentifier;

  return async(function* takeEvents(timestamp, limit) {
    const range = yield client.zrangebyscoreAsync(sortedEventSetKey, 0, timestamp);

    return yield Promise.all(
      range.map((eventKey, index) => {
        if (limit && index >= limit) {
          return Promise.resolve(null);
        }

        return async(function* retrieveAndRemoveEventFromRedis() {
          const result = yield client.hgetallAsync(eventKey);

          // Remove event from sorted set
          yield client.zremAsync(sortedEventSetKey, eventKey);
          // Delete event
          yield client.delAsync(eventKey);

          return result;
        })();
      }))
      .then(responses => _.filter(responses));
  });
}

const getEventIdentifier = index => `events:${index}`;

// Exports

module.exports = {
  getEventIdentifier,
  createWriteEventMethod,
  createTakeEventsMethod,
  getInstances: (config) => {
    const client = redis.createClient(config.clientConfig);

    const dependencies = {
      client,
      sortedEventSetIdentifier: config.sortedEventSetIdentifier,
      getEventIdentifier,
    };

    return {
      client,
      writeEvent: createWriteEventMethod(dependencies),
      takeEvents: createTakeEventsMethod(dependencies),
      disconnect: () => client.quit(),
    };
  },
};
