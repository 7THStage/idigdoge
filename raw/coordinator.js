function urlencode(object) {
	var q = [];
	
	for (var key in object) {
		q.push(encodeURIComponent(key) + '=' + encodeURIComponent(object[key]));
	}
	
	return q.join('&');
};

function ajax(options) {
	options.method = options.method || 'GET';
	
	if (!options.url) return;
	var url = options.url;
	
	// Append the query string before anything else
	if (options.query) {
		if (typeof options.query === 'object') {
			url = (url + '?' + urlencode(options.query));
		} else {
			url = (url + '?' + options.query);
		}
	}
	
	// We have to set up handling before the caching
	function handleResponse(response, xmlhttp) {
		if (!xmlhttp) xmlhttp = null;
		
		if (response.error) {
			if (typeof options.error === 'function') options.error(response.error, response, xmlhttp);
		} else {
			if (typeof options.success === 'function') options.success(response.result, response, xmlhttp);
		}
		if (typeof options.complete === 'function') options.complete(response, xmlhttp);
	};
	
	options.type = options.type || 'json';
	
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.open(options.method, url, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var response = {
				status: 500
				, error: 'The server is currently unavailable.'
				, result: null
			};
			
			try {
				response = JSON.parse(xmlhttp.responseText);
			} catch (e) {}
			
			handleResponse(response, xmlhttp);
		}
	}
	
	if (options.type === 'json') {
		if ('setRequestHeader' in xmlhttp) {
			xmlhttp.setRequestHeader('Accept', 'application/json');
		}
	}
	
	if (options.body) {
		var body = options.body;
		
		if (typeof body === 'object') {
			if ('overrideMimeType' in xmlhttp) {
				xmlhttp.overrideMimeType('application/x-www-form-urlencoded');
			}
			
			if ('setRequestHeader' in xmlhttp) {
				xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			
			body = urlencode(body);
		}
		
		xmlhttp.send(body);
	} else xmlhttp.send();
};

function workerMessage(e) {
	var d = e.data;
	
	switch (d.type) {
		case 'rate':
			this.rateHistory.unshift(d.rate);
			if (this.rateHistory.length > 5) this.rateHistory.pop();
			
			rate.innerHTML = '<strong>' + Math.floor(workers.totalHashRate()) + '</strong><span>Hashes / Second</span>';
			break;
		case 'submit':
			delete d.type;
			
			ajax({
				method: 'post'
				, url: '/api/submit'
				, body: d
			});
			
			break;
	}
};

var workers = [];
var rate = document.getElementById('rate');

workers.stats = {};
workers.autoWorker = function() {
	if (this.totalHashRate() < 1) return;
	
	this.stats[this.length] = this.totalHashRate();
	
	var stop = false;
	if (this.length >= 4) stop = true;
	if (this.stats[this.length] < (this.stats[this.length - 1] * 1.2)) stop = true;
	
	// Keep adding
	if (!stop) return this.addWorker();
	
	// Done adding
	clearInterval(this.autoInterval);
	
	// Remove the last worker
	this.removeWorker();
	
	// Analytics, because data is fun for me
	var hashRate = Math.floor(this.stats[this.length]);
	ga('send', 'event', 'hashrate', 'js', this.length, hashRate);
};

workers.totalHashRate = function() {
	var sum = 0;
	var i, j, x, y, avg;
	
	x = this.length;
	for (i = 0; i < x; i += 1) {
		y = this[i].rateHistory.length;
		if (y > 0) {
			avg = 0;
			for (j = 0; j < y; j += 1) {
				avg += this[i].rateHistory[j];
			}
			sum += (avg / y);
		}
	}
	
	return sum;
};

workers.addWorker = function() {
	var worker = new Worker('/public/worker.js');
	
	worker.rateHistory = [];
	
	worker.addEventListener('message', workerMessage, false);
	
	workers.push(worker);
	workers.getwork();
};

workers.removeWorker = function() {
	workers.pop().terminate();
};

