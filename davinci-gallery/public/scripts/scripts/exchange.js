// vinci.js

const ONEWEI = 10**18;

session = {
	trading   : false,
	vinciusd  : 0.0,
	vincione  : 0.0,
	oneusd    : 0.0,
	balance   : 0.0,
	prevPrice : 0,
	lastPrice : 0,
	priceMove : 0
}

function showVinciPrice(){
    console.log('Show VINCI', session.vinciusd);
	$('vinciusd').innerHTML = '$'+money(session.vinciusd);
}

async function showBalance(){
    console.log('Show balance', Davinci.addrexx);
	if(!Davinci.addrexx){ return; }
	let balance  = await getBalance(Davinci.addrexx);
	session.balance = balance;
	let ubalance = parseFloat(balance) * session.vinci;
	$('balance').innerHTML  = money(balance);
	$('ubalance').innerHTML = '$'+money(ubalance);
}

async function getBalance(address){
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    //let ctr = await Davinci.contract(HRC20.abi, config.VinciToken);
    let ctr = await Harmony.contracts.createContract(HRC20.abi, config.VinciToken);
    let res = await ctr.methods.balanceOf(address).call(gas);
    //console.log('Balance', res);
    console.log('Balance', res.toString());
    let balance = parseFloat(res.toString()/10**18);
    return balance;
}

async function showOrderBook() {
	console.log('Getting orderbook...');
	let res  = await fetch('/api/orderbook/vinci:one');
	let book = await res.json()
	session.book = book;
	console.log(book);

	// Update bids tables
	let i, bid, ask, table, body, row, html;
	let bidsTable = $('bids-list');
	i = 0; html = '';
	for(i=0; i<book.bids.length; i++){
		if(i==10){ break; }
		bid = book.bids[i]
		row = `<tr><td>${bid.price}</td><td>${bid.amount}</td><td>${bid.total}</td></tr>`;
		html += row;
	}
	// Pad blank rows up to 10
	for(var j=i; j<10; j++){
		html += '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
	}
	body = bidsTable.tBodies[0];
	body.innerHTML = html;

	// Update asks tables
	let asksTable = $('asks-list');
	i = 0; html = '';
	for(i=0; i<book.asks.length; i++){
		ask = book.asks[i]
		row = `<tr><td>${ask.price}</td><td>${ask.amount}</td><td>${ask.total}</td></tr>`;
		html += row;
		if(i==10){ break; }
	}
	// Pad blank rows up to 10
	for(var j=i; j<10; j++){
		html += '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
	}
	body = asksTable.tBodies[0];
	body.innerHTML = html;
	showLastPrice();
}

async function showLastPrice() {
	session.vincione = 1.0;
	if(session.book.asks.length>0){
		session.vincione = parseFloat(session.book.asks[0].price);
	} else if(session.book.bids.length>0){
		session.vincione = parseFloat(session.book.bids[0].price);
	}
	session.vinciusd = session.vincione * oneusd.price;
	console.log(oneusd, session.vinciusd, session.vincione);
	session.prevPrice = session.lastPrice;
	session.lastPrice = session.vincione;
	session.priceMove = (session.lastPrice < session.prevPrice ? 0 : 1);
	console.log('VINCI/ONE', session.vincione);
	console.log('VINCI/USD', session.vinciusd);
	$('vinciusd').innerHTML = '$'+session.vinciusd.toFixed(4);
	$('vincione').innerHTML = session.vincione.toFixed(4);
	$('vincione').className = (session.priceMove==0?'go-dn':'go-up');
}


//-- CALCULATOR

function calcBidOnes(){
	let price = validNumber($('bid-price').value);
	if(!price || price<=0){ $('bid-price').value = session.vincione; price = session.vincione; }
	let vin = validNumber($('bid-amount1').value);
	let one = vin * price;
	$('bid-amount2').value = intOrDec(one, 4); //.toFixed(4)
}

function calcBidVincis(){
	let price = validNumber($('bid-price').value);
	if(!price || price<=0){ $('bid-price').value = session.vincione; price = session.vincione; }
	let one = validNumber($('bid-amount2').value);
	let vin = one / price;
	$('bid-amount1').value = intOrDec(vin, 4); //.toFixed(4)
}

