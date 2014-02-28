var redis = require('redis');

var log = require('./log');
var config = require('./config');

// var client = redis.createClient(config.redis || '');
if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var client = redis.createClient(rtg.port, rtg.hostname);
	client.auth(rtg.auth.split(":")[1]);
	log.info('Using Addon REDISTOGO on Heroku');
} else {
    var client = redis.createClient(config.redis || '');
}

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
