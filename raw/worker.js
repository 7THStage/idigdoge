var nonce = 0;
var maxNonce = 0;
var scrypt = (function() {
	var inputPTR = Module._malloc(80);
	var outputPTR = Module._malloc(32);

	var input = Module.HEAPU8.subarray(inputPTR, inputPTR + 80)
	var output = Module.HEAPU8.subarray(outputPTR, outputPTR + 32);

	var scrypt = Module.cwrap('SCRYPT', null, ['number', 'number']);

	return {
		input: input
		, output: output
		, hash: function() {
			scrypt(inputPTR, outputPTR);
		}
	};
})();

self.addEventListener('message', function(e) {
	unpackWork(e.data);
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
	var buf = hex2Buf(msg);
	
	// Copy it into the input
	for (var i = 0; i < 76; i += 1) {
		scrypt.input[i] = buf[i];
	}
	
	// Set the start and end
	nonce = (buf[76] | (buf[77] << 8) | (buf[78] << 16) | (buf[79] << 24)) >>> 0;
	maxNonce = (buf[80] | (buf[81] << 8) | (buf[82] << 16) | (buf[83] << 24)) >>> 0;
	
	workLoop();
};

function workLoop() {
	while (nonce < maxNonce) {	
		scrypt.input[76] = nonce & 0xff;
		scrypt.input[77] = (nonce >> 8) & 0xff;
		scrypt.input[78] = (nonce >> 16) & 0xff;
		scrypt.input[79] = (nonce >> 24) & 0xff;
		
		scrypt.hash();
		
		// We're just doing a simple share system, so this is the only check
		if (scrypt.output[31] == 0 && scrypt.output[30] <= 6) {
			self.postMessage(buf2Hex(scrypt.input) + buf2Hex(scrypt.output));
		}
		
		// Increase the nonce
		nonce += 1;
	}
	
	self.postMessage(false);
};
