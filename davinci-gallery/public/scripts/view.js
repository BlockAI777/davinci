// DAVINCI

var session = {};

function calcNextBid(price) {
	function zeroes(n) { return ''.padEnd(n,'0'); }
	let last = parseInt(price);
	if(last<20){ return last+1; }
	let text = last.toString();
	let l = text.length-2;
	let n = parseInt(text[0]);
	let p = parseInt(text[1]);
	if(n==1){ 
		p = p + 1; 
		if(p>9){ p=0; n=n+1; } 
	}
	else if(n==2){ 
		p = p + 2; 
		if(p>8){ p=0; n=n+1; } 
	}
	else if(n==3 || n==4){ 
		if(p>7){ n=n+1; p=0; }
		else if(p>4){ p=8; }
		else if(p>1){ p=5; }
		else { p=2; }
	}
	else { 
		if(p>4){ n=n+1; p=0; }
		else { p=5; }
	}
	let bid = parseInt(''+n+p+zeroes(l));
	return bid;
}

function setViewStatus(txt, warn=false){
	console.log(txt);
	if(warn){ txt = '<warn>'+txt+'</warn>'; }
	$('view-status').innerHTML = txt;
}

function setViewAction(txt='BUY NOW', wait=false){
	$('card-buy').innerHTML = txt;
	$('card-buy').disabled = wait;
}

function addBidToTable(date, bidder, price) {
	var tab = $('order-bids');
	var row = tab.insertRow(0);
	row.insertCell(0).innerHTML = date.toLocaleString();
	row.insertCell(1).innerHTML = bidder;
	row.insertCell(2).innerHTML = money(price) + ' ONE';
}

async function onBuyNow(address) {
	console.log('Buy now token', address);
	console.log('Buyer', Davinci.addrexx);
	buyConfirm();
}

async function onBidNow(address) {
	setViewStatus('Verifying bid...');
	console.log('Bidding on', address);
	console.log('Buyer', Davinci.addrexx);
	// verify price not underbid
	let amount = validNumber($('bidamount').value);
	if(!amount || amount==0){ setViewStatus('Bid can not be zero', true); return; }
	if(amount<parseFloat(session.item.lastbid)){ setViewStatus('Underbid, try a higher bid', true); return; }
	bidConfirm(amount);
}

