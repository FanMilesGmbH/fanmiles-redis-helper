'use strict';

const _ = require('lodash');

const config = {
  sortedEventSetIdentifier: 'config.local',
  clientConfig: {
    host: 'localhost',
    port: '6379',
  },
};

try {
  // eslint-disable-next-line import/no-unresolved, global-require
  const localConfig = require('./config.local');
  _.merge(config, localConfig);
} catch (e) {
    // missing local config
}

module.exports = config;