workers.sendwork = function(data) {
	var workSize = Math.floor(0xffffffff / this.length);
	var nonceOffset = 0;
	
	for (var i = 0; i < this.length; i += 1) {
		this[i].postMessage({
			type: 'work'
			, data: data
			, nonce: [nonceOffset, nonceOffset += workSize]
		});
	}
};

workers.pollwork = function() {
	ajax({
		url: '/api/work'
		, query: {
			poll: 'true'
		}
		, success: (function(data) {
			// Connection timed out, reload right away
			if (!data) return setTimeout(this.pollwork.bind(this), 250);
			
			this.sendwork(data);
			setTimeout(this.pollwork.bind(this), 10000);
		}).bind(this)
		, error: (function() {
			setTimeout(this.pollwork.bind(this), 15000);
		}).bind(this)
	});
};

workers.getwork = function() {
	// Get the first batch, or when a worker is added, then start polling
	ajax({
		url: '/api/work'
		, success: (function(data) {
			this.sendwork(data);
			this.pollwork();
		}).bind(this)
		, error: (function() {
			setTimeout(this.getwork.bind(this), 15000);
		}).bind(this)
	});
};

if (typeof Worker === 'undefined') {
	// Not Supported
	notify('Mining is not supported in this browser. Please update to the latest version.');
	ga('send', 'event', 'nosupport', 'noworker', {
		nonInteraction: 1
	});
} else if (typeof Uint8Array === 'undefined') {
	// Not Supported
	notify('Mining is not supported in this browser. Please update to the latest version.');
	ga('send', 'event', 'nosupport', 'notypedarrays', {
		nonInteraction: 1
	});
} else if ((/(iphone|ipad|android|ios)/i).test(window.navigator.userAgent)) {
	// Phone or Tablet
	notify('Mining is not supported on mobile devices. Please use a desktop or laptop computer.');
} else {
	// Check endianness
	var et = new ArrayBuffer(4);
	var etu8 = new Uint8Array(et);
	var etu32 = new Uint32Array(et);
	
	etu8[0] = 1;
	
	// True if little endian
	if (etu32[0] == 1) {
		workers.addWorker();
		workers.autoInterval = setInterval(workers.autoWorker.bind(workers), 30000);
	} else {
		notify('Mining is not yet supported on this computer. Sorry!');
		ga('send', 'event', 'nosupport', 'bigendian', {
			nonInteraction: 1
		});
	}
}

function updateBalance() {
	ajax({
		url: '/api/balance'
		, success: function(amount) {
			amount = Math.floor(amount * 1000) / 1000;
			document.getElementById('balance-amount').innerHTML = amount;
		}
	});
};
updateBalance(); setInterval(updateBalance, 60000);

function notify(message, c) {
	var notice = document.createElement('div');
	var noticeID = 'notice' + Math.random().toString().substr(2);
	
	notice.id = noticeID;
	notice.className = 'notice' + (c ? ' ' + c : '');
	notice.innerHTML = message;
	
	document.getElementById('header').appendChild(notice);
	
	setTimeout(function() {
		notice.parentNode.removeChild(notice);
	}, 5000);
};

document.getElementById('email-form').addEventListener('submit', function(e) {
	if ('preventDefault' in e) e.preventDefault();
	
	var email = document.getElementById('email').value;
	ajax({
		method: 'post'
		, url: '/api/email'
		, body: {
			email: email
		}
		, success: function() {
			notify('Your email has been saved.', 'success');
			updateBalance();
		}
		, error: function(message) {
			notify(message, 'error');
		}
	});
	
	return false;
}, false);

function withdraw() {
	ajax({
		url: '/api/withdraw'
		, success: function(message) {
			notify(message, 'success');
		}
		, error: function(message) {
			notify(message, 'error');
		}
	});
	
	return false;
};

// Auto-Refresh
setTimeout(function() {
	window.location.reload();
}, 1000 * 60 * 60 * 2);
