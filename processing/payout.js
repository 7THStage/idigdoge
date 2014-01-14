var fs = require('fs');

var RPC = require('../rpc');
var config = require('../config');

var rpc = new RPC.client(config.rpc);
var accountName = config.rpc.accountName;

var file = JSON.parse(fs.readFileSync('./output.json', 'utf8'));
var sum = 0;

for (var key in file) {
	sum += file[key];
}

console.log(sum, file);

// If your balance is in another account, move it
// rpc.request('move', ['Pool', accountName, 100], console.log);

// List your accounts
// rpc.request('listaccounts', [], console.log);

rpc.request('getbalance', [accountName], function(err, balance) {
	if (err) return console.log(err);
	
	console.log('Balance:', balance);
	console.log('Paying:', sum);
	
	if (balance < sum) return console.log('Not Enough Dogecoins In Account ' + accountName);
	
//	rpc.request('sendmany', [accountName, file, 1, 'Payouts On ' + Date.now()], console.log);
});
