#include <string.h>

#include "hmacsha256.hh"
#include "pbkdf2hmacsha256.hh"

void intify(unsigned char *destination, unsigned int offset, unsigned int i) {
	destination[offset] = i >> 24;
	destination[offset + 1] = i >> 16;
	destination[offset + 2] = i >> 8;
	destination[offset + 3] = i;
}

void f(unsigned char *destination, unsigned int offset, unsigned char *pass, unsigned int pl, unsigned char *salt, unsigned int sl, unsigned int index) {
	unsigned int i;
	unsigned char ur[32];
	unsigned char ui[132];
	
	// Reset ur
	memset(ur, 0, 32);
	
	// Copy salt into ui
	memcpy(ui, salt, sl);
	
	intify(ui, sl, index);
	
	HMACSHA256(pass, ui, (sl == 128 ? 132 : 84), ui);
	
	i = 32;
	while (i--) {
		ur[i] ^= ui[i];
	}
	
	// Copy ur into destination with offset
	memcpy(destination + offset, ur, 32);
}

void PBKDF2HMACSHA256(unsigned char *pass, unsigned int pl, unsigned char *salt, unsigned int sl, unsigned char *out, unsigned int ol) {
	unsigned int l = 32;
	if (ol > 32) l = ol;
	
	unsigned int i;
	unsigned int ti = 0;
	unsigned char t[4096];
	
	for (i = 1; i <= l; i += 1) {
		f(t, ti, pass, pl, salt, sl, i);
		ti += 32;
	}
	
	// Copy t into out
	memcpy(out, t, ol);
}
