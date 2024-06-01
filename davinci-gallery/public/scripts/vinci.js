// vinci.js

const ONEWEI = 10**18;

session = {
	oneusd    : oneusd.price,
	vinciusd  : 0.0,
	vincione  : 0.0,
	balance   : 0.0,
	locked    : 0.0,
	minted    : 0.0,
	supply    : 0.0,
	mktcap    : 0.0,
	curcap    : 0.0,
	lastBlock : 0,
	nextBlock : 0,
	prevPrice : 0,
	lastPrice : 0,
	priceMove : 0,
	timer     : false
}

function extractor(text, tini, tend){
	return text.split(tini).pop().split(tend)[0];
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
	let ubalance = parseFloat(balance) * session.vinciusd;
	$('balance').innerHTML  = money(balance);
	$('stakebal').innerHTML = money(balance);
	$('ubalance').innerHTML = money(ubalance);
}

async function getBalance(address){
    console.log('VINCI balance for', address);
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    //let ctr = await Davinci.contract(HRC20.abi, config.VinciToken);
    let ctr = await Harmony.contracts.createContract(HRC20.abi, config.VinciToken);
    let res = await ctr.methods.balanceOf(address).call(gas);
    //console.log('Balance', res);
    console.log('Balance', res.toString());
    let balance = parseFloat(res.toString()/10**18);
    return balance;
}

async function showLockedBalanceOLD(){
    console.log('VNL balance for', Davinci.addrexx);
	if(!Davinci.addrexx){ return; }
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    let ctr = await Harmony.contracts.createContract(HRC20.abi, config.VNLToken);
    let res = await ctr.methods.balanceOf(Davinci.addrexx).call(gas);
    let bas = res.toString();
    console.log('Balance', bas);
    let balance = bas/10**18;
	let ubalance = balance * session.vinciusd;
	session.locked = balance;
	$('locked').innerHTML  = money(balance);
	$('ulocked').innerHTML = money(ubalance);
    return balance;
}

async function showLockedBalance(){
    console.log('lockedBalance', Davinci.addrexx);
	if(!Davinci.addrexx){ return; }
	let res = await fetch('/api/getvincis/'+Davinci.addrexx);
	let inf = await res.json();
	console.log('Locked', inf);
	if(!inf || inf.error){
		$('locked').innerHTML  = 'N/A';
		$('ulocked').innerHTML = 'N/A';
	} else {
		$('locked').innerHTML  = money(inf.balance);
		let ubalance = inf.balance * session.vinciusd;
		$('ulocked').innerHTML = money(ubalance);
	}
    return inf.balance;
}

async function showTotalSupply(){
    console.log('Show Total Supply');
	let supply = await getTotalSupply();
	$('supply').innerHTML = money(supply);
}

async function getTotalSupply(){
    //let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    //let ctr = await Harmony.contracts.createContract(HRC20.abi, config.VinciToken);
    //let res = await ctr.methods.totalSupply().call(gas);
    //console.log('Total supply', res.toString());
    //let supply = res.toString();
    let supply = '90000000';
    session.supply = supply;
    return supply;
}

async function showCurrentSupply(){
    console.log('Show Current Supply');
	let supply = await getCurrentSupply();
	$('minted').innerHTML = money(supply);
}

async function getCurrentSupply(){
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    let ctr = await Harmony.contracts.createContract(HRC20.abi, config.VinciToken);
    let res = await ctr.methods.totalSupply().call(gas);
    console.log('Current supply', res.toString());
    let supply = parseFloat(res.toString()/10**18);
    session.minted = supply;
    return supply;
}

async function getLastBlock(){
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    let ctr = await Harmony.contracts.createContract(Sculptor.abi, config.VinciSculptor);
    let res = await ctr.methods.getLastBlock().call(gas);
    console.log('Last block', res.toString());
    //let block = res.toString();
    let block = parseInt(res.toString());
    session.lastBlock = block;
    return block;
}

async function showMarketCap(){
    console.log('Show Market Cap');
	$('mktcap1').innerHTML = money(session.minted * session.vinciusd);
	$('mktcap2').innerHTML = money(session.supply * session.vinciusd);
}

