var scrypt = require('./scrypt');

var HEAP = new ArrayBuffer(80);
var HEAP_HEADER = new Uint8Array(HEAP, 0, 80);

var headerData = [1,0,0,0,246,21,247,206,59,79,198,184,246,30,143,137,174,219,29,8,82,80,118,80,83,58,158,59,16,185,187,204,48,99,159,39,159,202,168,103,70,225,239,82,211,237,179,196,173,130,89,146,13,80,155,208,115,96,92,155,241,213,153,131,117,42,107,6,184,23,187,78,167,142,1,29,1,45,89,212];

for (var i = 0; i < 80; i += 1) {
	HEAP_HEADER[i] = headerData[i];
}

var test1 = Array.apply([], scrypt(HEAP_HEADER));
var test1Passed = (test1.join(',') == '217,235,134,99,255,236,36,28,47,177,24,173,183,222,151,168,44,128,59,111,244,109,87,102,121,53,200,16,1,0,0,0');

var test2 = Array.apply([], scrypt(HEAP_HEADER));
var test2Passed = (test2.join(',') == '217,235,134,99,255,236,36,28,47,177,24,173,183,222,151,168,44,128,59,111,244,109,87,102,121,53,200,16,1,0,0,0');

console.log('Scrypt Is Working:', ((test1Passed && test2Passed) ? 'Yes' : 'No'));
