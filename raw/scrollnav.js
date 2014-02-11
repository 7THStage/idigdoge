// Pretty Scrolling

function getScrollY() {
	return (window.scrollY || document.body.scrollTop || document.body.parentNode.scrollTop);
};

function scrollSmoothly(goto) {
	var time = 300;
	var frames = 18;

	for (var i = 0; i < (frames - 1); i += 1) {
		setTimeout(function() {
			var remains = goto - getScrollY();
			var next = getScrollY() + (remains / (frames -= 1));

			window.scroll(0, next);
		}, Math.floor((time / frames) * i));
	}
};

function prettyLink(link, target) {
	link.addEventListener('click', function(e) {
		if ('preventDefault' in e) e.preventDefault();

		scrollSmoothly(target.offsetTop - (canFloatNav && window.innerWidth >= 611 ? 68 : 0));

		return false;
	}, false);
};

var links = document.getElementsByTagName('a');
for (var i = 0, x = links.length, o; i < x; i += 1) {
	o = links[i];

	// Scrollable
	if (o.href && o.href.indexOf('#') >= 0) {
		var id = o.href.substr(o.href.indexOf('#') + 1);
		var obj = document.getElementById(id);

		if (obj) prettyLink(o, obj);
	}
}

// Floating Navigation

// This variable is checked in the scrollSmoothly function
var canFloatNav = false;

// Inconsitent results on large mobile devices, so no fancy nav for them by default
// It means that some monitors with touch will cause it to cancel too, but they'll never know
if (!('ontouchstart' in window)) {
	canFloatNav = true;

	var navigation = document.getElementById('navigation');
	var navFloat = document.getElementById('nav-float');

	function floatNav() {
		if (getScrollY() >= (navigation.offsetTop - 10)) {
			navFloat.className = 'floating';
		} else {
			navFloat.className = '';
		}
	};

	window.addEventListener('scroll', floatNav, false);
	// window.addEventListener('gesturechange', floatNav, false);
	// window.addEventListener('touchmove', floatNav, false);
}
