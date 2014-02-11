// Receives messages from JS and PNACL workers

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

// Some elements from the page

var rateBlock = document.getElementById('rate-block');
var pnaclBlock = document.getElementById('pnacl-block');
var miningBtn = document.getElementById('mining-toggle-btn');

// The actual worker object, based on a simple array

var workers = [];

// Some variables

workers.mode = 'OFF';
workers.workCache = false;
workers.awaitingWork = [];

workers.type = (function() {
	if (navigator.mimeTypes['application/x-pnacl']) return 'PNACL';
	if (typeof Worker !== 'undefined' && typeof ArrayBuffer !== 'undefined') return 'JS';
	
	// Send some messages to HQ, so we can learn more about compatibility
	if (typeof Worker === 'undefined') ga('send', 'event', 'nosupport', 'noworker', {
		nonInteraction: 1
	});
	if (typeof ArrayBuffer === 'undefined') ga('send', 'event', 'nosupport', 'notypedarrays', {
		nonInteraction: 1
	});
	
	// Not going to work
	return false;
})();

workers.autoStart = (function() {
	if (!workers.type) return false;
	if (looksMobile()) return false;
	
	return true;
})();

// Put the proper class on the body element, so the correct messages are displayed
if (workers.type) {
	if (workers.autoStart) document.body.className = 'auto';
	else document.body.className = 'optional';
} else document.body.className = 'unsupported';

// Some functions

workers.addWorker = function() {
	if (!workers.type) return;
	
	// Don't go over the maximum
	if (workers.length >= 8) return;
	
	var worker;
	
	switch (workers.type) {
		case 'JS':
			worker = new Worker('/public/worker.js');
			
			worker.workSize = 250;
			workers.sendWork(worker);
			break;
		case 'PNACL':
			worker = document.createElement('embed');
			worker.setAttribute('src', '/public/module.nmf');
			worker.setAttribute('type', 'application/x-pnacl');
			pnaclBlock.appendChild(worker);
			
			worker.workSize = 500;
			worker.addEventListener('load', function() {
				workers.sendWork(worker);
			}, false);
			break;
	}
	
	worker.rateHistory = [];
	
	workers.push(worker);
	
	worker.addEventListener('message', workerMessage, false);
	
	if (!workers.workCache) workers.getWork();
};

workers.removeWorker = function() {
	// Make sure there's something to remove
	if (!workers.length) return;
	
	var worker = workers.pop();
	
	switch (workers.type) {
		case 'JS':
			worker.terminate();
			break;
		case 'PNACL':
			worker.parentNode.removeChild(worker);
			break;
	}
};

workers.findOptimal = function() {
	workers.findOptimalTimeout = null;
	
	// Reset
	if (workers.length == 0) {
		workers.addWorker();
		workers.lastHashRate = 0;
		workers.findOptimalTimeout = setTimeout(workers.findOptimal, 20 * 1000);
		return;
	}
	
	// Don't go over the limit
	if (workers.length >= 8) return;
	
	// Figure out if the hash rate had a increase worth keeping
	var newHashRate = workers.getHashRate();
	if (newHashRate < (workers.lastHashRate * 1.1)) return workers.removeWorker();
	
	// Save the new hash rate
	workers.lastHashRate = newHashRate;
	
	// Add a new worker, and get ready to do it all again
	workers.addWorker();
	workers.findOptimalTimeout = setTimeout(workers.findOptimal, 30 * 1000);
};

workers.sendWork = function(worker) {
	if (!workers.workCache) return workers.awaitingWork.push(worker);
	
	worker.startedWork = Date.now();
	
	// Form the message
	var start = workers.workCache.nonce;
	var end = workers.workCache.nonce += worker.workSize;
	var msg = workers.workCache.data + int2hex(start) + int2hex(end);
	
	worker.postMessage(msg);
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

workers.updateInfo = function() {
	if (workers.length == 0) return rateBlock.innerHTML = '<strong>-</strong>Not Mining';
	
	var hashRate = workers.getHashRate();
	
	if (!hashRate) return rateBlock.innerHTML = '<strong>-</strong>Warming Up';
	else rateBlock.innerHTML = '<strong>' + significant4(hashRate / 1000) + '</strong>Kilohashes';
};
setInterval(workers.updateInfo, 2500);

workers.switchMode = function(nm) {
	// Check if we're supported
	if (!workers.type) return;
	
	if (workers.mode == 'AUTO' && nm != 'AUTO' && workers.findOptimalTimeout) {
		clearTimeout(workers.findOptimalTimeout);
		workers.findOptimalTimeout = null;
	}
	
	if (looksMobile() && nm != 'OFF') {
		if (!confirm('Mining on a mobile device will increase battery usage and heat production. Please use carefully!')) return;
	}
	
	switch (nm) {
		case 'OFF':
			while (workers.length) {
				workers.removeWorker();
			}
			
			miningBtn.innerHTML = 'Dig';
			miningBtn.onclick = function() {
				workers.switchMode('SLOW');
			};
			
			workers.mode = 'OFF';
			localStorage.setItem('mode', 'OFF');
			break;
		case 'AUTO':
			while (workers.length > 1) {
				workers.removeWorker();
			}
			
			if (workers.length) {
				workers.lastHashRate = 0;
				workers.findOptimalTimeout = setTimeout(workers.findOptimal, 15 * 1000);
			} else workers.findOptimal();
			
			miningBtn.innerHTML = 'Stop';
			miningBtn.onclick = function() {
				workers.switchMode('OFF');
			};
			
			workers.mode = 'AUTO';
			localStorage.setItem('mode', 'AUTO');
			break;
		case 'SLOW':
			if (workers.length > 1) {
				while (workers.length > 1) {
					workers.removeWorker();
				}
			} else if (workers.length == 0) workers.addWorker();
			
			miningBtn.innerHTML = 'Find Max Speed';
			miningBtn.onclick = function() {
				workers.switchMode('AUTO');
			};
			
			workers.mode = 'SLOW';
			localStorage.setItem('mode', 'SLOW');
			break;
	}
	
	workers.updateInfo();
};

if (workers.autoStart) {
	var savedMode = localStorage.getItem('mode');
	
	if (savedMode) workers.switchMode(savedMode);
	else workers.switchMode('SLOW');
} else workers.switchMode('OFF');

// Track Hash Rates Every Two Minutes
setInterval(function() {
	var hashRate = workers.getHashRate();
	if (hashRate && hashRate > 1) {
		hashRate = Math.floor(hashRate);
		
		ga('send', 'event', 'hashrate', workers.type.toLowerCase(), workers.length, hashRate);
	}
}, 1000 * 60 * 2);
