var jade = require('jade');
var http = require('http');
var crypto = require('crypto');
var mailer = require('nodemailer');

var log = require('../log');
var redis = require('../redis');
var config = require('../config');
var generate = require('../generate');
var scrypt = require('../scrypt/scrypt');

var transport = mailer.createTransport(config.email.transport, config.email.settings);

function middleware(req, res, next) {
	var send = res.send;
	
	res.send = function(body) {
		res.send = send;
		
		var status = 200;
		
		// Get everything in the proper variable
		if (arguments.length == 2) {
			if (typeof body !== 'number' && typeof arguments[1] === 'number') {
				status = arguments[1];
			} else {
				status = body;
				body = arguments[1];
			}
		}
		
		// If it's just a number, send the default message
		if (arguments.length == 1 && typeof body === 'number') {
			status = body;
			body = http.STATUS_CODES[body];
		}
		
		// Send it as an error or result
		res.send(status, {
			status: status
			, error: (status == 200 ? null : body)
			, result: (status == 200 ? body : null)
		});
	};
	
	next();
};

var counter = 0;
var system = crypto.pseudoRandomBytes(4);
function createSession(ip) {
	if ((counter++) >= 0xffff) counter = 0;
	
	var r = new Buffer(crypto.pseudoRandomBytes(32));
	r.fill(0, 0, 14);
	
	ip = ip.split('.');
	if (ip.length == 4) {
		r[0] = parseInt(ip[0], 10) & 0xff;
		r[1] = parseInt(ip[1], 10) & 0xff;
		r[2] = parseInt(ip[2], 10) & 0xff;
		r[3] = parseInt(ip[3], 10) & 0xff;
	}
	
	r[4] = system[0];
	r[5] = system[1];
	r[6] = system[2];
	r[7] = system[3];
	
	r.writeUInt32BE((Date.now() & 0xffffffff) >>> 0, 8);
	r.writeUInt16BE(counter >>> 0, 12);
	
	return r.toString('hex');
};

function createAndSaveSession(req, res, callback) {
	req.session = createSession(req.ip);
	res.cookie('session', req.session, {
		maxAge: config.sessionTimeout
	});
	
	redis.set('session::' + req.session, '1', 'PX', config.sessionTimeout, callback);
};

function tag(req, res, next) {
	var session = req.cookies.session;
	
	if (!session) session = null;
	else if (typeof session !== 'string') session = null;
	else if (!(/^[a-f0-9]{64}$/).test(session)) session = null;
	
	// Not even gonna try
	if (!session) return createAndSaveSession(req, res, next);
	
	redis.exists('session::' + session, function(err, exists) {
		if (err) return res.send(500);
		if (!exists) return createAndSaveSession(req, res, next);
		
		req.session = session;
		next();
	});
};

var workCache;
var workPolls = [];
if (generate.available) generate.onWork(function(data) {
	log.info('Got New Work');
	
	workCache = data;
	
	for (var i = 0; i < workPolls.length; i += 1) {
		if (!workPolls[i].connection.destroyed) {
			// No need to send the default false
			clearTimeout(workPolls[i].pollTimeout)
			
			// Send them some work!
			sendWork(workPolls[i]);
		}
	}
	
	workPolls.length = 0;
});

function sha256crypto(buffer) {
	var hash = crypto.createHash('sha256');
	hash.update(buffer);
	return hash.digest();
};

function seb(buf) {
	var r = new Buffer(buf.length);
	
	for (var i = 0; i < Math.floor(buf.length / 4); i += 1) {
		r[i * 4] = buf[i * 4 + 3];
		r[i * 4 + 1] = buf[i * 4 + 2];
		r[i * 4 + 2] = buf[i * 4 + 1];
		r[i * 4 + 3] = buf[i * 4];
	}
	
	return r;
};

function seh(hex) {
	return seb(new Buffer(hex, 'hex')).toString('hex');
};

function sendWork(res) {
	var hr = workCache;
	
	// Create the coinbase
	var extraNonce2Hex = crypto.pseudoRandomBytes(hr.extraNonceSize).toString('hex');
	var coinbase = new Buffer(hr.coinBase1 + hr.extraNonce + extraNonce2Hex + hr.coinBase2, 'hex');
	
	// Figure out the merkle root
	var merkleRoot = sha256crypto(sha256crypto(coinbase));
	for (var i = 0, b; i < hr.merkleBranch.length; i += 1) {
		b = new Buffer(hr.merkleBranch[i], 'hex');
		merkleRoot = sha256crypto(sha256crypto(Buffer.concat([merkleRoot, b])));
	}
	
	// Create the header
	var header = seh(hr.version) + seh(hr.previousHash) + merkleRoot.toString('hex') + seh(hr.time) + seh(hr.bits);
	
	// Save it as valid work to the database
	redis.hmset('work::' + header, {
		session: res.req.session
		, job: hr.jobId
		, extraNonce2: extraNonce2Hex
	}, function(err) {
		redis.expire('work::' + header, 1800);
	});
	
	// Send it to the client
	res.send(header);
};

function work(req, res) {
	if (req.query.poll == 'true') {
		// Limit the connection time before just returning a false
		res.pollTimeout = setTimeout((function(){
			this.send(false);
			
			// Remove it from the list of connections to reply to
			var idx = workPolls.indexOf(this);
			if (idx >= 0) workPolls.splice(idx, 1);
		}).bind(res), config.pollTimeout);
		
		workPolls.push(res);
		return;
	}
	
	if (!workCache) return res.send(false);
	
	sendWork(res);
};

