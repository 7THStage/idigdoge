function int2hex(i) {
	var s = i.toString(16);
	
	while (s.length < 8) {
		s = '0' + s;
	}
	
	return s.substr(6, 2) + s.substr(4, 2) + s.substr(2, 2) + s.substr(0, 2);
};

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
	} else {
		xmlhttp.send();
	}
};

function workerMessage(e) {
	var d = e.data;
	
	if (typeof d === 'string') {
		// Submit
		ajax({
			method: 'POST'
			, url: '/api/submit'
			, body: {
				header: d.substr(0, 160)
				, scrypt: d.substr(160, 64)
			}
		});
	} else {
		// Calculate rate
		var hashesPerSecond = e.target.workSize / ((Date.now() - e.target.startedWork) / 1000);
		
		e.target.rateHistory.unshift(hashesPerSecond);
		if (e.target.rateHistory.length > 5) e.target.rateHistory.pop();
		
		// Figure out the optimal work size
		e.target.workSize = Math.floor(hashesPerSecond * 5);
		
		// Send new work
		workers.sendWork(e.target);
	}
};

var workers = [];

workers.workCache = false;
workers.awaitingWork = [];

var rate = document.getElementById('rate');
var pnaclBlock = document.getElementById('pnacl-block');

workers.addWorker = function() {
	// That's the maximum
	if (workers.length >= 10) return;
	
	if (navigator.mimeTypes['application/x-pnacl']) workers.type = 'PNACL';
	else workers.type = 'JS';
	
	switch (workers.type) {
		case 'JS':
			var worker = new Worker('/public/worker.js');
			
			// Defaults
			worker.workSize = 1000;
			worker.rateHistory = [];
			worker.addEventListener('message', workerMessage, true);
			
			workers.push(worker);
			workers.sendWork(worker);
			
			break;
		case 'PNACL':
			var worker = document.createElement('embed');
			
			// Defaults
			worker.workSize = 1000;
			worker.rateHistory = [];
			worker.setAttribute('src', '/public/module.nmf');
			worker.setAttribute('type', 'application/x-pnacl');
			
			worker.addEventListener('load', function() {
				workers.sendWork(worker);
			}, false);
			worker.addEventListener('message', workerMessage, false);
			
			pnaclBlock.appendChild(worker);
			workers.push(worker);
			
			break;
	}
	
	// Get work if we don't have any
	if (workers.type && !workers.workCache) workers.getWork();
	
	// Update the intensity label
	document.getElementById('intensity-label').innerHTML = workers.length;
};

workers.removeWorker = function() {
	// Nothing to remove
	if (workers.length == 0) return;
	
	switch (workers.type) {
		case 'JS':
			workers.pop().terminate();
			
			break;
		case 'PNACL':
			var worker = workers.pop();
			worker.parentNode.removeChild(worker);
			
			break;
	}
	
	// Update the intensity label
	document.getElementById('intensity-label').innerHTML = workers.length;
};

workers.sendWork = function(worker) {
	if (!workers.workCache) return workers.awaitingWork.push(worker);
	
	worker.startedWork = Date.now();
	
	var message = workers.workCache.data + int2hex(workers.workCache.nonce) + int2hex(workers.workCache.nonce += worker.workSize);
	
	worker.postMessage(message);
};

workers.pollWork = function() {
	ajax({
		url: '/api/work'
		, query: {
			poll: 'true'
		}
		, success: function(data) {
			// Only send work if it was successful
			if (data) {
				workers.workCache.data = data;
				workers.workCache.nonce = 0;
			}
			
			workers.pollWork();
		}
		, error: function() {
			setTimeout(workers.pollWork, 10000);
		}
	});
};

workers.getWork = function() {
	ajax({
		url: '/api/work'
		, success: function(data) {
			// Only send work if it was successful
			if (data) {
				if (!workers.workCache) workers.workCache = {};
				
				workers.workCache.data = data;
				workers.workCache.nonce = 0;
				
				for (var i = 0; i < workers.awaitingWork.length; i += 1) {
					workers.sendWork(workers.awaitingWork[i]);
				}
				
				workers.awaitingWork.length = 0;
			}
			
			workers.pollWork();
		}
		, error: function() {
			setTimeout(workers.getWork, 5000);
		}
	});
};

workers.getHashRate = function() {
	var i, j, x, a;
	
	// Figure out how many actually have any rates already
	var count = 0;
	for (i = 0; i < workers.length; i += 1) {
		j = workers[i];
		
		if (j.rateHistory && j.rateHistory.length > 0) count += 1;
	}
	
	if (count == 0) return false;
	
	// There's at least one, so let's do a proper calculation
	var sum = 0;
	for (i = 0; i < workers.length; i += 1) {
		j = workers[i].rateHistory;
		
		if (j.length > 0) {
			a = 0;
			
			for (x = 0; x < j.length; x += 1) {
				a += j[x];
			}
			
			sum += (a / j.length);
		}
	}
	
	return sum;
};

workers.updateHashRate = function() {
	if (workers.length == 0) return rate.innerHTML = '<strong>-</strong><span>Not Mining</span>';
	
	var hashRate = workers.getHashRate();
	
	if (!hashRate) return rate.innerHTML = '<strong>-</strong><span>Warming Up</span>';
	else rate.innerHTML = '<strong>' + (hashRate / 1000).toFixed(3) + '</strong><span>Kilohashes</span>';
};
setInterval(workers.updateHashRate, 2500);

var doButtons = false;
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
	var btn = document.getElementById('start-btn');
	
	btn.style.display = 'block';
	btn.onclick = function() {
		if (confirm('Mining on mobile may have unexpected side effects, including battery usage and heat production. Please use carefully!')) {
			workers.addWorker();
			workers.updateHashRate();
			
			// Remove the buton
			btn.parentNode.removeChild(btn);
			
			// Show the up / down arrows
			document.getElementById('intensity').style.display = 'block';
		}
	};
	
	doButtons = true;
} else {
	workers.addWorker();
	workers.updateHashRate();
	
	// Show the up / down arrows
	document.getElementById('intensity').style.display = 'block';
	
	doButtons = true;
}

// Add click events to the up / down arrows
if (doButtons) {
	document.getElementById('up-btn').onclick = function() {
		if (workers.length < 10) workers.addWorker();
		else notify('Ten is the maxiumum intensity.');
	};
	
	document.getElementById('down-btn').onclick = function() {
		if (workers.length > 0) workers.removeWorker();
	};
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

// Track Hash Rates Every Two Minutes
setInterval(function() {
	var hashRate = workers.getHashRate();
	if (hashRate && hashRate > 1) {
		hashRate = Math.floor(hashRate);
		
		ga('send', 'event', 'hashrate', workers.type.toLowerCase(), workers.length, hashRate);
	}
}, 1000 * 60 * 2);
