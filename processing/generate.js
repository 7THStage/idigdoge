var fs = require('fs');

var contents = fs.readFileSync('./data.txt', 'utf8');
contents = contents.split('\n');

var payouts = {};
contents.forEach(function(line) {
	line = JSON.parse(JSON.parse(line));
	
	payouts[line.address] = (payouts[line.address] || 0) + parseFloat(line.amount);
});

for (var key in payouts) {
	// Always round up
	var n = (payouts[key] + 0.00000001).toString();
	n = n.substr(0, n.indexOf('.') + 9);
	
	payouts[key] = parseFloat(n);
}

fs.writeFileSync('./output.json', JSON.stringify(payouts, null, '\t'));
