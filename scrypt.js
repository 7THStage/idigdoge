var config = require('./config');

switch (config.scrypt) {
	case 'CUSTOM':
		var scrypt = require('./scrypt/scrypt');
		module.exports = scrypt.scrypt;
		break;
	default:
		var scrypt = require('scrypt');
		module.exports = function(buffer) {
			return scrypt.kdf(buffer, { N: 1024, r: 1, p: 1 }, 32, buffer).hash;
		};
		break;
}
