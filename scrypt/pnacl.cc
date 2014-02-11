#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"

#include "scrypt/scrypt.hh"

unsigned char HexValueForChar(const char i) {
	if (i == '0') return 0;
	else if (i == '1') return 1;
	else if (i == '2') return 2;
	else if (i == '3') return 3;
	else if (i == '4') return 4;
	else if (i == '5') return 5;
	else if (i == '6') return 6;
	else if (i == '7') return 7;
	else if (i == '8') return 8;
	else if (i == '9') return 9;
	else if (i == 'a') return 10;
	else if (i == 'b') return 11;
	else if (i == 'c') return 12;
	else if (i == 'd') return 13;
	else if (i == 'e') return 14;
	else return 15;
}

char HexCharForValue(const unsigned char i) {
	switch (i) {
		case 0: return '0'; break;
		case 1: return '1'; break;
		case 2: return '2'; break;
		case 3: return '3'; break;
		case 4: return '4'; break;
		case 5: return '5'; break;
		case 6: return '6'; break;
		case 7: return '7'; break;
		case 8: return '8'; break;
		case 9: return '9'; break;
		case 10: return 'a'; break;
		case 11: return 'b'; break;
		case 12: return 'c'; break;
		case 13: return 'd'; break;
		case 14: return 'e'; break;
		default: return 'f'; break;
	}
}

void HexStringToByteArray(std::string input, unsigned char *out, unsigned int l) {
	unsigned int i;
	unsigned int hl = l * 2;
	
	for (i = 0; i < hl; i += 2) {
		out[i / 2] = (HexValueForChar(input[i]) << 4) | HexValueForChar(input[i + 1]);
	}
}

std::string ByteArrayToHexString(unsigned char *input, unsigned int l) {
	unsigned int i;
	unsigned int hl = l * 2;
	
	char o[hl];
	
	for (i = 0; i < l; i += 1) {
		o[i * 2] = HexCharForValue(input[i] >> 4);
		o[i * 2 + 1] = HexCharForValue(input[i] & 0xf);
	}
	
	return std::string(o, o + hl);
}

class ScryptInstance : public pp::Instance {
public:
	explicit ScryptInstance(PP_Instance instance) : pp::Instance(instance) {}
	virtual ~ScryptInstance() {}
	
	virtual void HandleMessage(const pp::Var& var_message) {
		if (!var_message.is_string()) return;
		
		// Convert the message to a byte array
		unsigned char s[84];
		std::string message = var_message.AsString();
		HexStringToByteArray(message, s, 84);
		
		// Make some variables
		unsigned int i;
		unsigned int j;
		unsigned int start;
		unsigned int end;
		
		unsigned char send[112];
		std::string r;
		
		// Figure out our nonces
		start = s[76] | (s[77] << 8) | (s[78] << 16) | (s[79] << 24);
		end = s[80] | (s[81] << 8) | (s[82] << 16) | (s[83] << 24);
		
		unsigned char out[32];
		for (i = start; i <= end; i += 1) {
			s[76] = i & 0xff;
			s[77] = (i >> 8) & 0xff;
			s[78] = (i >> 16) & 0xff;
			s[79] = (i >> 24) & 0xff;
			
			SCRYPT(s, out);
			
			// It passes, so send it off
			if (out[31] == 0 && out[30] <= 6) {
				// Copy the header to the send data
				for (j = 0; j < 80; j += 1) {
					send[j] = s[j];
				}
				
				// Copy the hash to the send data
				for (j = 80; j < 112; j += 1) {
					send[j] = out[j - 80];
				}
				
				r = ByteArrayToHexString(send, 112);
				PostMessage(r);
			}
		}
		
		// Trigger a new work message
		PostMessage(false);
	}
};

class ScryptModule : public pp::Module {
public:
	ScryptModule() : pp::Module() {}
	virtual ~ScryptModule() {}
	
	virtual pp::Instance* CreateInstance(PP_Instance instance) {
		return new ScryptInstance(instance);
	}
};

namespace pp {
	Module* CreateModule() {
		return new ScryptModule();
	}
}
