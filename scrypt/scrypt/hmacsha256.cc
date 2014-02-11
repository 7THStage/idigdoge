#include <string.h>

#include "sha256.hh"
#include "hmacsha256.hh"

void HMACSHA256(unsigned char *key, unsigned char *in, unsigned int l, unsigned char *out) {
	unsigned char hkey[64];
	unsigned char o[96];
	unsigned char n[196];
	
	unsigned int ih;
	
	SHA256(key, 80, (unsigned int *)hkey);
	
	// Clear out the rest of the hkey
	memset(hkey + 32, 0, 32);
	
	ih = 64;
	while (ih--) {
		o[ih] = 0x5c ^ hkey[ih];
		n[ih] = 0x36 ^ hkey[ih];
	}
	
	// Copy in into n with offset
	memcpy(n + 64, in, l);
	
	SHA256(n, 64 + l, (unsigned int *)hkey);
	
	// Copy hkey into o with offset
	memcpy(o + 64, hkey, 32);
	
	SHA256(o, 96, (unsigned int *)out);
}