async function mintSome() {
    console.log('Mint some');
	let lastBlock = await getLastBlock();
	let res = await Harmony.blockchain.getBlockNumber();
	let nextBlock = parseInt(res.result, 16);
	let diff = nextBlock - lastBlock;
    console.log(lastBlock, nextBlock, diff);
	session.minted += diff;
	$('minted').innerHTML = money(session.minted);
	session.timer = true;
	setTimeout(mintMore, 1000);
}

function mintMore() {
	session.minted += 1;
	$('minted').innerHTML = money(session.minted);
	if(session.timer){ 
		setTimeout(mintMore, 1000);
	}
}

function toggleTimer() { 
	session.timer = !session.timer; 
	if(session.timer){ mintMore(); }
}



async function showLastPrice() {
	session.vinciusd  = session.vincione * session.oneusd;
	console.log(session.oneusd, session.vinciusd, session.vincione);
	session.prevPrice = session.lastPrice;
	session.lastPrice = session.vincione;
	session.priceMove = (session.lastPrice < session.prevPrice ? 0 : 1);
	console.log('VINCI/ONE', session.vincione);
	console.log('VINCI/USD', session.vinciusd);
	$('vinciusd').innerHTML = '$'+session.vinciusd.toFixed(4);
	//$('vincione').innerHTML = session.vincione.toFixed(4);
	//$('vincione').className = (session.priceMove==0?'go-dn':'go-up');
	let ubalance = parseFloat(session.balance) * session.vinciusd;
	$('ubalance').innerHTML = money(ubalance);
}

function setOrderStatus(text){
	$('order-status').innerHTML = text;
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

async function getSeeswapPrice() {
    let poolAdr = config.SeeswapPool;
    let VINCI   = config.VinciToken;
    let ONEs    = config.SeeswapOnes;
    console.log('SEESWAP PRICE VINCI/ONE');
    let gas = {gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT}; 
    let ctr = Harmony.contracts.createContract(BPOOL.abi, poolAdr);
    let res = await ctr.methods.getSpotPriceSansFee(ONEs, VINCI).call(gas);
    let price = (res / 10**18).toFixed(4);
    console.log('Seeswap price', price);
    $('pool-see').innerHTML = price + ' ONE';
	return price;
}

async function getViperPrice() {
	console.log('Getting Viper price...');
	let qry = {query:'{pair(id:"0xca3680580e01bd12cc86818fff62eda2d255677c"){token1Price}}'};
	let url = 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap-v2';
	let hdr = {
		method: 'POST', 
		headers: {'content-type': 'application/json'}, 
		body: JSON.stringify(qry)
	};
	let res = await fetch(url, hdr);
	let inf = await res.json();
	//console.log('Viper price:', inf);
	if(inf && inf.data){
		session.vincione = parseFloat(inf?.data?.pair?.token1Price) || 0.0;
		price = session.vincione.toFixed(4);
		//showLastPrice();
	} else {
		price = 'N/A';
	}
	console.log('Viper price:', price);
    $('pool-viper').innerHTML = price + ' ONE';
	return price;
}

async function getSushiPrice() {
	console.log('Getting Sushi price...');
	// Search for '1 VINCI = ' extract until ' WONE', strip commmas
	let url = '/proxy?url='+escape('https://analytics-harmony.sushi.com/pairs/0x12f5fe3ab36ced7fb1065b260a0d244eaa6e5584');
	//let res = await fetch(url, {mode: "no-cors"});
	let res = await fetch(url);
	let inf = await res.text();
	//console.log('Html:', inf);
	let price, pricen;
	let pricex = extractor(inf, '1 VINCI = ', ' WONE');
	console.log('Sushi price:', pricex);
	if(!pricex){
		price  = 'N/A';
	} else {
		pricen = pricex.replace(/,/g, '');
		price  = (parseFloat(pricen) || 0.0).toFixed(4);
	}
	console.log('Sushi price:', price);
    $('pool-sushi').innerHTML = price + ' ONE';
	return price;
}

async function getMochiPrice() {
	console.log('Getting Mochi price...');
	let qry = {query:'{pair(id:"0x79aa29e13e054df9d931728b4e33d9fb458ac4b8"){token1Price}}'};
	let url = 'https://api.mochiswap.io/subgraphs/name/mochiswap/mochiswap1'
	let hdr = {
		method: 'POST', 
		headers: {'content-type': 'application/json'}, 
		body: JSON.stringify(qry)
	};
	let res = await fetch(url, hdr);
	let inf = await res.json();
	//console.log('Mochi price:', inf);
	if(inf && inf.data){
		price = (parseFloat(inf?.data?.pair?.token1Price) || 0.0).toFixed(4);
	} else {
		price = 'N/A';
	}
	console.log('Mochi price:', price);
    $('pool-mochi').innerHTML = price + ' ONE';
	return price;
}

async function getOpenPrice() {
	let hmy = await HarmonyJs.Harmony('https://api.s0.t.hmny.io', {chainType: 'hmy', chainId: 1});
	let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getKek","outputs":[{"internalType":"uint256","name":"kek","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"reserve0","type":"uint112"},{"internalType":"uint112","name":"reserve1","type":"uint112"},{"internalType":"uint32","name":"blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"sync","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
	let adr = '0x5c6640c144fAE3e4e75e6C610fDb74e86286385F'; // VINCI/WONE pair contract
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    let ctr = await hmy.contracts.createContract(abi, adr);
    let res = await ctr.methods.getReserves().call(gas);
    let price;
	if(res && res.reserve0){
    	let val = res.reserve1 / res.reserve0;
		price = val.toFixed(4);
    } else {
		price = 'N/A';
    }
    //console.log('RES', res);
    console.log('Open price', price);
    $('pool-open').innerHTML = price + ' ONE';
    return price;
}

async function getLootPrice() {
	let hmy = await HarmonyJs.Harmony('https://api.s0.t.hmny.io', {chainType: 'hmy', chainId: 1});
	let abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getKek","outputs":[{"internalType":"uint256","name":"kek","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"reserve0","type":"uint112"},{"internalType":"uint112","name":"reserve1","type":"uint112"},{"internalType":"uint32","name":"blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"sync","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
	let adr = '0x75903f7343918058525eba1fc26595d174ef5d44'; // VINCI/WONE pair contract
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT };
    let ctr = await hmy.contracts.createContract(abi, adr);
    let res = await ctr.methods.getReserves().call(gas);
    //let res = await ctr.methods.price0CumulativeLast().call(gas);
    let price;
	if(res && res.reserve0){
    	let val = res.reserve1 / res.reserve0;
		price = val.toFixed(4);
    } else {
		price = 'N/A';
    }
    //console.log('RES', res);
    console.log('Loot price', price);
    $('pool-loot').innerHTML = price + ' ONE';
    return price;
}

