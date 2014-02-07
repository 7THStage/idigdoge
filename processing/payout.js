var fs = require('fs');

var log = require('../log');
var RPC = require('../rpc');
var config = require('../config');

var rpc = new RPC.client(config.rpc);
var accountName = config.rpc.accountName;

var file = JSON.parse(fs.readFileSync('./output.json', 'utf8'));
var sum = 0;

for (var key in file) {
	sum += file[key];
}

log.info(sum, file);

// If your balance is in another account, move it
// rpc.request('move', ['Pool', accountName, 100], log.info);

// List your accounts
// rpc.request('listaccounts', [], log.info);

rpc.request('getbalance', [accountName], function(err, balance) {
	if (err) return log.error(err);
	
	log.info('Balance:', balance);
	log.info('Paying:', sum);
	
	if (balance < sum) return log.error('Not Enough Dogecoins In Account ' + accountName);
	
//	rpc.request('sendmany', [accountName, file, 1, 'Payouts On ' + Date.now()], log.info);
});
