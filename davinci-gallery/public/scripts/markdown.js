// md.js


// markdown('This is *bold* see?')
function markdown(text){
	function clean(text){
		return text.replace(/<(.*?)>/g, '');
	}

	function newline(text){
		return text.replace(/(.*?)\n/g, function match(i, txt){ return txt+'<br>'; });
	}

	function bold(text){
		return text.replace(/\*(.*?)\*/g, function match(i, txt){ return '<b>'+txt+'</b>'; });
	}

	function italic(text){
		return text.replace(/_(.*?)_/g, function match(i, txt){ return '<i>'+txt+'</i>'; });
	}

	function strike(text){
		return text.replace(/~(.*?)~/g, function match(i, txt){ return '<s>'+txt+'</s>'; });
	}

	function code(text){
		return text.replace(/`(.*?)`/g, function match(i, txt){ return '<code>'+txt+'</code>'; });
	}

	function ulist(text){
		return text.replace(/-(.*)?/g, function match(i, txt){ return '<li>'+txt+'</li>'; });
	}

	text = clean(text);
	text = newline(text);
	text = bold(text);
	text = italic(text);
	text = strike(text);
	text = code(text);
	//text = ulist(text);
	return text;
}

// END