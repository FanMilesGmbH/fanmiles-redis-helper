'use strict';

// Libraries
const redis = require('redis');
const _ = require('lodash');
const Promise = require('bluebird');
const async = Promise.coroutine;

Promise.promisifyAll(redis.RedisClient.prototype);

// Constants
const redisConfig = require('../config');
const clientConfig = redisConfig.clientConfig;
const sortedEventSetIdentifier = redisConfig.sortedEventSetIdentifier;

// Handlers

function getWriteEvent(deps) {

    const client = deps.client;
    const sortedEventSetKey = deps.sortedEventSetIdentifier;
    const getEventIdentifier = deps.getEventIdentifier;

    return async(function*(event) {

        const eventIdentifier = getEventIdentifier(event.key);

        yield client.zaddAsync(sortedEventSetKey, event.timestamp, eventIdentifier);

        yield client.hmsetAsync(
            eventIdentifier,
            _.flatten(_.toPairs(event))
        );

    });

}

function getGetEvents(deps) {

    const client = deps.client;
    const sortedEventSetKey = deps.sortedEventSetIdentifier;

    return async(function*(timestamp) {

        const range = yield client.zrangebyscoreAsync(sortedEventSetKey, 0, timestamp);

        return yield Promise.all(
            range.map(eventKey => {

                return async(function*() {

                    const result = yield client.hgetallAsync(eventKey);

                    // Remove event from sorted set
                    yield client.zremAsync(sortedEventSetKey, eventKey);
                    // Delete event
                    yield client.delAsync(eventKey);

                    return result;

                })();

            })
        );

    });

}

const getEventIdentifier = (index) => `events:${index}`;

// Exports

module.exports = {
    getEventIdentifier,
    sortedEventSetIdentifier,
    getWriteEvent,
    getGetEvents,
    getInstances: () => {
        const client = redis.createClient(clientConfig);

        const dependencies = {
            client,
            sortedEventSetIdentifier,
            getEventIdentifier
        };

        return {
            client,
            writeEvent: getWriteEvent(dependencies),
            getEvents: getGetEvents(dependencies),
            disconnect: () => client.quit()
        }
    }
};