async function buyConfirm() {
	let item = session.item;
	console.log('Sell item', item);
	console.log('Confirming sale', item.address);
	let seller = item.owner;
    let buyer  = Davinci.addrexx;
    console.log('Seller & buyer', seller, buyer);

	if(typeof Davinci == 'undefined'){ setViewStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setViewStatus('Wallet not connected', true); return; }

    if(seller==buyer){ 
		setViewStatus('You are the owner, can not buy this token', true);
    	return;
    }
    if(!item.onsale){
		setViewStatus('Token not for sale', true);
    	return;
    }
    if(item.available<1){
		setViewStatus('No more copies available', true);
    	return;
    }

	setViewStatus('Confirming sale...');
	setViewAction('WAIT', true);

	try {
    	let url   = '/api/orderbyartwork/'+item.address;
    	let res   = await fetch(url);
    	let order = await res.json();
    	console.log('Order', order);
        if(!order){ 
    		console.error('Order not found', order);
			setViewStatus('Sell order not created by owner yet', true);
			setViewAction();
			return;
    	}
    	let orderId = order.address;
    	console.log('OrderId', orderId);
    	console.log('Proxy', config.TransferProxy);

    	// Check approval
		let approved = await isApproved(item.collection, item.type, seller, config.TransferProxy);
		//let approved = await isApproved(item.collection, item.type, seller, config.Operator);
		//let approved = await isApproved(item.collection, item.type, seller, config.Market);
		console.log('Approved?', approved);
		if(!approved) { 
			setViewStatus('Order has not been approved by seller', true);
			setViewAction();
			return;
		}

		setViewStatus('Sending payment, please wait...');
	    adr = config.Market;
	    abi = Market3.abi
		//ctr = Harmony.contracts.createContract(abi, adr);
		ctr = await Davinci.contract(abi, adr);
		ctr.wallet = Davinci.wallet;
		wei = new Harmony.utils.Unit(item.saleprice).asOne().toWei();
		gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, value: wei, from: Davinci.address };
        console.log('Wei', wei.toString());
        console.log('Contract info', orderId, buyer, gas);
	    res = await ctr.methods.buy(orderId, buyer, 1).send(gas);
	    console.log('RES', res);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
	    	ok = res.status;
	    	txid = res.transactionHash;
		} else {
        	if (res.transaction.txStatus == 'REJECTED') { ok = false; }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else {
	            setViewStatus('Unknown status: '+res.transaction.txStatus, true);
	            setViewAction();
	            return;
	        }
	    	txid = res.transaction.id;
		}
	    console.log('OK', ok, txid);

        if (ok) {
        	// Add token copies to owners table
        	// Davinci.api.buy(orderid, buyer, tokenid, qty)
			var data = new FormData();
			data.append('address',    item.address);
			data.append('collection', item.collection);
			data.append('tokenid',    item.tokenid);
			data.append('tokentype',  item.type);
			data.append('seller',     seller);
			data.append('ownerid',    buyer);
			data.append('copies',     1);
			data.append('total',      item.copies);
			data.append('available',  1);
			data.append('onsale',     false);
			data.append('saletype',   0);
			data.append('saleprice',  item.saleprice);
			data.append('updateqty',  true);

        	if(item.copies==1){
				console.log('Change owner from', seller, 'to', buyer);
				res = await fetch('/api/changeowner', {method: 'POST', body: data});
				jsn = await res.json();
				console.log('Change owner resp', jsn);
				if(jsn.error) { 
					console.log('Change owner error: ', jsn.error); 
				}
        	}

            try {
				console.log('Save new owner', buyer);
				res = await fetch('/api/saveowner', {method: 'POST', body: data});
				jsn = await res.json();
				console.log('Response', jsn);
				if(jsn.error) { 
					console.log('Save owner error: ', jsn.error); 
				} else {
					console.log('Ownership saved', jsn);
				}
            } catch(ex1){
                console.warn('Error saving owner', ex1);
                console.warn('Owner record', data);
            }

			// Save Transfer
            try {
				console.log('Saving transfer...', item.address);
				var xfer = new FormData();
				xfer.append('txhash',     txid);
				xfer.append('orderid',    orderId);
				xfer.append('sender',     seller);
				xfer.append('receiver',   buyer);
				xfer.append('tokentype',  item.type);
				xfer.append('collection', item.collection);
				xfer.append('tokenid',    item.tokenid);
				xfer.append('value',      item.saleprice);
				xfer.append('artwork',    item.address);

				res = await fetch('/api/transfer', {method: 'POST', body: xfer});
				jsn = await res.json();
				console.log('Xfer response', jsn);
				if(jsn.error) { 
					console.log('Xfer error: ', jsn.error); 
				} else {
					console.log('Xfer saved', jsn);
				}
            } catch(ex2){
                console.warn('Error saving transfer', ex2);
                console.warn('Transfer record', xfer);
            }

            setViewStatus('Sale completed! <a href="/mycollection">View token in my collection</a>');
            setViewAction('SUCCESS', true);
            return;
        } else {
            setViewStatus('Error in buy order', true);
            setViewAction();
            ctr.methods.buy(orderId, buyer, 1).call().then().catch(revertReason => {
            	console.error(revertReason);
            	if(revertReason.revert){
		            setViewStatus('Error in buy order: '+revertReason.revert, true);
		            setViewAction();
            	}
            });
            return;
        }
    } catch(ex){ 
        console.log('Contract error:', ex) ;
        setViewStatus(ex.message||ex, true);
        setViewAction();
        return;
    }
	setViewStatus('Buy Token: Unknown error?', true);
    setViewAction();
}