function balance(req, res) {
	redis.get('session::' + req.session + '::email', function(err, email) {
		if (err) return res.send(500);
		
		var key = null;
		if (email) key = 'balance::email::' + email;
		else key = 'balance::session::' + req.session;
		
		redis.get(key, function(err, balance) {
			if (err) return res.send(500);
			
			res.send(200, (balance || 0));
		});
	});
};

function hexLesserOrEqualTo(a, b) {
	var i, j, k, x;
	for (i = 0, x = Math.min(a.length, b.length); i < x; i += 1) {
		j = parseInt(a[i], 16);
		k = parseInt(b[i], 16);
		
		if (j < k) return true;
		if (j > k) return false;
	}
	
	return true;
};

function bigIntToHex(int, length) {
	var r = int.toString(16);
	
	while (r.length < length) {
		r = ('0' + r);
	}
	
	return r;
};

function submit(req, res) {
	// TODO: Check if the user IP is blocked
	// TODO: Check if the user session is blocked
	// TODO: Check if the user has a high reputation
	
	// Return as fast as possible
	res.send(true);
	
	// Gather up the data
	var userHeader = req.body.header;
	var userScrypt = req.body.scrypt;
	
	// Validate
	if (!(/^([a-f0-9]{160})$/).test(userHeader)) return;
	if (!(/^([a-f0-9]{64})$/).test(userScrypt)) return;
	
	// Check if that header could have come from that work data
	var myData = userHeader.substr(0, 152);
	
	// Check if it's work I sent out
	redis.exists('work::' + myData, function(err, exists) {
		if (err) return;
		if (!exists) return;
		
		// Save to the database
		var data = {
			ip: req.ip
			, session: req.session
			, header: userHeader
			, scrypt: userScrypt
		};
		
		redis.rpush('shares::user', JSON.stringify(data));
		
		// Reverse the hex
		var scryptRev = '';
		for (var i = 62; i >= 0; i -= 2) {
			scryptRev += userScrypt.substr(i, 2)
		}
		
		// Check if the scrypt is less than the pool target
		var targetHex = bigIntToHex(0x0000ffff00000000000000000000000000000000000000000000000000000000 / generate.difficulty, 64);
		
		if (hexLesserOrEqualTo(scryptRev, targetHex)) {
			redis.hgetall('work::' + myData, function(err, work) {
				if (err) return log.error(err);
				if (!work) return;
				
				log.info('Checking Share');
				
				// Check if the scrypt matches
				var headerBuffer = new Buffer(userHeader, 'hex');
				var myScrypt = new Buffer(scrypt(headerBuffer)).toString('hex');
				
				if (userScrypt != myScrypt) return log.info('Failed Scrypt Test');
				
				// Reverse the nonce
				var nonceRev = seh(userHeader.substr(152, 8));
				
				// Reverse the time
				var timeRev = seh(myData.substr(136, 8));
				
				// Prep the work
				params = [
					config.stratum.username
					, work.job
					, work.extraNonce2
					, timeRev
					, nonceRev
				];
				
				// Send the work
				generate.submitWork(params, function(err) {
					if (err) return log.error('Share Rejected', err);
					
					log.info('Share Accepted');
				});
			});
		}
	});
};

function email(req, res) {
	var email = req.body.email;
	if (typeof email !== 'string') return res.send(400);
	
	email = email.toLowerCase();
	
	if (email.length > 128) return res.send(400, 'We can only accept email addresses under 128 characters long! Please try another.');
	if (!(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/).test(email)) return res.send(400, 'That doesn\'t look like a valid email address.');
	
	// Transfer the balance from this session into their email's account
	redis.set('session::' + req.session + '::email', email, 'PX', config.sessionTimeout, function(err) {
		if (err) return;
		
		redis.get('balance::session::' + req.session, function(err, balance) {
			if (err) return;
			
			if (balance > 0) {
				redis.incrbyfloat('balance::email::' + email, balance, function(err) {
					if (err) return;
					
					redis.del('balance::session::' + req.session);
				});
			} else {
				redis.del('balance::session::' + req.session);
			}
		});
	});
	
	res.send(true);
};

function withdraw(req, res) {
	redis.get('session::' + req.session + '::email', function(err, email) {
		if (err) return res.send(500);
		if (!email) return res.send(400, 'You have to set an email address before you can withdraw!');
		
		redis.exists('withdraw::' + email, function(err, exists) {
			if (err) return res.send(500);
			if (exists) return res.send(400, 'You already have a pending withdrawal! Please check your inbox.');
			
			redis.get('balance::email::' + email, function(err, amount) {
				if (err) return res.send(500);
				if (amount < config.payouts.minWithdraw) return res.send(400, 'You must have at least ' + config.payouts.minWithdraw + ' Dogecoin' + (config.payouts.minWithdraw != 1 ? 's' : '') +' in your account before you can make a withdrawal!');
				
				var withdrawNumber = crypto.randomBytes(48).toString('hex');
				redis.set('withdraw::' + withdrawNumber, email, 'PX', config.withdrawTimeout, function(err) {
					if (err) return res.send(500);
					
					// To prevent anyone getting spammed using my service
					redis.set('withdraw::' + email, withdrawNumber, 'PX', config.withdrawTimeout);
					
					// Send the email
					var emailContent = jade.renderFile('./views/email.jade', {
						withdraw: withdrawNumber
					});
					
					transport.sendMail({
						to: email
						, from: ('I Dig Doge <' + config.email.address + '>')
						, subject: 'Withdraw Your Dogecoins!'
						, text: emailContent
					}
					, function(err, response) {
						if (err) return res.send(500);
						
						res.send('You should receive an email with instructions shortly!');
					});
				});
			});
		});
	});
};

exports.middleware = middleware;
exports.tag = tag;

exports.work = work;
exports.balance = balance;
exports.submit = submit;
exports.email = email;
exports.withdraw = withdraw;
