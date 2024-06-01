// ADMIN STUFF

async function categorize(address, category) {
	let res = await fetch('/api/categorize/'+address+'/'+category);
	let ok  = await res.json();
	console.log(ok);
}

// END