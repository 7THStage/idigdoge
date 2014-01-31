module.exports = {
	// Google Analytics tracking ID
	analytics: 'UA-00000000-0'
	// How long sessions should be stored in the database, in milliseconds
	, sessionTimeout: 30 * 24 * 60 * 60 * 1000
	// How long withdrawal links will last, in milliseconds
	, withdrawTimeout: 24 * 60 * 60 * 1000
	// The maximum amount of time before a connection is closed when polling for new work, in milliseconds
	, pollTimeout: 30 * 1000
	// How often cleanup should be performed, in milliseconds; can also be set using NODE_CLEANUP
	, cleanupInterval: 6 * 60 * 60 * 1000
	// How many milliseconds of history cleanup should leave behind
	, cleanupIgnore: 2 * 60 * 60 * 1000
	// If a job is probably no longer valid, don't bother submitting it; may clash with some types of load balancing
	, rejectAssumedStales: true
	// Configuration for outgoing emails
	, email: {
		address: 'hello@example.com'
		// For information on transport and settings, see the documentation for nodemailer at https://github.com/andris9/Nodemailer#possible-transport-methods
		, transport: 'Sendmail'
		, settings: {}
	}
	// The default port for the API server; it can also be set using the NODE_PORT environment variable
	, server: {
		port: 9876
	}
	// It works on a predictive model, so configure these values appropriately for how much you have been making
	, payouts: {
		targetPerHour: 25
		, maxPerShare: 0.005
		, minWithdraw: 1
	}
	// The pool you're connecting to; set active to false when developing so you don't constantly disconnect and reconnect
	, stratum: {
		host: ''
		, port: 3333
		, username: ''
		, password: ''
		, active: true
	}
	// This is used for payouts in the processing/payout.js file; do not put your pool information here
	, rpc: {
		host: ''
		, port: 22555
		, username: ''
		, password: ''
		, accountName: ''
	}
};
