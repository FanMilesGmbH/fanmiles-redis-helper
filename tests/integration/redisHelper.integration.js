'use strict';

// Libraries
const _ = require('lodash');
const expect = require('chai').expect;
const Promise = require('bluebird');

const redisHelper = require('../../src/redisHelper');
const config = require('../../config');

const async = Promise.coroutine;

// Systems under test
const getWriteEvent = redisHelper.getWriteEvent;
const getGetEvents = redisHelper.getGetEvents;
const client = redisHelper.getInstances(config).client;
// Tests

context('Integration tests for the redis helpers', () => {
  const sortedEventSetIdentifier = 'REDIS_HELPER_INTEGRATION_TEST/sortedEventSet';
  const getEventIdentifier = fileKey => `REDIS_HELPER_INTEGRATION_TEST/events:${fileKey}`;

  const deps = {
    client,
    sortedEventSetIdentifier,
    getEventIdentifier,
  };

  const writeEvent = getWriteEvent(deps);
  const getEvents = getGetEvents(deps);

  const bucket = 'bucketName';

  afterEach(async(function* afterEachHandler() {
    yield client.delAsync(sortedEventSetIdentifier);
  }));

  context('When writing an event to redis', () => {
    const key = 'someFile.csv';
    const timestamp = 10;

    const createEvent = () => ({
      bucket,
      key,
      timestamp,
    });

    const eventIdentifier = getEventIdentifier(key);

    beforeEach(async(function* beforeEachHandler() {
      yield writeEvent(createEvent());
    }));

    afterEach(async(function* afterEachHandler() {
      yield client.delAsync(eventIdentifier);
    }));

    it('should store the event', async(function* itHandler() {
      expect(yield client.hgetallAsync(eventIdentifier)).to.deep.equal({
        bucket,
        key,
        timestamp: timestamp.toString(),
      });
    }));

    it('should store the events key in the sorted event set', async(function* itHandler() {
      const storedEvents = yield client.zrangebyscoreAsync(sortedEventSetIdentifier, 0, timestamp);
      expect(storedEvents).to.deep.equal([getEventIdentifier(key)]);
    }));
  });

  context('When getting events from the redis event buffer', () => {
    const numberOfEvents = 10;
    const targetTime = 5;

    const getFileKey = index => `some-key-${index}`;

    const createEvent = index => ({
      bucket,
      key: getFileKey(index),
      timestamp: index,
    });

    let result;
    let allEventsLeftAfterSUT;

    beforeEach(async(function* beforeEachHandler() {
      yield Promise.all(_.times(numberOfEvents, i => writeEvent(createEvent(i))));

      result = yield getEvents(targetTime);
      allEventsLeftAfterSUT =
        yield client.zrangebyscoreAsync(sortedEventSetIdentifier, 0, numberOfEvents);
    }));

    afterEach(async(function* afterEachHandler() {
      const linesToRemove =
        _.times(numberOfEvents, i => getEventIdentifier(getFileKey(i + targetTime + 1)));
      yield client.delAsync(linesToRemove);
    }));

    it('should get the expected events', () => {
      const expectedEvents = _.times(targetTime + 1, i => _.extend(createEvent(i), {
        timestamp: `${i}`,
      }));

      expect(result).to.deep.equal(expectedEvents);
    });

    it('should delete the events from the buffer but leave the remaining events untouched', () => {
      const expectedEvents = _.times(numberOfEvents - targetTime - 1,
        i => getEventIdentifier(getFileKey(i + targetTime + 1)));

      expect(allEventsLeftAfterSUT).to.deep.equal(expectedEvents);
    });
  });

  context('limit amount of events to take', () => {
    const numberOfEvents = 10;
    const targetTime = 5;
    const limitAmount = 2;

    const getFileKey = index => `some-key-${index}`;

    const createEvent = index => ({
      bucket,
      key: getFileKey(index),
      timestamp: index,
    });

    let result;

    beforeEach(async(function* beforeEachHander() {
      yield Promise.all(_.times(numberOfEvents, i => writeEvent(createEvent(i))));

      result = yield getEvents(targetTime, limitAmount);
    }));

    afterEach(async(function* afterEachHandler() {
      const removeEvents =
        _.times(numberOfEvents, i => getEventIdentifier(getFileKey(i + targetTime + 1)));

      yield client.delAsync(removeEvents);
    }));


    it('should only take the limited number of events', () => {
      const expectedEvents = _.times(limitAmount, i => _.extend(createEvent(i), {
        timestamp: `${i}`,
      }));

      expect(result).to.deep.equal(expectedEvents);
    });
  });
});