function calcAskOnes(){
	let price = validNumber($('ask-price').value);
	if(!price || price<=0){ $('ask-price').value = session.vincione; price = session.vincione; }
	let vin = validNumber($('ask-amount1').value);
	let one = vin * price;
	$('ask-amount2').value = intOrDec(one, 4); //.toFixed(4)
}

function calcAskVincis(){
	let price = validNumber($('ask-price').value);
	if(!price || price<=0){ $('ask-price').value = session.vincione; price = session.vincione; }
	let one = validNumber($('ask-amount2').value);
	let vin = one / price;
	$('ask-amount1').value = intOrDec(vin, 4); //.toFixed(4)
}



function setOrderStatus(text){
	$('order-status').innerHTML = text;
}

async function onBuyOrder() {
	if(!session.trading){
		alert('Trading is disabled for maintenance. Come back soon');
		return;
	}
	// Send ONE get VINCI
	setOrderStatus('Confirming market offer, please wait...');
	let price  = validNumber($('bid-price').value);
	let amount = validNumber($('bid-amount1').value);
	if(price<=0){ 
		price = session.vincione || 1;  // use market price
		// TODO: Max slippage 10% from ask price
	}
	let total = amount * price;

	if(amount<=0){ 
		setOrderStatus('Amount must be greater than zero');
		return;
	}

	try {
		// Pay first
		let txid = await payment(config.Exchange, total); // pay ONE (amount*price) get VINCI (amount)
		if(!txid){ 
			console.log('No txid, rejected by user'); 
			//alert('No txid, rejected by user or tx error'); 
			setOrderStatus('Payment rejected by user or transaction error');
			return;
		}

		// Send data to DB
		setOrderStatus('Saving market order, please wait...');
		var data = new FormData();
		data.append('ordertype', 1); // 0.sell 1.buy
		data.append('market', 'vinci:one');
		data.append('userid', Davinci.addrexx);
		data.append('price',  price);
		data.append('amount', amount);
		data.append('total',  total);
		data.append('txid',   txid);
		let res = await fetch('/api/marketoffer', {method:'post', body: data});
		let jsn = await res.json();
		//console.log('Res', res);
		console.log('Res', jsn);
		if(jsn.error) { 
			console.log('Trade error:', jsn.error); 
			setOrderStatus('Trade error: '+jsn.error);
			return;
		}
		// Update UI
		setOrderStatus('Trade successful!');
		getOpenOrders();
		showOrderBook();
	} catch(ex){
		console.log('Trade error:', ex); 
		setOrderStatus('Trade error: '+ex);
		return;
	}
}

async function onSellOrder() {
	if(!session.trading){
		alert('Trading is disabled for maintenance. Come back soon');
		return;
	}
	// Send VINCI get ONE
	setOrderStatus('Confirming market offer, please wait...');
	let price  = validNumber($('ask-price').value);
	let amount = validNumber($('ask-amount1').value);
	if(price<=0){ 
		//price = session.vincione || 1; // use market price
		if(session.book.bids.length>0){
			price = parseFloat(session.book.bids[0].price || '1');
			// TODO: Max slippage 10% from bid price
		} else {
			price = 1;
		}
	}
	let total = amount * price;

	if(amount<=0){ 
		setOrderStatus('Amount must be greater than zero');
		return;
	}

	try {
		// Pay first
		let txid = await paytoken(config.Exchange, amount, config.VinciToken);  // pay VINCI (amount) get ONE (amount*price)
		if(!txid){ 
			console.log('No txid, rejected by user'); 
			setOrderStatus('Payment rejected by user or transaction error');
			return;
		}

		// Send data to DB
		setOrderStatus('Saving market order, please wait...');
		var data = new FormData();
		data.append('ordertype', 0); // 0.sell 1.buy
		data.append('market', 'vinci:one');
		data.append('userid', Davinci.addrexx);
		data.append('price',  price);
		data.append('amount', amount);
		data.append('total',  total);
		data.append('txid',   txid);
		let res = await fetch('/api/marketoffer', {method:'post', body: data});
		let jsn = await res.json();
		//console.log('Res', res);
		console.log('Res', jsn);
		if(jsn.error) { 
			console.log('Trade error:', jsn.error); 
			setOrderStatus('Trade error: '+jsn.error);
			return;
		}
		// Update UI
		setOrderStatus('Trade successful!');
		getOpenOrders();
		showOrderBook();
	} catch(ex){
		console.log('Trade error:', ex); 
		setOrderStatus('Trade error: '+ex);
		return;
	}
}


