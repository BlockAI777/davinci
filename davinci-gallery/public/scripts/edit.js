// DAVINCI

var session = {};

function setViewStatus(txt, warn=false){
	console.log(txt);
	if(warn){ txt = '<warn>'+txt+'</warn>'; }
	$('view-status').innerHTML = txt;
}

function setViewAction(txt='PUT ON SALE', wait=false){
	$('card-edit').innerHTML = txt;
	$('card-edit').disabled = wait;
}

function onSaleOption(opt) {
	return;
	/*
	switch(opt) { 
		case 0: $('sale-price').innerHTML = 'Sale Price'; 
				$('auction-ini-box').style.visibility = 'hidden';
				$('auction-end-box').style.visibility = 'hidden';
				$('sale-warn').innerHTML = 'Collectible is available for sale';
				break;
		case 1: $('sale-price').innerHTML = 'Reserve Price';
				$('auction-ini-box').style.visibility = 'visible';
				$('auction-end-box').style.visibility = 'visible';
				$('sale-warn').innerHTML = 'All auctions end at midnight UTC';
				break;
		case 2: $('sale-price').innerHTML = 'Sale Price'; 
				$('auction-ini-box').style.visibility = 'hidden';
				$('auction-end-box').style.visibility = 'hidden';
				$('sale-warn').innerHTML = 'Collectible is not available for sale';
				break;
	}
	*/
}

async function onItemSave(address) {
	console.log('Save token', address);
	let item = session.item;
	console.log('Item', item);

	if(item.original && item.available==0){
		setViewStatus('Not copies available, nothing to update', true);
		return;
	}

	// SAVE TOKEN CHANGES
	// Info: name, desc, tags, onsale, saletype, saleprice, royalties, unlockcode
	let saleopt  = document.querySelector('input[name="saletype"]:checked').value;
	let saletype = ['direct','auction','nosale'].indexOf(saleopt);
	let onsale   = saleopt!='nosale';
	console.log('Onsale?', onsale);

	let input = {
		name        : $('token-name').value,
		desc        : $('token-desc').value,
		tags        : $('token-tags').value,
		onsale      : onsale,
		saletype    : saletype,
		price       : validNumber($('saleprice').value),
		royalties   : $('royalties').value,
		code        : $('unlockcode').value
	}

	if(!input.name){
		setViewStatus('Token name is required', true); 
		return;
	}

	if(input.price<1){
		setViewStatus('Price must be greater than zero', true); 
		return;
	}

	if(input.royalties<0){
		setViewStatus('Royalties can not be less than 0%', true); 
		return;
	}

	if(input.royalties>50){
		setViewStatus('Royalties can not be greater than 50%', true); 
		return;
	}

	var data = new FormData();
	data.append('address', address);

	// Not sold yet, can change token info
	if(item.original && item.available==item.copies){
		data.append('name',       input.name);
		data.append('description',input.desc);
		data.append('royalties',  input.royalties);
	}

	// If original and still copies available
	if(item.original && item.available>0){
		data.append('tags',       input.tags);
		data.append('unlockcode', input.code);
	}

	data.append('onsale',    input.onsale);
	data.append('saletype',  input.saletype);
	data.append('saleprice', input.price);

	// Check if original, save original or copy
	if(item.original){
		setViewStatus('Saving artwork, please wait...');
		res = await fetch('/api/artwork/', {method:'POST', body:data});
		ok  = await res.json();
		console.log('Save response', ok);
		if(!ok) {
			setViewStatus('Error saving artwork', true);
		    setViewAction('ERROR', true);
		    return;
		}

		if(onsale){
			// PUT ON SALE
			// Verify user gave us operator approval
			setViewStatus('Checking operator rights to sell');
		    setViewAction('WAIT', true);
			let approved = await isApproved(item.collection, item.type, item.owner, config.TransferProxy);
			if(approved) {
				setViewStatus('Davinci has operator rights to sell');
			} else {
				setViewStatus('Granting Davinci operator rights')
				let res = await approveSales(item.collection, item.type, config.TransferProxy);
				if(!res || res.error) { 
					setViewStatus('Error approving operator rights');
				    setViewAction();
					return; 
				}
				setViewStatus('Davinci granted operator rights to sell');
			}

			// Create sell order
			setViewStatus('Creating sell order, please wait...');
			res = await fetch('/api/neworder/'+item.address);
			jsn = await res.json();
			console.log('Order response', jsn);
			if(jsn.status=='CONFIRMED') {
				var data = new FormData();
				data.append('address', item.address);
				data.append('onsale', true);
				res = await fetch('/api/artwork', {method: 'post', body: data});
				jsn = await res.json();
				console.warn('Onsale', jsn);
				setViewStatus('Token saved and sell order updated');
		    	setViewAction('SUCCESS!', true);
		    	return;
			} else {
				setViewStatus('Error creating sell order', true);
			    setViewAction('ERROR', true);
			    return;
			}
		}
		setViewStatus('Token saved');
	    setViewAction('SUCCESS!', true);
	} else {
		// TODO: save copy
		setViewStatus('Not ready yet...', true);
		return; 
	}

	return;
}

async function onItemSend(address) {
	showSenderPopup();
}

async function onInactive() {
	if(session.item.copies!=session.item.available){ 
		setViewStatus('Token has been sold, can not be deleted', true);
		return;
	}
	let opt = confirm('Token will be deleted. Are you sure?');
	if(!opt){ return; }
	let res = await fetch('/api/inactive/'+session.item.address);
	let jsn = await res.json();
	console.log('Res', jsn);
	setViewStatus('Token has been deleted', true);
	$('button-inactive').innerHTML = 'TOKEN DELETED';
	$('button-inactive').disabled = true;
}

