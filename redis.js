var redis = require('redis');

var log = require('./log');
var config = require('./config');

var client = redis.createClient(config.redis || '');

// For serving up fast error pages if it's down
client.ready = false;

client.on('ready', function() {
	log.info('Redis Is Ready');
	
	this.ready = true;
});

client.on('error', function(err) {
	log.error('Redis Is Down', err);
	
	this.ready = false;
});

module.exports = client;