async function payment(receiver, amount) {
    console.log('PAY:', receiver, amount);
    let adr = addressToOne(receiver);
	let wei = amount * ONEWEI;
    let txn = Harmony.transactions.newTx({
        to: adr,
        value: wei,
        shardID: 0,
        toShardID: 0,
        gasPrice: config.GASPRICE,
        gasLimit: config.GASLIMIT
        //data: '0xabcedf' // any hex data
    });
    console.log('TXN:', txn)
    let signed = await Davinci.wallet.signTransaction(txn);
    let txid = null;

    try { 
        res = await Harmony.blockchain.sendTransaction(signed);
        if(res.error){ 
        	console.log('Pay error:', res.error.message) 
        } else { 
        	console.log('Pay res',res); 
        	console.log('Tx id', res.result); 
        	txid = res.result;
        }
    } catch(ex){ 
    	console.log('Payment error:', ex) 
    }

    return txid;
}

async function paytoken(receiver, amount, token) {
    console.log('PAY TOKEN TO', receiver, amount, 'VINCI', token);
    let adr = addressToOne(receiver);
	let wei = (amount * ONEWEI).toString();
	let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.address };
    let txid = null;
    console.log('ADR:', adr)
    console.log('WEI:', wei)

    try { 
        let ctr = await Davinci.contract(HRC20.abi, token);
		ctr.wallet = Davinci.wallet;
        let res = await ctr.methods.transfer(adr, wei).send(gas);
	    console.log('RES:', res)
        if(res.status=='called'){ 
        	console.log(res.transaction.txStatus, res.transaction.id);
        	txid = res.transaction.id;
        } else{ 
        	console.log('Paytoken error', res); 
        }
    } catch(ex) { 
    	console.log('Paytoken error:', ex);
    }

    return txid;
}


async function addVinciToMetamask() {
	let tokenAddress  = config.VinciToken;
	let tokenSymbol   = 'VINCI';
	let tokenDecimals = 18;
	let tokenImage    = '';

	try {
	    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
	    const wasAdded = await ethereum.request({
	        method: 'wallet_watchAsset',
	        params: {
	            type: 'ERC20', // Initially only supports ERC20, but eventually more!
	      		options: {
	      		    address:  tokenAddress,  // The address that the token is at.
	      		    symbol:   tokenSymbol,   // A ticker symbol or shorthand, up to 5 chars.
	      		    decimals: tokenDecimals, // The number of decimals in the token
	      		    //image:    tokenImage,  // A string url of the token logo
	      		},
	        },
	    });

	    if(wasAdded) {
	    	console.log('Token added');
	    	alert('Token added. Thanks for your interest in VINCI!');
	    } else {
	    	console.log('Token rejected');
	    	alert('VINCI not added. You can try again later!');
	    }
	} catch (error) {
    	console.log(error);
    	alert(error);
	}
}

function onTradeTab(n) {
	if(n==1){
		$('trades-tab0').classList.remove('selected');
		$('trades-tab1').classList.add('selected');
		$('trades-panel0').classList.add('hidden');
		$('trades-panel1').classList.remove('hidden');
		getTradeHistory();
	} else {
		$('trades-tab0').classList.add('selected');
		$('trades-tab1').classList.remove('selected');
		$('trades-panel0').classList.remove('hidden');
		$('trades-panel1').classList.add('hidden');
		getOpenOrders();
	}
}

