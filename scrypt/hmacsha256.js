(function(){
	'use strict';
	
	var HEAP = new ArrayBuffer(196 + 96 + 64)
		, HEAP_N = new Uint8Array(HEAP, 0, 196)
		, HEAP_O = new Uint8Array(HEAP, 196, 96)
		, HEAP_KEY = new Uint8Array(HEAP, 292, 64);
	
	var sha256 = this.sha256;
	if (!sha256 && (typeof require !== 'undefined')) var sha256 = require('./sha256');
	
	var hmacsha256 = function(key, inout) {
		var hkey = HEAP_KEY
			, o = HEAP_O
			, n = HEAP_N
			, iol = inout.length
			, i;
		
		// This test isn't necessary for scrypt
//		if (key.length > 64)
		sha256(key, 80, hkey);
		
		// Clear to zeroes
		for (i = 32; i < 64; i++) {
			hkey[i] = 0;
		}
		
		// Start the process	
		i = 64;
		while (i--) {
			o[i] = 0x5c ^ hkey[i];
			n[i] = 0x36 ^ hkey[i];
		}
		
		// Replaces n.concat(inout)
		i = iol;
		while (i--) {
			n[64 + i] = inout[i];
		}
		
		sha256(n, 64 + iol, hkey);
		
		// Replaces o.concat(sha256(n))
		i = 32;
		while (i--) {
			o[64 + i] = hkey[i];
		}
		
		sha256(o, 96, inout);
	};
	
	if (typeof exports !== 'undefined') {
		module.exports = hmacsha256;
	} else {
		this.hmacsha256 = hmacsha256;
	}
}).call(this);
