var nonce = 0;
var maxNonce = 0;
var header = new Uint8Array(80);
var scrypt = scrypt_module_factory();

var updated = Date.now();
var hashes = 0;

self.addEventListener('message', function(e) {
	switch (e.data.type) {
		case 'work': unpackWork(e.data); break;
	}
}, false);

function hex2Buf(str) {
	var r = [];
	
	for (var i = 0, x = str.length; i < x; i += 2) {
		r.push(parseInt(str.substr(i, 2), 16));
	}
	
	return r;
};

function buf2Hex(buf) {
	var r = '';
	
	for (var i = 0, x = buf.length; i < x; i += 1) {
		r += (buf[i] <= 0xf ? '0' : '') + buf[i].toString(16);
	}
	
	return r;
};

function unpackWork(msg) {
	nonce = msg.nonce[0];
	maxNonce = msg.nonce[1];
	
	var buf = hex2Buf(msg.data);
	
	// Copy it into the header
	for (var i = 0; i < 76; i += 1) {
		header[i] = buf[i];
	}
};

function workLoop() {
	var hashed;
	
	while (nonce < maxNonce) {	
		header[76] = nonce & 0xff;
		header[77] = (nonce >> 8) & 0xff;
		header[78] = (nonce >> 16) & 0xff;
		header[79] = (nonce >> 24) & 0xff;
		
		hashed = scrypt.crypto_scrypt(header, header, 1024, 1, 1, 32);
		
		// We're just doing a simple share system, so this is the only check
		if (hashed[31] == 0 && hashed[30] <= 6) {
			self.postMessage({
				type: 'submit'
				, header: buf2Hex(header)
				, scrypt: buf2Hex(hashed)
			});
		}
		
		// Increase the nonce
		nonce += 1;
		
		// Count how many hashes we've done
		hashes += 1;
		
		// Take a break every 5 seconds
		if (Date.now() - updated > 5000) break;
	}
	
	// Send a rate update if more than five seconds have passed
	if (Date.now() - updated > 5000) {
		self.postMessage({
			type: 'rate'
			, rate: (hashes / ((Date.now() - updated) / 1000))
		});
		
		updated = Date.now();
		hashes = 0;
	}
	
	// Do it all again in a tiny amount of time to allow for incoming messages
	setTimeout(workLoop, 25);
};

workLoop();
