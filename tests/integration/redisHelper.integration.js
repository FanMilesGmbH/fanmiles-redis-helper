'use strict';

// Libraries
const _ = require('lodash');
const {
    expect
} = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');

const async = Promise.coroutine;

const config = require('../../config.local');

// Systems under test
const redisHelper = require('../../src/redisHelper');
const getWriteEvent = redisHelper.getWriteEvent;
const getGetEvents = redisHelper.getGetEvents;
const client = redisHelper.getInstances(config).client;
// Tests

context('Integration tests for the redis helpers', () => {

    const sortedEventSetIdentifier = 'REDIS_HELPER_INTEGRATION_TEST/sortedEventSet';
    const getEventIdentifier = (fileKey) => `REDIS_HELPER_INTEGRATION_TEST/events:${fileKey}`;

    const deps = {
        client,
        sortedEventSetIdentifier,
        getEventIdentifier
    };

    const writeEvent = getWriteEvent(deps);
    const getEvents = getGetEvents(deps);

    const bucket = 'bucketName';

    afterEach(async(function*() {
        yield client.delAsync(sortedEventSetIdentifier);
    }));

    context('When writing an event to redis', () => {

        const key = 'someFile.csv';
        const timestamp = 10;

        const createEvent = () => ({
            bucket,
            key,
            timestamp
        });

        const eventIdentifier = getEventIdentifier(key);

        beforeEach(async(function*() {
            yield writeEvent(createEvent());
        }));

        afterEach(async(function*() {
            yield client.delAsync(eventIdentifier);
        }));

        it('should store the event', async(function*() {
            expect(yield client.hgetallAsync(eventIdentifier)).to.deep.equal({
                bucket,
                key,
                timestamp: timestamp.toString()
            });
        }));

        it('should store the events key in the sorted event set', async(function*() {
            const storedEvents = yield client.zrangebyscoreAsync(sortedEventSetIdentifier, 0, timestamp);
            expect(storedEvents).to.deep.equal([getEventIdentifier(key)]);
        }));

    });

    context('When getting events from the redis event buffer', () => {

        const numberOfEvents = 10;
        const targetTime = 5;

        const getFileKey = (index) => `some-key-${index}`;

        const createEvent = (index) => ({
            bucket,
            key: getFileKey(index),
            timestamp: index
        });

        let result;
        let allEventsLeftAfterSUT;

        beforeEach(async(function*() {

            yield Promise.all(
                _.times(numberOfEvents, i => writeEvent(createEvent(i)))
            );

            result = yield getEvents(targetTime);
            allEventsLeftAfterSUT = yield client.zrangebyscoreAsync(sortedEventSetIdentifier, 0, numberOfEvents);

        }));

        afterEach(async(function*() {
            yield client.delAsync(
                _.times(numberOfEvents, i => getEventIdentifier(getFileKey(i + targetTime + 1)))
            );
        }));

        it('should get the expected events', () => {
            expect(result).to.deep.equal(
                _.times(targetTime + 1, i => _.extend(createEvent(i), {
                    timestamp: `${i}`
                }))
            );
        });

        it('should delete the events from the buffer but leave the remaining events untouched', () => {
            expect(allEventsLeftAfterSUT).to.deep.equal(
                _.times(numberOfEvents - targetTime - 1, i => getEventIdentifier(getFileKey(i + targetTime + 1)))
            );
        });

    });

});

