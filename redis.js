var redis = require('redis');

var log = require('./log');
var config = require('./config');

//Compatibility with Heroku
if (process.env.REDISTOGO_URL) {
	log.info("Redis:"+rtg.auth.split(":")[0]+":"+rtg.auth.split(":")[1]);
	client.auth(rtg.auth.split(":")[1]);
	log.info('Using Addon REDISTOGO');
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
