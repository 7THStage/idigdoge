var crypto = require('crypto');

var scrypt = require('./scrypt');

console.log('SCRYPT');

var iterations = 150;

var randomData = [];
for (var i = 0; i < 2048; i += 1) {
	randomData[i] = crypto.randomBytes(80);
}

// Convert to arrays (off the clock)
for (var i = 0, o, j; i < 2048; i += 1) {
	o = randomData[i];
	randomData[i] = [];
	for (j = 0; j < o.length; j += 1) {
		randomData[i][j] = o[j];
	}
}

var start = Date.now();
for (var i = 0, j; i < iterations; i += 1) {
	j = scrypt(randomData[i % 2048]);
}
console.log('Scrypt:', Date.now() - start);
console.log(((Date.now() - start) / iterations) + ' ms / iteration');
