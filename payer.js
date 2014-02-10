var log = require('./log');
var redis = require('./redis');
var config = require('./config');
var scrypt = require('./scrypt/scrypt').scrypt;

process.title = 'pyer';

function penalize(share) {
	// TODO: Something in this function.
};

function parseUserShare(share) {
	var scryptBuffer = new Buffer(share.scrypt, 'hex');
	
	// Check if it passes the difficulty test
	if (scryptBuffer[31] != 0 || scryptBuffer[30] > 6) return penalize(share);
	
	// Check if the scrypt matches
	var headerBuffer = new Buffer(share.header, 'hex');
	var myScrypt = scrypt(headerBuffer).toString('hex');
	
	if (share.scrypt != myScrypt) return penalize(share);
	
	// Make sure they haven't submitted this before
	redis.zscore('shares::accepted', share.header, function(err, score) {
		if (err) return log.error(err, share);
		if (score) return penalize(share);
		
		// TODO: Give them some reputation
		
		// Add it to the tracker
		redis.zadd('shares::accepted', Date.now(), share.header);
		
		// Add money to their account
		redis.zcount('shares::accepted', Date.now() - (1000 * 60 * 60), '+inf', function(err, count) {
			if (err) return log.error(err, share);
			
			// No dividing by zero!
			if (!count || count < 1) count = 1;
			
			// Calculate the payout
			var amount = (config.payouts.targetPerHour / count);
			if (amount > config.payouts.maxPerShare) amount = config.payouts.maxPerShare;
			
			// Figure out if this session has an email associated with it
			redis.get('session::' + share.session + '::email', function(err, email) {
				if (err) return log.error(err, share);
				
				// Save it to the proper place
				var key = null;
				if (email) key = 'balance::email::' + email;
				else key = 'balance::session::' + share.session;
				
				log.info(key + ' ' + amount);
				
				redis.incrbyfloat(key, amount);
			});
		});
	});
};

function mainLoop() {
	redis.lpop('shares::user', function(err, share) {
		if (err) return log.error(err);
		if (share) parseUserShare(JSON.parse(share));
	});
};

setInterval(mainLoop, 500);

// Cleanup

function cleanup() {
	redis.zremrangebyscore('shares::accepted', 0, Date.now() - config.cleanupIgnore, function(err, rem) {
		if (err) return log.error('Cleanup Error', err);
		
		log.info('Removed ' + rem + ' Old Shares');
		
		redis.bgrewriteaof(function(err) {
			if (err) return log.error('Background Rewrite Error', err);
		});
	});
};

var cleanTime = (process.env.NODE_CLEANUP || config.cleanupInterval);
if (cleanTime) {
	if (typeof cleanTime === 'string') cleanTime = parseInt(cleanTime, 10);
	if (typeof cleanTime === 'number' && !isNaN(cleanTime) && cleanTime > 0 && isFinite(cleanTime)) setInterval(cleanup, cleanTime);
}
