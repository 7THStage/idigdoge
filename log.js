function makeMessage(args) {
	var msgs = [];
	for (var i = 0, a; i < args.length; i += 1) {
		a = args[i];
		
		if (typeof a === 'string') msgs.push(a);
		else if (typeof a === 'number') msgs.push(a.toString());
		else if (typeof a === 'object' && 'toString' in a) msgs.push(a.toString());
	}
	
	return msgs.join(' ');
};

exports.error = function() {
	console.log('[ERROR]', new Date().toJSON(), process.pid, makeMessage(arguments));
};

exports.info = function() {
	console.log('[INFO]', new Date().toJSON(), process.pid, makeMessage(arguments));
};