async function bidConfirm(amount) {
	let item   = session.item;
	let seller = item.owner;
    let bidder = Davinci.addrexx;
	let uname  = bidder.substr(0,10);
	console.log('Bid on item', item);
	console.log('Token ', item.address);
    console.log('Seller', seller);
    console.log('Bidder', bidder);
    console.log('Order ', item.orderid);
	console.log('Proxy ', config.TransferProxy);
	console.log('Amount', amount);

	if(typeof Davinci == 'undefined'){ setViewStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setViewStatus('Wallet not connected', true); return; }

    if(seller==bidder){ 
		setViewStatus('You are the owner, can not bid on this token', true);
    	return;
    }
    if(item.bids.length>0 && item.bids[0].bidder==bidder){ 
		setViewStatus('Can not bid on this token again', true);
    	return;
    }
    if(!item.orderid){
		setViewStatus('Error: Auction not found', true);
    	return;
    }
    if(!item.onsale){
		setViewStatus('Token not for sale', true);
    	return;
    }
    if(item.available<1){
		setViewStatus('No more copies available', true);
    	return;
    }

    // Check Dates
	let now  = new Date();
	let dini = new Date(item.inidate);
	let dend = new Date(item.enddate);
    if(now<dini){ setViewStatus('Auction not started yet', true); return; }
    if(now>dend){ setViewStatus('Auction already ended', true); return; }

	setViewStatus('Confirming bid...');
	setViewAction('WAIT', true);

	try {
		setViewStatus('Placing bid, please wait...');
	    adr = config.Auctions;
	    abi = Auctions.abi;
		ctr = await Davinci.contract(abi, adr);
		ctr.wallet = Davinci.wallet;
		wei = new Harmony.utils.Unit(amount).asOne().toWei();
		gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.addrexx };
        console.log('Wei', wei.toString());
        console.log('Gas', gas);
	    res = await ctr.methods.placeBid(item.orderid, wei).send(gas);
	    console.log('RES', res);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
	    	ok = res.status;
	    	txid = res.transactionHash;
		} else {
        	if (res.transaction.txStatus == 'REJECTED') { ok = false; }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else {
	            setViewStatus('Unknown status: '+res.transaction.txStatus, true);
	            setViewAction('PLACE BID');
	            return;
	        }
	    	txid = res.transaction.id;
		}
	    console.log('OK', ok, txid);

        if (ok) {
        	// Save bid to DB
			var data = new FormData();
			// 'orderid', 'collection', 'tokenid', 'owner', 'price'
			data.append('orderid',    item.orderid);
			data.append('collection', item.collection);
			data.append('tokenid',    item.tokenid);
			data.append('artwork',    item.address);
			data.append('bidder',     bidder);
			data.append('price',      amount);
            try {
				console.log('New bid', amount, 'by', bidder);
				res = await fetch('/api/newbid', {method: 'POST', body: data});
				jsn = await res.json();
				console.log('New bid resp', jsn);
				if(jsn.error) { 
					console.log('New bid error: ', jsn.error); 
				}
				// Get username
				res = await fetch('/api/username/'+bidder, {method: 'GET'});
				jsn = await res.json();
            	uname = jsn.name || bidder.substr(0,10);
				console.log('Username', uname);
            } catch(ex1){
                console.warn('Error saving bid', ex1);
                console.warn('Bid record', data);
            }

            addBidToTable(new Date(), uname, amount);
            setViewStatus('Bid completed!');
            setViewAction('SUCCESS', true);
            return;
        } else {
            setViewStatus('Error placing bid', true);
            setViewAction('PLACE BID');
            ctr.methods.placeBid(item.orderid, wei).call().then().catch(revertReason => {
            	console.error(revertReason);
            	if(revertReason.revert){
		            setViewStatus('Error placing bid: '+revertReason.revert, true);
		            setViewAction('PLACE BID');
            	}
            });
            return;
        }
    } catch(ex){ 
        console.log('Bidding error:', ex) ;
        setViewStatus(ex.message||ex, true);
        setViewAction('PLACE BID');
        return;
    }
	setViewStatus('Place bid: Unknown error?', true);
    setViewAction('PLACE BID');
}