async function getGeckoPrice() {
	console.log('Getting Gecko price...');
	// Search for 'data-coin-symbol="vinci" data-target="price.price">$' extract until '</span>', strip commmas
	//let url = 'https://www.coingecko.com/en/coins/davinci-token';
	let url = '/proxy?url='+escape('https://www.coingecko.com/en/coins/davinci-token');
	let res = await fetch(url);
	let inf = await res.text();
	//console.log('Html:', inf);
	let price, pricen;
	let pricex = extractor(inf, 'data-coin-symbol="vinci" data-target="price.price">$', '</span>');
	console.log('Gecko price:', pricex);
	if(!pricex){
		price = 'N/A';
	} else {
		pricen = parseFloat(pricex) || 0.0;
		price  = (pricen / session.oneusd).toFixed(4);
	}
	console.log('Gecko price:', price);
    $('pool-gecko').innerHTML = price + ' ONE';
	return price;
}


async function onStake() {
	if(!Davinci.address){ return; }
	//let bal = await getBalance(Davinci.address);
	//$('stakebal').innerHTML = bal.toFixed(4);
	let url = '/api/stakereg/'+Davinci.addrexx;
	let res = await fetch(url);
	let inf = await res.json();
	console.log('Res', inf);
	if(inf.error){
		alert('Error registering: '+inf.error);
		$('stakebut').innerHTML = 'ERROR';
	} else {
		console.log('Staking:', inf);
		$('stakebut').innerHTML = 'SUCCESS!';
		$('stakebut').disabled = true;
		$('stakebut').classList.add('disabled');
	}
}

