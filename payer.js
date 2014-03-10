var log = require('./log');
var redis = require('./redis');
var config = require('./config');
var scrypt = require('./scrypt');

process.title = 'pyer';

var processedShareCount = false;

function cacheShareCount() {
	redis.zcount('shares::accepted', Date.now() - (1000 * 60 * 60), '+inf', function(err, count) {
		if (err) return log.error(err);
		
		// Prevent dividing by zero later on
		if (count < 1) processedShareCount = 1;
		else processedShareCount = count;
	});
};

// The main loop gets a custom error function so the whole looping thing isn't so annoying to do
function mainLoopError(delay, err) {
	if (err) log.error(err);
	
	if (delay) setTimeout(mainLoop, 500);
	else setImmediate(mainLoop);
};

function mainLoop() {
	if (processedShareCount === false) return mainLoopError(true);
	
	redis.lpop('shares::user', function(err, share) {
		if (err) return mainLoopError(true, err);
		if (!share) return mainLoopError(true);
		
		// So, we've got a share
		share = JSON.parse(share);
		
		// First, we check to make sure the share is valid
		var scryptBuffer = new Buffer(share.scrypt, 'hex');
		if (scryptBuffer[31] != 0 || scryptBuffer[30] > 6) return mainLoopError(false);
		
		var headerBuffer = new Buffer(share.header, 'hex');
		var checkScrypt = scrypt(headerBuffer).toString('hex');
		if (share.scrypt != checkScrypt) return mainLoopError(false);
		
		// Make sure they aren't submitting the same work twice
		redis.zscore('shares::accepted', share.header, function(err, score) {
			if (err) return mainLoopError(true, err);
			if (score) return mainLoopError(false);
			
			// Add it to the list
			redis.zadd('shares::accepted', Date.now(), share.header);
			
			// Find out if this session has an email associated with it or not
			redis.get('session::' + share.session + '::email', function(err, email) {
				if (err) return mainLoopError(true, err);
				
				// Figure out their payout
				var amount = (config.payouts.targetPerHour / processedShareCount);
				if (amount > config.payouts.maxPerShare) amount = config.payouts.maxPerShare;
				
				// Save it to the email balance when available, or the session when not
				var key;
				if (email) key = 'balance::email::' + email;
				else key = 'balance::session::' + share.session;
				
				log.info(key + ' ' + amount);
				
				// Finally, we actually increase the user's balance
				redis.incrbyfloat(key, amount, function(err) {
					if (err) return mainLoopError(true, err);
					
					// Everything went okay. Huzzah!
					setImmediate(mainLoop);
				});
			});
		});
	});
};

// We want to run this once right away
cacheShareCount();

// We also want to run it every couple of minutes so the numbers stay up to date
setInterval(cacheShareCount, 1000 * 60 * 2);

// We'll give it a second to get the share count, and then the main loop will run at top speed
setTimeout(mainLoop, 1000);

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

var cleanTime = (process.env.NODE_CLEANUP || config.cleanupInterval || false);
if (cleanTime) {
	if (typeof cleanTime === 'string') cleanTime = parseInt(cleanTime, 10);
	if (typeof cleanTime === 'number' && !isNaN(cleanTime) && cleanTime > 0 && isFinite(cleanTime)) {
		process.title = 'pyerc';
		setInterval(cleanup, cleanTime);
	}
}
