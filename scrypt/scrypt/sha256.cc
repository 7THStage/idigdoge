#include <string.h>

#include "sha256.hh"

#define R(a, b) (((a) >> (b)) | ((a) << (32 - (b))))

const unsigned int kSHA256Constants[64] = {0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};
const unsigned int kSHA256Hash[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};

void SHA256(unsigned char *in, unsigned int l, unsigned int *hash) {
	unsigned int w[64];
	
	unsigned int i, o;
	unsigned int nl = (l + 9) + (64 - ((l + 9) % 64));
	unsigned int olb = l * 8;
	
	unsigned int s0, s1, j;
	
	unsigned int a, b, c, d, e, f, g, h;
	unsigned int temp1, temp2;
	
	unsigned char msg[256];
	
	// Copy the default hash into hash
	memcpy(hash, kSHA256Hash, 32);
	
	// Copy in to msg
	memcpy(msg, in, l);
	
	// Clear out the rest of msg
	memset(msg + l, 0, nl - l);
	
	msg[l] = 0x80;
	
	msg[nl - 2] = olb >> 8;
	msg[nl - 1] = olb;
	
	for (o = 0; o < nl; o += 64) {
		// Copy msg into w with offset
		memcpy(w, msg + o, 64);
		
		// Swap the endianness
		i = 16;
		while (i--) {
			w[i] = ((w[i] << 8) & 0xff00ff00) | ((w[i] >> 8) & 0xff00ff);
			w[i] = (w[i] << 16) | (w[i] >> 16);
		}
		
		for (i = 16; i < 64; i += 1) {
			j = w[i - 15];
			s0 = R(j, 7) ^ R(j, 18) ^ (j >> 3);
			
			j = w[i - 2];
			s1 = R(j, 17) ^ R(j, 19) ^ (j >> 10);
			
			w[i] = w[i - 16] + s0 + w[i - 7] + s1;
		}
		
		a = hash[0];
		b = hash[1];
		c = hash[2];
		d = hash[3];
		e = hash[4];
		f = hash[5];
		g = hash[6];
		h = hash[7];
		
		for (i = 0; i < 64; i += 1) {
			s0 = (e & f) ^ ((~e) & g);
			s1 = R(e, 6) ^ R(e, 11) ^ R(e, 25);
			
			temp1 = h + s0 + s1 + kSHA256Constants[i] + w[i];
			
			s0 = R(a, 2) ^ R(a, 13) ^ R(a, 22);
			s1 = (a & b) ^ (a & c) ^ (b & c);
			
			temp2 = s0 + s1;
			
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
	
	// Swap the endianness
	i = 8;
	while (i--) {
		hash[i] = ((hash[i] << 8) & 0xff00ff00) | ((hash[i] >> 8) & 0xff00ff);
		hash[i] = (hash[i] << 16) | (hash[i] >> 16);
	}
}
