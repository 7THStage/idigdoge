(function(){
	'use strict';
	
	var HEAP = new ArrayBuffer(131424)
		, HEAP_V = new Uint8Array(HEAP, 0, 131072)
		, HEAP_T128 = new Uint8Array(HEAP, 131072, 128)
		, HEAP_T64 = new Uint8Array(HEAP, 131200, 64)
		, HEAP_X = new Uint8Array(HEAP, 131264, 128)
		, HEAP_DK = new Uint8Array(HEAP, 131392, 32);
	
	var pbkdf2hmacsha256 = this.pbkdf2hmacsha256;
	if (!pbkdf2hmacsha256 && (typeof require !== 'undefined')) var pbkdf2hmacsha256 = require('./pbkdf2hmacsha256');
	
	var salsa208 = this.salsa208;
	if (!salsa208 && (typeof require !== 'undefined')) var salsa208 = require('./salsa208');
	
	var scryptBlockMix = function(B) {
		// TODO: See if I can swap the endianness here or earlier if necessary, so that it doesn't have to be done in salsa208 every call
		
		var T = HEAP_T64
			, i;
		
		// Copy B[0, 64] into T
		i = 64;
		while (i--) {
			T[i] = B[i];
		}
		
		// Replaces xorArray(B, 64, T, 0, 64);
		i = 64;
		while (i--) {
			T[i] ^= B[i + 64];
		}
		
		salsa208(T);
		
		// Replaces o = o.concat(X)
		i = 64;
		while (i --) {
			B[i] = T[i];
		}
		
		// Replaces xorArray(B, 64, T, 0, 64);
		i = 64;
		while (i--) {
			T[i] ^= B[i + 64];
		}
		
		salsa208(T);
		
		// Replaces o = o.concat(X);
		i = 64;
		while (i--) {
			B[64 + i] = T[i];
		}
	};
	
	var scrypt = function(P) {
		var X = HEAP_X
			, DK = HEAP_DK
			, V = HEAP_V
			, T = HEAP_T128
			, i
			, j
			, o;
		
		pbkdf2hmacsha256(P, P, 128, X);
		
		// Replaces scryptROMix(B);
		for (i = 0; i < 1024; i++) {
			// Replaces V = V.concat(X)
			o = i * 128;
			for (j = 0; j < 128; j++) {
				V[o + j] = X[j];
			}
			
			scryptBlockMix(X);
		}
		
		i = 1024;
		while (i--) {
			j = (((
				X[64]
				| (X[65] << 8)
				| (X[66] << 16)
				| (X[67] << 24)
			) >>> 0) & 1023) * 128;
			
			for (o = 0; o < 128; o++) {
				T[o] = V[j + o];
			}
			
			// Replaces xorArray(T, 0, X, 0, 128);
			for (j = 0; j < 128; j++) {
				X[j] ^= T[j];
			}
			
			scryptBlockMix(X);
		}
		
		pbkdf2hmacsha256(P, X, 32, DK);
		
		return DK;
	};
	
	if (typeof exports !== 'undefined') {
		module.exports = scrypt;
	} else {
		this.scrypt = scrypt;
	}
}).call(this);
