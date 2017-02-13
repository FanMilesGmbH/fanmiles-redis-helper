'use strict';

const _ = require('lodash');

let config = {
    sortedEventSetIdentifier: 'config.local',
    clientConfig: {
        host: 'localhost',
        port: '6379'
    }
};

try {
    const localConfig = require('./config.local');
    _.merge(config, localConfig);
} catch (e) {
    // missing local config
}

module.exports = config;
