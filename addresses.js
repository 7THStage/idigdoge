var crypto = require('crypto');

var Big = require('bignumber.js');

var base58 = {
	zero: Big(0)
	, base: Big(58)
	, chars: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')
	, decode: function(string) {
		var r = Big(0);
		var m = Big(1);
		
		for (var i = (string.length - 1), c; i >= 0; i -= 1) {
			c = base58.chars.indexOf(string[i]);
			
			// Invalid character
			if (c < 0) return false;
			
			r = r.plus(m.times(c));
			m = m.times(base58.base);
		}
		
		r = r.toString(16);
		
		// Make sure it's a proper hex string
		if (r.length % 2) r = '0' + r;
		
		return r;
	}
};

function sha256(buf) {
	var hash = crypto.createHash('sha256');
	hash.update(buf);
	return hash.digest();
};

var dogeRegExp = /^D([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{33})$/;
function validAddress(string) {
	// Do a very basic regex check first
	if (!dogeRegExp.test(string)) return false;
	
	var decoded = base58.decode(string);
	
	// It failed, which means it's not valid
	if (!decoded) return false;
	
	// Get it to the correct length
	while (decoded.length < 50) {
		decoded = '0' + decoded;
	}
	
	// Make sure it's a Dogecoin address
	if (decoded.substr(0, 2) != '1e') return false;
	
	// Split into key and signature
	var key = decoded.substr(0, 42);
	var sig = decoded.substr(42, 8);
	
	// Calculate the checksum
	var checksum = sha256(sha256(new Buffer(key, 'hex')));
	
	// Check if they match
	if (sig == checksum.slice(0, 4).toString('hex')) return true;
	
	// It didn't, so there's something wrong
	return false;
};

module.exports = validAddress;
