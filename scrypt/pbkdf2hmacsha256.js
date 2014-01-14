(function(){
	'use strict';
	
	var HEAP = new ArrayBuffer(4096 + 32 + 132)
		, HEAP_T = new Uint8Array(HEAP, 0, 4096)
		, HEAP_Ur = new Uint8Array(HEAP, 4096, 32)
		, HEAP_Ui_84 = new Uint8Array(HEAP, 4128, 84)
		, HEAP_Ui_132 = new Uint8Array(HEAP, 4128, 132);
	
	var hmacsha256 = this.hmacsha256;
	if (!hmacsha256 && (typeof require !== 'undefined')) var hmacsha256 = require('./hmacsha256');
	
	var intify = function(dest, offset, i) {
		dest[offset] = i >> 24;
		dest[offset + 1] = i >> 16;
		dest[offset + 2] = i >> 8;
		dest[offset + 3] = i;
	};
	
	var f = function(dest, offset, password, salt, blockIndex) {
		var Ur = HEAP_Ur
			, Ui = (salt.length == 128 ? HEAP_Ui_132 : HEAP_Ui_84)
			, i;
		
		// Clear out Ur
		i = 32;
		while (i--) {
			Ur[i] = 0;
		}
		
		// Copy
		i = salt.length;
		while (i--) {
			Ui[i] = salt[i];
		}
		
		intify(Ui, salt.length, blockIndex);
		
		// This loop not required for our usage of scrypt
//		for (i = 0; i < count; i++) {
			hmacsha256(password, Ui);
			
			i = 32;
			while (i--) {
				Ur[i] ^= Ui[i];
			}
//		}
		
		// Copy
		i = 32;
		while (i--) {
			dest[i + offset] = Ur[i];
		}
	};
	
	var pbkdf2hmacsha256 = function(password, salt, dkLen, DK) {
		var l = (dkLen > 32 ? dkLen : 32)
			, T = HEAP_T
			, i
			, tiOffset = 0;
		
		for (i = 1; i <= l; i++) {
			f(T, tiOffset, password, salt, i);
			tiOffset += 32;
		}
		
		// This check is not applicable to scrypt
		// if (r < 32) {
			// Copy
			i = dkLen;
			while (i--) {
				DK[i] = T[i];
			}
		// }
		// return T;
	};
	
	if (typeof exports !== 'undefined') {
		module.exports = pbkdf2hmacsha256;
	} else {
		this.pbkdf2hmacsha256 = pbkdf2hmacsha256;
	}
}).call(this);
