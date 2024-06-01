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

async function onBuyResell(obj) {
	console.log('Buy item', obj.dataset.address);
	console.log('Seller', obj.dataset.seller);
	let address = obj.dataset.address;
	let seller  = obj.dataset.seller;
	let res  = await fetch('/api/artwork/'+address);
	let item = await res.json();
	console.log('Item', item);
	if(!item || item.error){ alert('Item not found'); return; }
	session.artwork = item;
    let rex = await fetch(`/api/orderbyowner/${address}/${seller}`);
	let order = await rex.json();
	console.log('Order', order);
	if(!order || order.error){ alert('Order not found'); return; }
	session.order = order;
	onResell(obj, item, order);
}

async function onBidResell(obj) {
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