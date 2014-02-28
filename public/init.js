$(function(){
	var now = new Date().getTime();
	var launch = 1394728234000;
	var timeuntil = launch - now;

	console.log('now '+now);
	console.log('launch '+launch);

	console.log('millis '+timeuntil);

	var start = dhm(timeuntil);
	var start = start+":00";

   $('#countdown .timer').countdown({
    stepTime: 60,
    format: 'dd:hh:mm:ss',
    startTime: start,
    digitImages: 6,
    digitWidth: 53,
    digitHeight: 77,
    timerEnd: function() { alert('end!!'); },
    image: "public/digits.png"
  });
})

function dhm(t){
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = '0' + Math.floor( (t - d * cd) / ch),
        m = '0' + Math.round( (t - d * cd - h * ch) / 60000);
    return [d, h.substr(-2), m.substr(-2)].join(':');
}
