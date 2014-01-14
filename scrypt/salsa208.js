(function(){
	'use strict';
	
	var HEAP = new ArrayBuffer(128)
		, HEAP_shortened = new Uint32Array(HEAP, 0, 16)
		, HEAP_x = new Uint32Array(HEAP, 64, 16);
	
	var salsa208 = function(input) {
		var shortened = HEAP_shortened
			, x = HEAP_x
			, i
			, j;
		
		// Start by converting the 8-bit values into 32-bit values
		i = 16;
		while (i--) {
			shortened[i] = input[i * 4]
				| (input[i * 4 + 1] << 8)
				| (input[i * 4 + 2] << 16)
				| (input[i * 4 + 3] << 24);
		}
		
		// Copy it from the shortened array
//		for (i = 0; i < 16; i++) {
//			x[i] = shortened[i];
//		}
		
		x[0] = shortened[0];
		x[1] = shortened[1];
		x[2] = shortened[2];
		x[3] = shortened[3];
		x[4] = shortened[4];
		x[5] = shortened[5];
		x[6] = shortened[6];
		x[7] = shortened[7];
		x[8] = shortened[8];
		x[9] = shortened[9];
		x[10] = shortened[10];
		x[11] = shortened[11];
		x[12] = shortened[12];
		x[13] = shortened[13];
		x[14] = shortened[14];
		x[15] = shortened[15];
		
		// Do the main salsa loop
		i = 4;
		while (i--) {
			x[4] ^= ((j = x[0] + x[12]) << 7) | (j >>> 25);
			x[8] ^= ((j = x[4] + x[0]) << 9) | (j >>> 23);
			
			x[12] ^= ((j = x[8] + x[4]) << 13) | (j >>> 19);
			x[0] ^= ((j = x[12] + x[8]) << 18) | (j >>> 14);
			
			x[9] ^= ((j = x[5] + x[1]) << 7) | (j >>> 25);
			x[13] ^= ((j = x[9] + x[5]) << 9) | (j >>> 23);
			
			x[1] ^= ((j = x[13] + x[9]) << 13) | (j >>> 19);
			x[5] ^= ((j = x[1] + x[13]) << 18) | (j >>> 14);
			
			x[14] ^= ((j = x[10] + x[6]) << 7) | (j >>> 25);
			x[2] ^= ((j = x[14] + x[10]) << 9) | (j >>> 23);
			
			x[6] ^= ((j = x[2] + x[14]) << 13) | (j >>> 19);
			x[10] ^= ((j = x[6] + x[2]) << 18) | (j >>> 14);
			
			x[3] ^= ((j = x[15] + x[11]) << 7) | (j >>> 25);
			x[7] ^= ((j = x[3] + x[15]) << 9) | (j >>> 23);
			
			x[11] ^= ((j = x[7] + x[3]) << 13) | (j >>> 19);
			x[15] ^= ((j = x[11] + x[7]) << 18) | (j >>> 14);
			
			x[1] ^= ((j = x[0] + x[3]) << 7) | (j >>> 25);
			x[2] ^= ((j = x[1] + x[0]) << 9) | (j >>> 23);
			
			x[3] ^= ((j = x[2] + x[1]) << 13) | (j >>> 19);
			x[0] ^= ((j = x[3] + x[2]) << 18) | (j >>> 14);
			
			x[6] ^= ((j = x[5] + x[4]) << 7) | (j >>> 25);
			x[7] ^= ((j = x[6] + x[5]) << 9) | (j >>> 23);
			
			x[4] ^= ((j = x[7] + x[6]) << 13) | (j >>> 19);
			x[5] ^= ((j = x[4] + x[7]) << 18) | (j >>> 14);
			
			x[11] ^= ((j = x[10] + x[9]) << 7) | (j >>> 25);
			x[8] ^= ((j = x[11] + x[10]) << 9) | (j >>> 23);
			
			x[9] ^= ((j = x[8] + x[11]) << 13) | (j >>> 19);
			x[10] ^= ((j = x[9] + x[8]) << 18) | (j >>> 14);
			
			x[12] ^= ((j = x[15] + x[14]) << 7) | (j >>> 25);
			x[13] ^= ((j = x[12] + x[15]) << 9) | (j >>> 23);
			
			x[14] ^= ((j = x[13] + x[12]) << 13) | (j >>> 19);
			x[15] ^= ((j = x[14] + x[13]) << 18) | (j >>> 14);
		}
		
		// Add the values together
//		for (i = 0; i < 16; i++) {
//			x[i] += shortened[i];
//		}
		
		x[0] += shortened[0];
		x[1] += shortened[1];
		x[2] += shortened[2];
		x[3] += shortened[3];
		x[4] += shortened[4];
		x[5] += shortened[5];
		x[6] += shortened[6];
		x[7] += shortened[7];
		x[8] += shortened[8];
		x[9] += shortened[9];
		x[10] += shortened[10];
		x[11] += shortened[11];
		x[12] += shortened[12];
		x[13] += shortened[13];
		x[14] += shortened[14];
		x[15] += shortened[15];
		
		// Convert it back to a byte array
		i = 16;
		while (i--) {
			input[i * 4] = x[i];
			input[i * 4 + 1] = x[i] >> 8;
			input[i * 4 + 2] = x[i] >> 16;
			input[i * 4 + 3] = x[i] >> 24;
		}
	};
	
	if (typeof exports !== 'undefined') {
		module.exports = salsa208;
	} else {
		this.salsa208 = salsa208;
	}
}).call(this);
