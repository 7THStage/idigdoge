var fs = require('fs');

var redis = require('../redis');
var config = require('../config');
var addresses = require('../addresses');

function home(req, res) {
	redis.get('session::' + req.session + '::email', function(err, email) {
		if(typeof email === 'string') {
			res.render('mine', {
				email: (typeof email === 'string' ? email : '')
			});
		} else {
			res.render('index', { email : ''});
		}
	});
};

function withdraw(req, res) {
	var id = (req.params.id || '');
	
	// Check the basics
	if (typeof id !== 'string'
		|| !(/^([a-f0-9]{96})$/).test(id)) return res.render('withdraw', {
		message: 'That doesn\'t look like a proper withdrawal link. If you\'re sure it\'s right, please feel free to contact us using the link at the bottom of the page.'
	});
	
	// Check if it's in the database
	redis.get('withdraw::' + id, function(err, email) {
		if (err || !email) return res.render('withdraw', {
			message: 'It looks like that withdrawal link has expired! If this keeps happening, please contact us using the link at the bottom of the page.'
		});
		
		return res.render('withdraw', {
			withdraw: id
		});
	});
};

function withdrawp(req, res) {
	var id = req.body.withdraw;
	var address = req.body.address;
	
	// Check the withdraw
	if (typeof id !== 'string'
		|| !(/^([a-f0-9]{96})$/).test(id)) return res.render('withdraw', {
		message: 'That doesn\'t look like a proper withdrawal link. If you\'re sure it\'s right, please feel free to contact us using the link at the bottom of the page.'
	});
	
	// Check the address structure
	if (typeof address !== 'string'
		|| address.length !== 34
		|| !addresses(address)) return res.render('withdraw', {
			withdraw: id
			, message: 'That address doesn\'t look like a Dogecoin address. Please make sure you copied the whole thing. If you\'re sure it\'s right, please feel free to contact us using the link at the bottom of the page.'
		});
	
	// Check if it's in the database
	redis.get('withdraw::' + id, function(err, email) {
		if (err || !email) return res.render('withdraw', {
			message: 'It looks like that withdrawal link has expired! If this keeps happening, please contact us using the link at the bottom of the page.'
		});
		
		// Get the amount for that email
		redis.get('balance::email::' + email, function(err, amount) {
			// TODO: Better error messages for these
			
			if (err) return res.send(500);
			if (amount < config.payouts.minWithdraw) return res.send(400);
			
			var transaction = {
				email: email
				, amount: amount
				, address: address
			};
			
			// Add the transaction to the withdraw list
			redis.rpush('withdraw', JSON.stringify(transaction), function(err) {
				if (err) return res.send(500);
				
				// Remove this withdraw link from the database (not hugely important since it expires anyway)
				redis.del('withdraw::' + id);
				redis.del('withdraw::' + email);
				
				// Subtract the amount from that email (just in case they mined shares, we don't want to set it to zero)
				redis.incrbyfloat('balance::email::' + email, -amount, function(err) {
					if (err) return res.send(500);
					
					// All good
					res.render('withdraw', {
						message: 'It all checks out! Your withdrawal has been added to the queue, and should be processed within 24 hours. Thanks again for using I Dig Doge!'
					});
				});
			});
		});
	});
};

exports.home = home;

exports.withdraw = withdraw;
exports.withdrawp = withdrawp;