async function onClaim() {
	// claim token, pay bid amount
	//alert('You are the winner!\nNot yet implemented...');
	let item   = session.item;
	let seller = item.owner;
    let bidder = Davinci.addrexx;
    let amount = item.lastbid;
	console.log('Claim item', item);
	console.log('Address', item.address);
    console.log('Seller', seller);
    console.log('Bidder', bidder);
    console.log('Order ', item.orderid);
	console.log('Proxy ', config.TransferProxy);
	console.log('Amount', amount); // TODO: loop for invalid/forfeit bids


	if(typeof Davinci == 'undefined'){ setViewStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setViewStatus('Wallet not connected', true); return; }

    if(seller==bidder){ 
		setViewStatus('You are the owner, can not claim this token', true);
    	return;
    }
    if(item.bids[0].bidder!=bidder){ 
		setViewStatus("Can not claim this token, you didn't win", true);
    	return;
    }
    if(!item.orderid){
		setViewStatus('Error: Auction not found', true);
    	return;
    }
    if(!item.onsale){
		setViewStatus('Token already claimed', true);
    	return;
    }
    if(item.available<1){
		setViewStatus('No more copies available', true);
    	return;
    }

	setViewStatus('Claiming token, please wait...');
	setViewAction('WAIT', true);

	try {
	    adr = config.Auctions;
	    abi = Auctions.abi;
		ctr = await Davinci.contract(abi, adr);
		ctr.wallet = Davinci.wallet;

		// Close auction
        try {
			console.log('Close auction', item.orderid);
			res = await fetch('/api/closeauction/'+item.orderid);
			jsn = await res.json();
			console.log('Close auction resp', jsn);
			if(jsn.error) { 
				console.log('Close auction error: ', jsn.error); 
	            setViewStatus('Error closing auction: '+jsn.error, true);
	            setViewAction('CLAIM TOKEN');
				return false;
			}
        } catch(ex0){
            console.warn('Error closing auction', ex0);
            setViewStatus('Error closing auction: '+ex0.message, true);
            setViewAction('CLAIM TOKEN');
			return false;
        }

		// Claim token
		wei = new Harmony.utils.Unit(amount).asOne().toWei();
		gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.address, value: wei };
        console.log('Wei', wei.toString());
        console.log('Gas', gas);
	    res = await ctr.methods.claim(item.orderid).send(gas);
	    console.log('RES', res);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
	    	ok = res.status;
	    	txid = res.transactionHash;
		} else {
        	if (res.transaction.txStatus == 'REJECTED') { ok = false; }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else {
	            setViewStatus('Unknown status: '+res.transaction.txStatus, true);
	            setViewAction('CLAIM TOKEN');
	            return;
	        }
	    	txid = res.transaction.id;
		}
	    console.log('OK', ok, txid);

        if (ok) {
			var data = new FormData();
			data.append('address',    item.address);
			data.append('collection', item.collection);
			data.append('tokenid',    item.tokenid);
			data.append('tokentype',  item.type);
			data.append('seller',     seller);
			data.append('ownerid',    bidder);
			data.append('copies',     1);
			data.append('total',      1);
			data.append('available',  1);
			data.append('onsale',     false);
			data.append('saletype',   0);
			data.append('saleprice',  item.saleprice);
			data.append('updateqty',  true);

			// Auction only one item, change owner
            try {
				console.log('Change owner from', seller, 'to', bidder);
				res = await fetch('/api/changeowner', {method: 'POST', body: data});
				jsn = await res.json();
				console.log('Change owner resp', jsn);
				if(jsn.error) { 
					console.log('Change owner error: ', jsn.error); 
				}
            } catch(ex1){
                console.warn('Error saving owner', ex1);
                console.warn('Owner record', data);
            }

            // New ownership record
            try {
				console.log('Save new owner', bidder);
				res = await fetch('/api/saveowner', {method: 'POST', body: data});
				jsn = await res.json();
				console.log('Response', jsn);
				if(jsn.error) { 
					console.log('Save owner error: ', jsn.error); 
				} else {
					console.log('Ownership saved', jsn);
				}
            } catch(ex2){
                console.warn('Error saving owner', ex2);
                console.warn('Owner record', data);
            }

			// Save Transfer
            try {
				console.log('Saving transfer...', item.address);
				var xfer = new FormData();
				xfer.append('txhash',     txid);
				xfer.append('orderid',    item.orderid);
				xfer.append('sender',     seller);
				xfer.append('receiver',   bidder);
				xfer.append('tokentype',  item.type);
				xfer.append('collection', item.collection);
				xfer.append('tokenid',    item.tokenid);
				xfer.append('value',      item.saleprice);
				xfer.append('artwork',    item.address);

				res = await fetch('/api/transfer', {method: 'POST', body: xfer});
				jsn = await res.json();
				console.log('Xfer response', jsn);
				if(jsn.error) { 
					console.log('Xfer error: ', jsn.error); 
				} else {
					console.log('Xfer saved', jsn);
				}
            } catch(ex3){
                console.warn('Error saving transfer', ex3);
                console.warn('Transfer record', xfer);
            }

			// Update artwork, order, bid
            try {
				res = await fetch('/api/claimed', {method: 'POST', body: xfer});
				jsn = await res.json();
				console.log('Claim response', jsn);
				if(jsn.error) { 
					console.log('Claim error: ', jsn.error); 
				} else {
					console.log('Claim saved', jsn);
				}
            } catch(ex4){
                console.warn('Error claiming auction', ex4);
                console.warn('Record', xfer);
            }

            setViewStatus('Claim completed! <a href="/mycollection">View token in my collection</a>');
            setViewAction('SUCCESS', true);
            return;
        } else {
            setViewStatus('Error claiming auction', true);
            setViewAction('CLAIM TOKEN');
            ctr.methods.claim(item.orderid).call().then().catch(revertReason => {
            	console.error('Reason', revertReason);
            	if(revertReason.revert){
		            setViewStatus('Error claiming auction: '+revertReason.revert, true);
	            	setViewAction('CLAIM TOKEN');
            	}
            });
            return;
        }        	
    } catch(ex){ 
        console.log('Claiming error:', ex) ;
        setViewStatus(ex.message||ex, true);
        setViewAction('CLAIM TOKEN');
        return;
    }
	setViewStatus('Claim token: Unknown error?', true);
    setViewAction('CLAIM TOKEN');
}

