// EXPLORE

let session = {
	wallet : null,    // user wallet
	address: null,    // token address
	artwork: null,	  // token fields
	page   : 0
};

async function onBuyNow(obj) {
	console.log('Buy address', obj.dataset.address);
	let adr  = obj.dataset.address;
	let res  = await fetch('/api/artwork/'+adr);
	let item = await res.json();
	console.log('Item', item);
	if(!item || item.error){ alert('Item not found'); return; }
	session.artwork = item;
	onBuyDirect(obj, item);
}

async function onBidNow(obj) {
	console.log('Bid address', obj.dataset.address);
	let adr  = obj.dataset.address;
	let res  = await fetch('/api/artwork/'+adr);
	let item = await res.json();
	console.log('Item', item);
	if(!item || item.error){ alert('Item not found'); return; }
	session.artwork = item;
	session.card = obj.parentNode.parentNode;
	onPlaceBid(obj, item);
}


async function main() {
	startDavinci();
	//extra
}

window.onload = main


// END