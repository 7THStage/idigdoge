var net = require('net');

function Stratum(config, ready) {
	this.config = config;
	
	this.next = 1;
	this.callbacks = {};
	this.events = {};
	
	this.isReady = false;
	this.ready = ready;
	this.delay = 35;
	this.connect();
	this.reconnect = false;
};

Stratum.prototype.connect = function() {
	var stratum = this;
	
	this.reconnect = false;
	this.connection = net.connect(this.config.port, this.config.host, function() {
		var data = '';
		
		this.setTimeout(1000 * 300);
		this.setKeepAlive(true, 1000 * 15);
		
		this.on('data', function(chunk) {
			// Reset the delay
			stratum.delay = 35;
			
			data += chunk.toString('utf8');
			
			var index = -1;
			while ((index = data.indexOf('\n')) >= 0) {
				var message = data.substr(0, index);
				data = data.substr(index + 1);
				
				message = JSON.parse(message);
				
				if (message.id > 0) {
					// Response
					var callback = stratum.callbacks[message.id];
					delete stratum.callbacks[message.id];
					
					if (typeof callback === 'function') {
						callback.apply(stratum, [message.error, message.result]);
					}
				} else {
					var event = message.method;
					
					if (typeof stratum.events[event] !== 'undefined') {
						var events = stratum.events[event];
						
						for (var i = 0; i < events.length; i += 1) {
							events[i].apply(stratum, [message])
						}
					} else {
						console.log('[INFO]', new Date().toJSON(), 'Stratum Unhandled Event', event);
					}
				}
			}
		});
		
		// Call the ready function
		stratum.isReady = true;
		
		var ready = stratum.ready.bind(stratum);
		ready();
	});
	
	this.connection.on('timeout', function() {
		console.log('[INFO]', new Date().toJSON(), 'Stratum Timeout', arguments);
		
		this.destroy();
	});
	
	this.connection.on('close', function() {
		// Don't double-reconnect
		if (stratum.reconnect) return;
		
		console.log('[INFO]', new Date().toJSON(), 'Stratum Closed', arguments);
		
		stratum.isReady = false;
		stratum.delay *= 2;
		
		stratum.reconnect = setTimeout(stratum.connect.bind(stratum), stratum.delay);
	});
	
	this.connection.on('error', function(err) {
		// Don't double-reconnect
		if (stratum.reconnect) return;
		
		console.log('[ERROR]', new Date().toJSON(), 'Stratum Error', err);
		
		stratum.isReady = false;
		stratum.delay *= 2;
		
		stratum.reconnect = setTimeout(stratum.connect.bind(stratum), stratum.delay);
	});
};

Stratum.prototype.request = function(method, params, callback) {
	if (!this.isReady) {
		if (typeof callback === 'function') {
			callback('Connection Not Ready');
		}
		
		console.log('[INFO]', new Date().toJSON(), 'Connection Not Ready');
		return;
	}
	
	// Get the variables in the right places
	if (typeof params === 'function') {
		callback = params;
		params = [];
	} else {
		params = (params || []);
	}
	
	// Build the request
	var requestNumber = (this.next += 1);
	
	var body = JSON.stringify({
		id: requestNumber
		, method: method
		, params: params
	}) + '\n';
	
	// Add the callback to the queue, if appropriate
	if (typeof callback === 'function') {
		this.callbacks[requestNumber] = callback;
	}
	
	this.connection.write(body);
};

Stratum.prototype.on = function(event, callback) {
	if (typeof this.events[event] === 'undefined') {
		this.events[event] = [];
	}
	
	this.events[event].push(callback);
};

module.exports = Stratum;
