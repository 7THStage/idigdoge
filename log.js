function makeMessage(args) {
	var msgs = [];
	for (var i = 0, a; i < args.length; i += 1) {
		a = args[i];
		
		if (a === null) msgs.push('null');
		else if (a === undefined) msgs.push('undefined');
		else if (typeof a === 'boolean') msgs.push(a ? 'true' : 'false');
		else if (typeof a === 'string') msgs.push(a);
		else if (typeof a === 'number') msgs.push(a.toString());
		else if (typeof a === 'object') {
			try {
				if ('toString' in a) {
					msgs.push(JSON.stringify(a));
				}
			} catch (e) {}
		}
	}
	
	return msgs.join(' ');
};

exports.error = function() {
	console.log('[ERROR]', new Date().toJSON(), process.pid, makeMessage(arguments));
};

exports.info = function() {
	console.log('[INFO]', new Date().toJSON(), process.pid, makeMessage(arguments));
};
