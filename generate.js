var log = require('./log');
var redis = require('./redis');
var config = require('./config');
var Stratum = require('./stratum');

// When I'm doing testing of other things, I don't need to bog down the pool server
exports.available = false;
exports.difficulty = 32;

if (!config.stratum.active) return;

// Set up some vars
var workEvents = [];
var validJobs = [];

var stratum = new Stratum(config.stratum, function() {
	var stratum = this;
	
	this.request('mining.subscribe', function(err, results) {
		if (err) return log.error('mining.subscribe', err);
		
		this.extraNonce1 = results[1];
		this.extraNonce2Size = results[2];
		
		this.request('mining.authorize', [stratum.config.username, stratum.config.password], function(err, results) {
			if (err) return log.error('mining.authorize', err);
			if (!results) return log.error('mining.authorize', 'failed');
		});
	});
});

stratum.on('mining.set_difficulty', function(message) {
	exports.difficulty = message.params[0];
	log.info('Difficulty Changed', exports.difficulty);
});

stratum.on('mining.notify', function(message) {
	var p = message.params;
	var work = {
		jobId: p[0]
		, previousHash: p[1]
		, coinBase1: p[2]
		, coinBase2: p[3]
		, extraNonce: this.extraNonce1
		, extraNonceSize: this.extraNonce2Size
		, merkleBranch: p[4]
		, version: p[5]
		, bits: p[6]
		, time: p[7]
		, cleanJobs: p[8]
	};
	
	// Clean jobs, if we're told to
	if (p[8]) validJobs.length = 0;
	
	// Add it to the valid jobs array
	if (validJobs.indexOf(p[0]) < 0) validJobs.push(p[0]);
	
	// Notify listeners
	for (var i = 0; i < workEvents.length; i += 1) {
		(workEvents[i])(work);
	}
});

function onWork(callback) {
	workEvents.push(callback);
};

function submitWork(params, callback) {
	// Don't bother if the job isn't valid anymore
	if (config.rejectAssumedStales && (validJobs.indexOf(params[1]) < 0)) return (typeof callback === 'function' ? callback('Stale Job') : false);
	
	stratum.request('mining.submit', params, callback);
};

exports.difficulty = 32;
exports.available = true;

exports.onWork = onWork;
exports.submitWork = submitWork;
