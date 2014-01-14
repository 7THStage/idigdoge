var redis = require('redis');

var config = require('./config');

var client = redis.createClient(config.redis || '');

// For serving up fast error pages if it's down
client.ready = false;

client.on('ready', function() {
	console.log('Redis Is Ready');
	
	this.ready = true;
});

client.on('error', function(err) {
	console.log('Redis Is Down', err);
	
	this.ready = false;
});

module.exports = client;
