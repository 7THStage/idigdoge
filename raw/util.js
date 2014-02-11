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

function significant4(n, trim) {
	// Try to convert it to a number
	if (typeof n !== 'number') {
		try {
			n = parseFloat(n);
		} catch (e) {
			n = 0;
		}
	}
	
	// Make sure we succeed
	if (typeof n !== 'number') n = 0;
	if (isNaN(n)) n = 0;
	
	// This doesn't take numbers less than 0
	if (n < 0) n = 0;
	
	var s = n.toFixed(3);
	var d = s.indexOf('.');

	// Shouldn't really happen, but check anyway
	if (d < 0) return s;

	// Big numbers
	if (d >= 4) return s.substr(0, d);

	// Smaller numbers
	if (trim) return s.substr(0, 5).replace(/(\.?[0]+)$/, '');

	return s.substr(0, 5);
};

function looksMobile() {
	if ((/(iphone|ipad|android|ios)/i).test(window.navigator.userAgent)) return true;
	return false;
};

function notify(message, c) {
	var notice = document.createElement('div');
	
	notice.className = 'notice' + (c ? ' ' + c : '');
	notice.innerHTML = message;
	
	document.body.appendChild(notice);
	
	setTimeout(function() {
		notice.parentNode.removeChild(notice);
	}, 5000);
};
