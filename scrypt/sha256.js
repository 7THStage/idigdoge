(function(){
	'use strict';
	
	var HEAP = new ArrayBuffer(544)
		, HEAP_MSG = new Uint8Array(HEAP, 0, 256)
		, HEAP_W = new Uint32Array(HEAP, 256, 64)
		, HEAP_HASH = new Uint32Array(HEAP, 512, 8);
	
	var k = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
	
	var sha256 = function(origMsg, l, r) {
		l = (l || origMsg.length);
		
		var hash = HEAP_HASH
			, msg = HEAP_MSG
			, w = HEAP_W
			, nl = l + 9
			, olb = l * 8
			, i, o, x, s0, s1, ch, maj, temp1, temp2, a, b, c, d, e, f, g, h, j;
		
		// Figure out the size we need for the msg
		nl += (64 - (nl % 64));
		
		// Copy it so that we don't mess it up for other performers
		i = l;
		while (i--) {
			msg[i] = origMsg[i];
		}
		
		// Clean out any bad data
		for (i = l; i < 256; i++) {
			msg[i] = 0;
		}
		
		// Append the bit 1, followed by some zeros
		msg[l] = 0x80;
		
		// This function will only be used for short messages
		msg[nl - 2] = olb >> 8;
		msg[nl - 1] = olb;
		
		// Clear the hash back to it's initial state
		hash[0] = 0x6a09e667;
		hash[1] = 0xbb67ae85;
		hash[2] = 0x3c6ef372;
		hash[3] = 0xa54ff53a;
		hash[4] = 0x510e527f;
		hash[5] = 0x9b05688c;
		hash[6] = 0x1f83d9ab;
		hash[7] = 0x5be0cd19;
		
		for (o = 0; o < nl; o += 64) {
			// Squish the chunk into the first 16 values
			i = 16;
			while (i--) {
				w[i] = (msg[i * 4 + o] << 24)
					| (msg[i * 4 + o + 1] << 16)
					| (msg[i * 4 + o + 2] << 8)
					| msg[i * 4 + o + 3];
			}
			
			// Fill out the rest of the values
			for (x = 16; x < 64; x++) {
				s0 = (((j = w[x - 15]) >>> 7) | (j << 25))
					^ ((j >>> 18) | (j << 14))
					^ (j >>> 3);
				
				s1 = (((j = w[x - 2]) >>> 17) | (j << 15))
					^ ((j >>> 19) | (j << 13))
					^ (j >>> 10);
				
				w[x] = w[x - 16]
					+ s0
					+ w[x - 7]
					+ s1;
			}
			
			a = hash[0];
			b = hash[1];
			c = hash[2];
			d = hash[3];
			e = hash[4];
			f = hash[5];
			g = hash[6];
			h = hash[7];
			
			for (x = 0; x < 64; x++) {
				s1 = ((e >>> 6) | (e << 26))
					^ ((e >>> 11) | (e << 21))
					^ ((e >>> 25) | (e << 7));
				
				ch = (e & f)
					^ ((~e) & g);
				
				temp1 = h
					+ s1
					+ ch
					+ k[x]
					+ w[x];
				
				s0 = ((a >>> 2) | (a << 30))
					^ ((a >>> 13) | (a << 19))
					^ ((a >>> 22) | (a << 10));
				
				maj = (a & b)
					^ (a & c)
					^ (b & c);
				
				temp2 = s0 + maj;
				
				h = g;
				g = f;
				f = e;
				e = d + temp1;
				d = c;
				c = b;
				b = a;
				a = temp1 + temp2;
			}
			
			hash[0] += a;
			hash[1] += b;
			hash[2] += c;
			hash[3] += d;
			hash[4] += e;
			hash[5] += f;
			hash[6] += g;
			hash[7] += h;
		}
		
		i = 8;
		while (i--) {
			r[i * 4] = hash[i] >> 24;
			r[i * 4 + 1] = hash[i] >> 16;
			r[i * 4 + 2] = hash[i] >> 8;
			r[i * 4 + 3] = hash[i];
		}
	};
	
	if (typeof exports !== 'undefined') {
		module.exports = sha256;
	} else {
		this.sha256 = sha256;
	}
}).call(this);