async function onRemove() {
	let opt = confirm('Token will be removed. Are you sure?');
	if(!opt){ return; }
	let res = await fetch('/api/remove/'+session.item.address);
	let jsn = await res.json();
	console.log('Res', jsn);
	setViewStatus('Token has been removed', true);
	$('button-inactive').innerHTML = 'TOKEN REMOVED';
	$('button-inactive').disabled = true;
}

async function recountTokens() {
    try {
		let res = await fetch('/api/counter/'+session.item.address);
		let jsn = await res.json();
		console.log('Recount', jsn);
		if(jsn.status == 'SUCCESS') { $('available').innerHTML = jsn.balance; }
    } catch(ex){ 
        console.log('Recount error:', ex);
    }
}

async function onReneged(bidid) {
	let opt = confirm('Auction will be invalidated. Are you sure?');
	if(!opt){ return; }
    setViewStatus('Invalidating auction, please wait...');
    try {
		let res = await fetch('/api/reneged/'+bidid);
		let jsn = await res.json();
		console.log('Reneged', jsn);
		if(jsn.status == 'SUCCESS') { setViewStatus('Auction has been invalidated'); }
		else { setViewStatus('Error invalidating auction'); }
    } catch(ex){ 
        console.log('Reneged error:', ex);
		setViewStatus('Error invalidating auction: '+ex.message);
    }
}

async function onResell(artwork) {
	if(!confirm('Do you want to create a resell order?')){ return; }
	if(typeof Davinci == 'undefined'){ setViewStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setViewStatus('Wallet not connected', true); return; }
	console.log('Reselling item', artwork);
	console.log('By user', Davinci.addrexx);


	let ownerid = Davinci.addrexx;
	let sellprice = validNumber($('saleprice').value);
	if(sellprice<1){
		setViewStatus('Price must be greater than zero', true); 
		return;
	}

	setViewStatus('Creating resell order, please wait...');
    setViewAction('WAIT', true);

    let now       = new Date();
	let item      = session.item;
    let ordertype = 0; // Direct sale for now. TODO: auctions

	var data = new FormData();
	data.append('startdate',   now.toJSON());
	data.append('enddate',     now.toJSON());
	data.append('owner',       ownerid);
	data.append('seller',      ownerid);
	data.append('ordertype',   ordertype);
	data.append('artwork',     artwork);
	data.append('sellprice',   sellprice);
	data.append('amount',      item.available);
	//data.append('tokentype',   item.tokentype);
	data.append('collection',  item.collection);
	data.append('tokenid',     item.tokenid);
	//data.append('royalties',   item.royalties);
	//data.append('beneficiary', item.beneficiary);
	data.append('status',      1);
	data.append('original',    false);

    try {
    	let res, jsn, opt;
		setViewStatus('Checking operator rights to sell');
	    setViewAction('WAIT', true);
		let approved = await isApproved(item.collection, item.type, item.owner, config.TransferProxy);
		if(approved) {
			setViewStatus('Davinci has operator rights to sell');
		} else {
			setViewStatus('Granting Davinci operator rights')
			res = await approveSales(item.collection, item.type, config.TransferProxy);
			if(!res || res.error) { 
				setViewStatus('Error approving operator rights');
			    setViewAction();
				return; 
			}
			setViewStatus('Davinci granted operator rights to sell');
		}

    	opt = { method: 'post', body: data };
		res = await fetch('/api/newresellorder', opt);
		jsn = await res.json();
		console.log('Order response', jsn);
		if(jsn.status=='CONFIRMED') {
			setViewStatus('Resell order created!');
	    	setViewAction('SUCCESS!', true);
	    	return;
		} else {
			setViewStatus('Error creating sell order - '+(jsn.message??'Unknown'), true);
		    setViewAction('ERROR', true);
		    return;
		}
    } catch(ex){ 
        console.log('Reselling error:', ex);
		setViewStatus('Error reselling token: '+ex.message);
    	setViewAction('ERROR', true);
    }    	
}

async function cancelOrder(artwork) {
	if(!confirm('Are you sure you want to cancel a resell order?')){ return; }
	if(typeof Davinci == 'undefined'){ setViewStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setViewStatus('Wallet not connected', true); return; }
	console.log('Cancelling order for item', artwork);
	console.log('By user', Davinci.addrexx);
	let ownerid = Davinci.addrexx;
	setViewStatus('Cancelling resell order, please wait...');
    setViewAction('WAIT', true);
    try {
    	let res, jsn, opt;
		res = await fetch('/api/cancelorder/'+artwork);
		jsn = await res.json();
		console.log('Order response', jsn);
		if(jsn.status=='CONFIRMED') {
			setViewStatus('Resell order cancelled!');
	    	setViewAction('SUCCESS!', true);
	    	return;
		} else {
			setViewStatus('Error cancelling order - '+(jsn.error??'Unknown'), true);
		    setViewAction('ERROR', true);
		    return;
		}
    } catch(ex){ 
        console.log('Cancelling error:', ex);
		setViewStatus('Error cancelling order: '+ex.message);
    	setViewAction('ERROR', true);
    }    	

}

async function main() {
	startDavinci();
	//recountTokens();
}

window.onload = main