async function recountTokens() {
    try {
		let res = await fetch('/api/counter/'+session.item.address, {method: 'GET'});
		let jsn = await res.json();
		console.log('Recount', jsn);
		if(jsn.status == 'SUCCESS') { $('available').innerHTML = jsn.balance; }
    } catch(ex){ 
        console.log('Recount error:', ex);
    }
}


async function setupAuction() {
	console.log('Addrex', Davinci.addrexx);
	if(session.item.bids.length>0){
		console.log('Bidder', session.item.bids[0].bidder)
	}
	let now     = new Date();
	let inidate = new Date(session.item.inidate);
	let enddate = new Date(session.item.enddate);
	let reserve = parseFloat(session.item.reserve);
	let lastbid = parseFloat(session.item.lastbid);
	let nextbid = intOrDec(session.item.saleprice);
	console.log('Ini date', session.item.inidate);
	console.log('End date', session.item.enddate);
	if(now<inidate){
		$('enddate').innerHTML = 'Auction starts on '+(inidate.toLocaleString());
	} else {
		$('enddate').innerHTML = 'Auction ends on '+(enddate.toLocaleString());
	}
	if(lastbid>0){ 
		console.log('Last bid', lastbid);
		$('forsale').innerHTML = 'Last bid '+Math.ceil(lastbid)+' ONE'; 
		//nextbid = Math.ceil(lastbid * 1.10);
		nextbid = calcNextBid(lastbid);
		//if(nextbid < Math.ceil(lastbid * 1.10)){ nextbid = calcNextBid(nextbid); }
		$('royalty').innerHTML = lastbid < reserve ? 'Reserve price not met' : '';
	}
	if($('bidamount')) { $('bidamount').value = nextbid; }
	// Check auction ended and winner
    console.log('End', enddate);
    console.log('Now', now);
	if(enddate<now){
    	console.log('Auction ended');
		if(lastbid >= reserve){
    		console.log('Reserve met');
			if(session.item.bids[0].bidder == session.user){
				setViewStatus('YOU WON THE AUCTION!<br>You have 24 hours to claim the token', true);
    			console.log('You won the auction');
				let button = $('card-buy');
				button.className = 'onsale';
				button.disabled  = false;
				button.innerHTML = 'CLAIM TOKEN';
				button.onclick   = onClaim;
			}
		}
	}
}


async function main() {
	await startDavinci();
	if(session.item.saletype==1){
		setupAuction();
	}
	recountTokens();
}

window.onload = main