async function getOpenOrders() {
	if(!Davinci.addrexx){ return; }
	let res  = await fetch('/api/tradesopen/'+Davinci.addrexx);
	let list = await res.json();
	console.log('Open Orders', list);
	// Show orders
	let table = $('trades-open');
	if(list.length<1){
		table.tBodies[0].innerHTML = '<tr><td colspan="6">No open orders</td></tr>';
		return;
	}
	let html = '';
	for (var i = 0; i < list.length; i++) {
		item = list[i];
		time = timeOrDate(item.created);
		odir = (item.ordertype==0?'Sell':'Buy');
		ocls = (item.ordertype==0?'go-dn':'go-up');
		amnt = money(item.amount, 4);
		prce = money(item.price, 4);
		totl = money(item.total, 4);
		actn = `<a href="javascript:void(0)" onclick="onCancelOffer(${item.orderid})">Cancel</a>`;
		row  = `<tr><td>${time}</td><td class="${ocls}">${odir}</td><td class="${ocls}">${prce}</td><td>${amnt}</td><td>${totl}</td><td>${actn}</td></tr>`;
		html += row;
	}
	table.tBodies[0].innerHTML = html;
}

async function getTradeHistory() {
	if(!Davinci.addrexx){ return; }
	let res  = await fetch('/api/tradeshist/'+Davinci.addrexx);
	let list = await res.json();
	console.log('Hist Orders', list);
	// Show orders
	let table = $('trades-hist');
	if(list.length<1){
		table.tBodies[0].innerHTML = '<tr><td colspan="6">No trade history</td></tr>';
		return;
	}
	let html = '';
	for (var i = 0; i < list.length; i++) {
		item = list[i];
		time = timeOrDate(item.created);
		odir = (item.ordertype==0?'Sell':'Buy');
		ocls = (item.ordertype==0?'go-dn':'go-up');
		amnt = money(item.amount, 4);
		prce = money(item.price, 4);
		totl = money(item.total, 4);
		mode = ['Open', 'Error', 'Filled'][item.status] || '?';
		actn = mode;
		link = '';
		if(item.status==1){
			actn = `<a href="javascript:void(0)" onclick="onRetryPayment(${item.tradeid})">${mode}</a>`;
		} else if(item.status==2 && item.txid){
			link = config.EXPLORER+'#/tx/'+item.txid;
			actn = `<a href="${link}" target="_blank">${mode}</a>`;
		}
		row  = `<tr><td>${time}</td><td class="${ocls}">${odir}</td><td class="${ocls}">${prce}</td><td>${amnt}</td><td>${totl}</td><td>${actn}</td></tr>`;
		html += row;
	}
	table.tBodies[0].innerHTML = html;
}

async function onCancelOffer(oid) {
	//alert('Not ready yet...');
	console.log('Cacel offer', oid);
	if(!oid){ return; }
	let ok = confirm('Are you sure you want to cancel this offer?');
	if(!ok){ return; }
	try {
		setOrderStatus('Cancelling offer, please wait...');
		let res = await fetch('/api/canceloffer/'+oid);
		let jsn = await res.json();
		//console.log('Res', res);
		console.log('Res', jsn);
		if(jsn.error) { 
			console.log('Trade error:', jsn.error); 
			setOrderStatus('Trade error: '+jsn.error);
			return;
		}
		// Update UI
		setOrderStatus('Offer cancelled!');
		getOpenOrders();
		showOrderBook();
	} catch(ex){
		console.log('Cancel error:', ex); 
		setOrderStatus('Cancel error: '+ex);
		return;
	}

	return false;
}

async function onRetryPayment(tid) {
	alert('Notify admins with trade order '+tid);
	return false;
}


async function checkTradingStatus() {
	if(!session.trading){
		$('button-ask').disabled = true;
		$('button-bid').disabled = true;
		$('button-ask').classList.add('disabled');
		$('button-bid').classList.add('disabled');
		setOrderStatus('<warn>Trading is disabled for maintenance</warn>');
	}
}


async function main() {
	await startDavinci();
	      checkTradingStatus();
	await showOrderBook();
	await getOpenOrders();
}

window.onload = main;

// end