async function checkStakesReg() {
	if(!Davinci.addrexx){ return; }
	console.log('Checking stakes registry...');
	let url = '/api/checkstakereg/'+Davinci.addrexx;
	let res = await fetch(url);
	let inf = await res.json();
	let ok  = false;
	console.log('Stakes reg?', inf);
	if(inf && inf.status=='OK'){
		ok = true;
		$('stakebut').disabled = true;
		$('stakebut').classList.add('disabled');
	} else {
		$('stakebut').disabled = false;
		$('stakebut').classList.remove('disabled');
	}
	return ok;
}


async function getUserStakes() {
	if(!Davinci.addrexx){ return; }
	console.log('Getting user stakes...');
	let url = '/api/getvincis/stks/'+Davinci.addrexx;
	let res = await fetch(url);
	let inf = await res.json();
	//console.log('Inf', inf);
	console.log('Stakes:', inf);
	let bal, shr;
	if(!inf || inf.error){
		bal = 'N/A';
		shr = 'N/A';
	} else {
		bal = money((parseFloat(inf.balance) || 0.0), 2);
    	shr = (inf.shares * 100).toFixed(2);
    	if(inf.balance > 0){
    		$('stakebut').disabled = true;
    		$('stakebut').classList.add('disabled');
    	}
	}
    $('stakewin').innerHTML = bal;
    $('shares').innerHTML   = shr;
	return bal;
}

async function payToken(receiver, amount, token) {
    console.log('PAY TOKEN TO', receiver, amount, token);
    let adr = addressToOne(receiver);
	//let wei = (amount * ONEWEI).toString();
	let wei = Harmony.utils.toWei(amount, Harmony.utils.Units.one);
	let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.address };
    let pay = {};
    console.log('ADR:', adr)
    console.log('WEI:', wei)
    try { 
        let ctr = await Davinci.contract(HRC20.abi, token);
		ctr.wallet = Davinci.wallet;
        let res = await ctr.methods.transfer(adr, wei).send(gas);
	    console.log('RES:', res)
        if(res.status=='called'){ 
        	console.log('Paytoken called ok'); 
        	console.log(res.transaction.txStatus, res.transaction.id);
        	pay.txid = res.transaction.id;
        } else{ 
        	console.log('Paytoken error', res); 
        	pay.error = 'wallet error';
        }
    } catch(ex) { 
    	console.log('Paytoken error:', ex);
        pay.error = 'contract error';
    }
    return pay;
}

async function showMessage(txt) {
	$('message').innerHTML = txt;
}

async function onUnlock() {
	console.log('Unlocking...');
	showMessage('Wait, unlocking...');
	$('unlock').classList.add('disabled');
    let sinker = '0x7bdef7bdef7bdef7bdef7bdef7bdef7bdef6e7ad';
    // Unlock value in vinci.html
	console.log('Burning', unlock, 'VNL from', Davinci.addrexx); // unlock value from vinci.html
	let pay = await payToken(sinker, unlock, config.VNLToken); // Send VNL from user to sink
	if(pay.error){ showMessage('Payment rejected by user '+pay.error); return; }
	let txid = pay.txid;
	console.log('Sending txid', txid, 'to server...');
	showMessage('Wait, verifying Tx...');
	let res = await fetch('/vinci/unlock/'+txid); // Send txid to server
	let inf = await res.json();
	console.log('Res', inf);
	if(inf.error){ showMessage('Server error unlocking VINCIs: '+inf.error); return; }
	let url = config.EXPLORER+'tx/'+inf.txid;
	showMessage(`<a href="${url}" target="_blank">VINCIs unlocked</a>, check your wallet!`);
}

async function main() {
	await startDavinci();
	await getViperPrice();
	await showBalance();
	      showLastPrice();
	      //showVinciPrice();
	await showLockedBalance();
	await showCurrentSupply();
	await showTotalSupply();
	await showMarketCap();
	//mintSome();
	// Swappers price
	getSeeswapPrice();
	getSushiPrice();
	getMochiPrice();
	getOpenPrice();
	getLootPrice();
	getGeckoPrice();
	let ok = await checkStakesReg();
	if(ok){ getUserStakes(); }

}
window.onload = main;

// end