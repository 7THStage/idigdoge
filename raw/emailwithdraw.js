// Saving of the email

document.getElementById('email-form').addEventListener('submit', function(e) {
	if ('preventDefault' in e) e.preventDefault();

	var email = e.target[0].value;
	ajax({
		method: 'POST'
		, url: '/api/email'
		, body: {
			email: email
		}
		, success: function() {
			notify('Your email has been saved.', 'success');
			updateBalance();
		}
		, error: function(message) {
			notify(message, 'error');
		}
	});

	return false;
}, false);

// Triggers the withdrawal email, and a message if it was successful or not

function withdraw() {
	ajax({
		url: '/api/withdraw'
		, success: function(message) {
			notify(message, 'success');
		}
		, error: function(message) {
			notify(message, 'error');
		}
	});

	return false;
};
