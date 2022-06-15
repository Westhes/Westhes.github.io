[].forEach.call(document.querySelectorAll('.preview'), function(elem) {
	// Grab parent since preview is most likely always contained in an <a> block.
	elem.parentElement.onmouseover = function(event) {
		const promise = elem.play();
		elem.loop = true;

		// Ignore error messages.
		if (promise !== null)
			promise.catch(() => {});
	};
	elem.parentElement.onmouseout = function(event) {
		elem.pause();
		elem.currentTime = 0;
	};
});