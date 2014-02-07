var http = require('http');

function RPCClient(config) {
	this.config = config;
	
	this.authHeader = 'Basic ' + new Buffer(this.config.username + ':' + this.config.password).toString('base64');
};

RPCClient.prototype.request = function(method, params, callback) {
	var content = {
		version: 1.1
		, method: method
		, id: 1
		, params: params || []
	};
	
	content = JSON.stringify(content);
	content = new Buffer(content);
	
	var headers = {
		Authorization: this.authHeader
		, 'Content-type': 'application/json'
		, 'Content-length': content.length
	};
	
	var request = http.request({
		host: this.config.host
		, port: this.config.port
		, method: 'POST'
		, path: '/'
		, headers: headers
	}, function(response) {
		var chunks = [];
		var status = response.statusCode;
		
		response.on('data', function(chunk) {
			chunks.push(chunk);
		});
		
		response.on('end', function() {
			var data = null;
			
			if (status !== 200) {
				var error = status;
				
				if (chunks.length > 0) {
					error = Buffer.concat(chunks)
					error = error.toString('utf8');
				}
				
				return (callback ? callback(error) : false);
			}
			
			// Make sure we got some data
			if (chunks.length > 0) {
				data = Buffer.concat(chunks)
				data = data.toString('utf8');
				data = JSON.parse(data);
			}
			
			// Make sure it's not an error
			if (data) {
				if (data.error) {
					if (callback) callback(data.error);
				} else {
					if (callback) callback(null, data.result);
				}
			}
		});
	});
	
	request.on('error', function(err) {
		if (callback) callback(err);
	});
	
	request.write(content);
	request.end();
};

exports.client = RPCClient;
