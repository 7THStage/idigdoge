#include <string.h>

#include "salsa208.hh"
#include "pbkdf2hmacsha256.hh"

void blockMix(unsigned char *block) {
	unsigned int i;
	unsigned char t[64];
	
	i = 64;
	while (i--) {
		t[i] = block[i] ^ block[i + 64];
	}
	
	SALSA208((unsigned int *)t);
	
	// Copy t into block
	memcpy(block, t, 64);
	
	i = 64;
	while (i--) {
		t[i] ^= block[i + 64];
	}
	
	SALSA208((unsigned int *)t);
	
	// Copy t into block with an offset
	memcpy(block + 64, t, 64);
}

extern "C" void SCRYPT(unsigned char *in, unsigned char *out) {
	unsigned int i;
	unsigned int j;
	unsigned char x[128];
	unsigned char v[131072];
	unsigned char t[128];
	
	PBKDF2HMACSHA256(in, 80, in, 80, x, 128);
	
	for (i = 0; i < 1024; i += 1) {
		j = i * 128;
		
		// Copy x into v with an offset
		memcpy(v + j, x, 128);
		
		blockMix(x);
	}
	
	i = 1024;
	while (i--) {
		j = ((x[64] | (x[65] << 8) | (x[66] << 16) | (x[67] << 24)) & 1023) * 128;
		
		// Copy v into t with an offset
		memcpy(t, v + j, 128);
		
		for (j = 0; j < 128; j += 1) {
			x[j] ^= t[j];
		}
		
		blockMix(x);
	}
	
	PBKDF2HMACSHA256(in, 80, x, 128, out, 32);
}
