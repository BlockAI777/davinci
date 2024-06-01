// Distribution bots

let { Harmony } = require('@harmony-js/core');
let fetch    = require('node-fetch');
let HRC20    = require('./public/contracts/HRC20.json');
let BALANCER = require('./public/contracts/Balancer.json');
let BATCHPAY = require('./public/contracts/Payments.json');
let db       = require('./database.js');
let ACCTS    = require('./accounts.js');
let ONE      = BigInt(10**18);
let VINCI    = process.env.VINCITOKEN;
let VNL      = process.env.VNLTOKEN;


// UTILS

function money(n) { return (n/10**18).toFixed(4).padStart(20); }
function pad(n, d=4, p=20) { return n.toFixed(d).padStart(p); }

function nextYear(date) {
	if(!date){ date = new Date(); }
    var yy = date.getFullYear();
    var mm = date.getMonth();
    var dd = date.getDate();
    var ny = new Date(yy+1, mm, dd);
	return ny;
}

function weekIni(date) {
	if(!date){ date = new Date(); }
}

async function getBalance(address) {
    let cfg = await db.getSettings();
    let hmy = new Harmony(cfg.neturl, { chainType: 'hmy', chainId: cfg.chainid });
    //let hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: process.env.CHAINID })
    let gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
    let ctr = hmy.contracts.createContract(HRC20.abi, VINCI);
    let res = await ctr.methods.balanceOf(address).call(gas);
    //console.warn('Balance', res.toString());
    //console.warn('Balance', money(res.toString()));
    let bal = res.toString()/10**18;
    return bal;
}

async function getTokenBalances(token, acts, cnt, hmy) {
	let lst = [];
	try {
		let cfg, gas, ctr, res, n, m;
        cfg = await db.getSettings();
		if(!hmy){ 
    		hmy = new Harmony(cfg.neturl, { chainType: 'hmy', chainId: cfg.chainid });
			//hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: process.env.CHAINID });
		    let act = hmy.wallet.addByPrivateKey(process.env.OPKEY);
		    hmy.wallet.setSigner(act.address);
		}
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
	    ctr = hmy.contracts.createContract(BALANCER.abi, ACCTS.balancer);
	    max = acts.length;
	    num = 0;
	    while(num < max){
	    	adr = acts.slice(num, num+cnt);
	    	num += cnt;
	    	res = await ctr.methods.getBalances(token, adr).call(gas);
			//console.warn('BALANCES', res);
			if(res && res.length > 0){
		    	res.map((x) => { lst.push(x.toString()) });
			}
	    }
		//console.warn('BALANCES', lst);
	} catch(ex) {
		console.error('Error getting balances', ex);
	}
	return lst;
}

async function transfer(receiver, amount, token, key) {
    let hmy, wei, cfg, gas, ctr, res, ok;
    cfg = await db.getSettings();
    hmy = new Harmony(cfg.neturl, { chainType: 'hmy', chainId: cfg.chainid });
    //hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: process.env.CHAINID })
    const account = hmy.wallet.addByPrivateKey(key);
    //hmy.wallet.setSigner(account.address);

    wei = BigInt(amount * 10**18).toString();
    console.warn('Sender', account.address);
    console.warn('Recver', receiver);
    console.warn('Amount', amount);
    console.warn('Wei', wei);
    //process.exit(0);
    gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
    ctr = hmy.contracts.createContract(HRC20.abi, token);
    res = await ctr.methods.transfer(receiver, wei).send(gas);
    //console.warn('Res', res);
    console.warn('Status', res.status);
    console.warn('Tx status', res.transaction.txStatus);
    ok = false;
    if (res.status === 'rejected') {
        ctr.methods.transfer(receiver, wei).call(gas).then().catch(revertReason => console.error({revertReason}));
    } else {
    	ok = true;
    }
    return ok;
}

// FNDR

async function botFndr() {
    console.warn(new Date(), '---- BOT FNDR');
	// get balance from guild
	// get last balance from db
	// calc diff
	// dist diff among users in db
	// save new balance in db
	// sends VNL
	let guild  = 'FNDR';
	let mguild = 'MFND';
	let master = ACCTS.guilds.fndr;
	console.warn(guild, master.substr(0,10));
	let bal1 = await getBalance(master);
	bal1 = parseInt(bal1);
    console.warn('CT Balance', bal1);
	let bal2 = await db.getAccountBalance(master, mguild);
    console.warn('DB Balance', bal2);
    let diff = bal1-bal2;
    console.warn('Shares', diff);
    if(diff==0){
    	console.warn('Nothing to share');
    	return;
    }
	let acts = await db.getAccountsByGuild(guild);
	let act, amt, nyr, rec, ok;
	for (var i = 0; i < acts.length; i++) {
		act = acts[i];
		amt = diff * act.percent / 100;
		// save amt to db
		nxy = nextYear();
		rec = {
			address:act.address, 
			guild:act.guild,
			percent:act.percent,
			total:amt,
			locked:amt,
			unlock:nxy,
			status:0
		};
		ok = await db.newVincisPayment(rec);
	    console.warn('- Amount', amt, act.percent, '%', act.address.substr(0,10), ok.status);
		ok = await db.updateAccountBalance(parseFloat(act.total)+amt, act.address, guild);
	}
	// Save new guild balance to DB
	let newBal = bal1;
	ok = await db.updateAccountBalance(newBal, master, mguild);
	console.warn('Balance updated', newBal, ok);
	// TODO: transfer VNL
	// transferVNL();
}

async function botTeam() {
    console.warn(new Date(), '---- BOT TEAM');
    console.warn(new Date(), '---- DISABLED');
    return;
	let guild  = 'TEAM';
	let mguild = 'MTEA';
	let master = ACCTS.guilds.team;
	console.warn(guild, master.substr(0,10));
	let bal1 = await getBalance(master);
	bal1 = parseInt(bal1);
    console.warn('CT Balance', bal1);
	let bal2 = await db.getAccountBalance(master, mguild);
    console.warn('DB Balance', bal2);
    let diff = bal1-bal2;
    console.warn('Shares', diff);
    if(diff==0){
    	console.warn('Nothing to share');
    	return;
    }
	let acts = await db.getAccountsByGuild(guild);
	let act, amt, nyr, rec, ok;
	for (var i = 0; i < acts.length; i++) {
		act = acts[i];
		amt = diff * act.percent / 100;
		// save amt to db
		nxy = nextYear();
		rec = {
			address:act.address, 
			guild:act.guild,
			percent:act.percent,
			total:amt,
			locked:amt,
			unlock:nxy,
			status:0
		};
		ok = await db.newVincisPayment(rec);
	    console.warn('- Amount', amt, act.percent, '%', act.address.substr(0,10), ok.status);
		ok = await db.updateAccountBalance(parseFloat(act.total)+amt, act.address, guild);
	}
	// Save new guild balance to DB
	let newBal = bal1;
	ok = await db.updateAccountBalance(newBal, master, mguild);
	console.warn('Balance updated', newBal, ok);
	// TODO: transfer VNL
	// transferVNL();
}

async function botArts(dini, dend) {
    console.warn(new Date(), '---- BOT ARTS');
	let guild  = 'ARTS';
	let mguild = 'MART';
	let master = ACCTS.guilds.arts;
	console.warn(guild, master.substr(0,10));
	let bal1 = await getBalance(master);
	bal1 = parseInt(bal1);
    console.warn('CT Balance', bal1);
	let bal2 = await db.getAccountBalance(master, mguild);
    console.warn('DB Balance', bal2);
    let diff = bal1-bal2;
    console.warn('Shares', diff);
    if(diff==0){
    	console.warn('Nothing to share');
    	return;
    }

    let bal40 = diff * 0.4; // 40% sellers
    let bal60 = diff * 0.6; // 60% buyers
    if(!dini){ dini = weekIni(); }
    if(!dend){ dend = weekEnd(); }

	let tots = await db.getTotalTransfers(dini, dend);
	let slrs = await db.getArtistsSellers(dini, dend);
	let byrs = await db.getArtistsBuyers(dini, dend);
    console.warn('Bal40', bal40);
    console.warn('Bal60', bal60);
    console.warn('Totals', tots);

	// Sellers 40%
	let act, amt, nyr, rex, rec, ok;
	nxy = nextYear();
	for (var i = 0; i < slrs.length; i++) {
		act = slrs[i];
		amt = Math.floor( bal40 * (act.total / tots) * 100 ) / 100;
    	//console.warn('Act', act);
    	console.warn('Seller', act.address.substr(0,9), 'sold', act.total, '->', amt);
    	// Check account exists
    	rex = await db.getAccount(act.address, guild);
    	//console.warn(rex);
    	if(!rex || rex.error){ ok = await db.newAccount({address:act.address, guild:guild}); }
		rec = {
			address: act.address, 
			guild:   guild,
			percent: 0,
			total:   amt,
			locked:  amt,
			unlock:  nxy,
			status:  0
		};
		ok = await db.newVincisPayment(rec);
	    console.warn('- Amount', amt, act.address.substr(0,10), ok.status);
		ok = await db.incrementAccountBalance(amt, act.address, guild);
	}

	// Buyers 60%
	for (var i = 0; i < byrs.length; i++) {
		act = byrs[i];
		amt = Math.floor( bal60 * (act.total / tots) * 100 ) / 100;
    	//console.warn('Act', act);
    	console.warn('Buyer', act.address.substr(0,9), 'bought', act.total, '->', amt);
    	// Check account exists
    	rex = await db.getAccount(act.address, guild);
    	//console.warn(rex);
    	if(!rex || rex.error){ ok = await db.newAccount({address:act.address, guild:guild}); }
		rec = {
			address: act.address, 
			guild:   guild,
			percent: 0,
			total:   amt,
			locked:  amt,
			unlock:  nxy,
			status:  0
		};
		ok = await db.newVincisPayment(rec);
	    console.warn('- Amount', amt, act.address.substr(0,10), ok.status);
		ok = await db.incrementAccountBalance(amt, act.address, guild);
	}

	// Save new guild balance to DB
	let newBal = bal1;
	ok = await db.updateAccountBalance(newBal, master, mguild);
	console.warn('Balance updated', newBal, ok);
	// TODO: transfer VNL
	// transferVNL();
}

async function botStks() {
    console.warn(new Date(), '---- BOT STKS');
	let guild  = 'STKS';
	let mguild = 'MSTK';
	let master = ACCTS.guilds.stks;
	let minStk = 1000;
	console.warn(guild, master.substr(0,10));
	let bal1 = await getBalance(master);
	bal1 = parseInt(bal1);
    console.warn('CT Balance', bal1);
	let bal2 = await db.getAccountBalance(master, mguild);
    console.warn('DB Balance', bal2);
    let shrs = bal1-bal2;
    console.warn('Shares', shrs);
    if(shrs==0){
    	console.warn('Nothing to share');
    	return;
    }

	let acts = await db.getAccountsByGuild(guild);
    console.warn('Acts', acts.length);

	let act, pct, amt, nyr, rex, rec, bal, lst, ok, ok1, ok2;
	nxy = nextYear();

	// List all addresses
	let adrs = [];
    acts.map((x) => { adrs.push(x.address); });
	//console.warn('adrs', adrs);

	// Get batch balances from accounts
	let tot  = 0;
	let list = {};
	let bals = await getTokenBalances(VINCI, adrs, 50);
    console.warn('Balances', bals);
	if(!bals || bals.length<1){ console.warn('Nothing to stake'); return; }

	for (var i = 0; i < acts.length; i++) {
		act = acts[i];
		bal = parseFloat(bals[i])/10**18;
		//bal = await getBalance(act.address);
		if(bal < minStk){ 
			//console.warn('Not enough balance', act.address.substr(0,9), bal);
			continue;
		}
		tot += bal;
		list[act.address] = bal;
	}
    console.warn('Total', tot);

    // Calc share per account
	for (var adr in list) {
		bal = list[adr];
		pct = list[adr] / tot;
		amt = Math.floor( shrs * pct * 100 ) / 100;
    	//console.warn('Act', act);
    	//console.warn('Stakes', adr.substr(0,9), amt, pct*100, '%');
		rec = {
			address: adr, 
			guild:   guild,
			percent: pct,
			total:   amt,
			locked:  amt,
			unlock:  nxy,
			status:  0
		};
		ok1 = await db.newVincisPayment(rec);
		ok2 = await db.incrementAccountBalance(amt, adr, guild);
	    console.warn('-', adr.substr(0,10), pad(bal), pad(amt), pad(pct*100), '%', ok1.status, ok2);
	}

	// Save new guild balance to DB
	let newBal = bal1;
	ok = await db.updateAccountBalance(newBal, master, mguild);
	console.warn('Balance updated', newBal, ok);
	// TODO: transfer VNL
	// transferVNL();
}

async function botPool(list) {
    console.warn(new Date(), '---- BOT POOL');
	let guild  = 'POOL';
	let mguild = 'MPOL';
	let master = ACCTS.guilds.pool;
	console.warn(guild, master.substr(0,10));
	let bal1 = await getBalance(master);
	bal1 = parseInt(bal1);
    console.warn('CT Balance', bal1);
	let bal2 = await db.getAccountBalance(master, mguild);
    console.warn('DB Balance', bal2);
    let shrs = bal1-bal2;
    console.warn('Shares', shrs);
    if(shrs==0){
    	console.warn('Nothing to share');
    	return;
    }

	console.warn('Getting Viper pool...');
	//let qry = {query:'{pair(id:"0xca3680580e01bd12cc86818fff62eda2d255677c"){token1Price}}'};
	let qry, url, opt, res, inf, dat, lst, uid, bal, tot, pct, shr, nyr, adr, ok;
	qry = {query:'{liquidityPositions(where:{pair:"0xca3680580e01bd12cc86818fff62eda2d255677c",liquidityTokenBalance_gt:0},orderBy:liquidityTokenBalance,orderDirection:desc){user{id} liquidityTokenBalance}}'};
	url = 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap-v2';
	opt = {
		method: 'POST', 
		headers: {'content-type': 'application/json'}, 
		body: JSON.stringify(qry)
	};
	res = await fetch(url, opt);
	inf = await res.json();
	//console.warn('Viper pool:', inf);
	lst = []; tot = 0;
	if(inf && inf.data){
		dat = inf.data.liquidityPositions || [];
		for (var i = 0; i < dat.length; i++) {
			uid = dat[i].user.id;
			bal = parseFloat(dat[i].liquidityTokenBalance);
			tot += bal;
			//console.warn(uid, bal.toFixed(4).padStart(15));
			lst.push([uid,bal,0,0]);
		}
	}
	console.warn('Total pool', pad(tot));
	if(lst.length<1){ console.warn('No liquidity providers'); return; }

	// Calc liquidity share
	nxy = nextYear();
	for (var i = 0; i < lst.length; i++) {
		adr = lst[i][0];
		bal = lst[i][1];
		pct = lst[i][1]/tot;
		amt = Math.floor( shrs * pct * 100 ) / 100;
		lst[i][2] = pct;
		lst[i][3] = amt;
		rec = {
			address: adr, 
			guild:   guild,
			percent: pct,
			total:   amt,
			locked:  amt,
			unlock:  nxy,
			status:  0
		};
		ok = await db.newVincisPayment(rec);
		//ok2 = await db.incrementAccountBalance(amt, adr, guild);
	    //console.warn('-', adr.substr(0,10), pad(amt), pad(pct*100), '%', ok1.status);
		console.warn(adr, pad(bal), pad(pct*100,2,10), pad(amt,2,12), ok.status);
	}
	console.warn('Pool count', lst.length);
	let newBal = bal1;
	ok = await db.updateAccountBalance(newBal, master, mguild);
	console.warn('Balance updated', newBal, ok);
}

async function botGold() {
    console.warn(new Date(), '---- BOT GOLD');
	let guild  = 'STKS';
	let minStk = 1000;
	//let gold = await db.getGoldenUsers();
	let acts = await db.getAccountsByGuild(guild);
    //console.warn('Gold', gold);
    console.warn('Acts', acts.length);


	// List all addresses
	let adrs = [];
    acts.map((x) => { adrs.push(x.address); });
	//console.warn('adrs', adrs);

	// Get batch balances from accounts
	let bals = await getTokenBalances(VINCI, adrs, 50);
    console.warn('Balances', bals);
	if(!bals || bals.length<1){ console.warn('No golden badges to give'); return; }

	let adr, bal, bdg, ok;
	let won = 0;
	let los = 0;
	for (var i = 0; i < adrs.length; i++) {
		adr = adrs[i];
		bal = parseFloat(bals[i])/10**18;
		bdg = bal>=minStk;
		won += bdg?1:0;
		los += bdg?0:1;
		ok  = await db.updateGoldenBadge(adr, bdg);
	    console.warn(bdg?'-':'x', adr.substr(0,10), pad(bal));
	}

	console.warn(pad(won,0,5), 'keep golden badge');
	console.warn(pad(los,0,5), 'lose golden badge');
}

async function transferVNL(num=10) {
	// /bots/transfer
	// From minterVNL to 100 accounts with status = 0
	console.warn('Batch payments...');
	let ok, data, adrs, amts, tot;
	try {
		adrs = [];
		amts = [];
		ok   = await db.setVincisPending(num);
		data = await db.getVincisPending(num);
		tot  = data.length;
		//console.warn('Data', data);
		if(data.error || data.length<1){ console.warn('Nothing to pay'); return 0; }
		data.map(act=>{adrs.push(act.address); wei = (BigInt(Math.floor(parseFloat(act.total))) * ONE).toString(); amts.push(wei);});
		//console.warn('Adrs', adrs);
		//console.warn('Amts', amts);
		console.warn('CTR', ACCTS.batchpay);
		console.warn('BNK', ACCTS.vnlbank.adr);
		console.warn('ADR', adrs.length);
		console.warn('AMT', amts.length);
		ok = await batchPayments(ACCTS.batchpay, adrs, amts, ACCTS.vnlbank.adr, process.env.OPKEY);
		console.warn('Batch payments', ok);
		if(ok){ 
			ok = await db.setVincisPaid(num);
			return tot;
		}
	} catch(ex) {
		ok = false;
		console.error('Error transfering VNL', ex);
		return -1;
	}
	return -2;
}

async function batchPayments(batchpayer, adrs, amts, bank, key) {
    let hmy, cfg, gas, ctr, res, ok;
    try {
	    cfg = await db.getSettings();
	    hmy = new Harmony(cfg.neturl, { chainType: 'hmy', chainId: cfg.chainid });
	    //hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: process.env.CHAINID })
	    let account = hmy.wallet.addByPrivateKey(key);
	    hmy.wallet.setSigner(account.address);
	    gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gasbatch };
	    ctr = hmy.contracts.createContract(BATCHPAY.abi, batchpayer);
	    res = await ctr.methods.batchPayments(bank, adrs, amts).send(gas);
	    //console.warn('Res', res);
	    console.warn('Status', res.status);
	    console.warn('Tx status', res.transaction.txStatus);
	    console.warn('Tx id', res.transaction.id);
	    ok = false;
	    if (res.status === 'rejected') {
	        ctr.methods.batchPayments(bank, adrs, amts).call(gas).then().catch(revertReason => console.error({revertReason}));
	    } else {
	    	ok = true;
	    }
	} catch(ex) {
		ok = false;
		console.error('Error in batch payments', ex);
	}
    return ok;
}

function sleep(millis) {
	return new Promise(resolve => setTimeout(resolve, millis));
}

async function autoBatch(num=10) {
    console.warn(new Date(), 'AutoBatch started...');
	let cnt = 0;
	let sum = 0;
	let err = 0;
	let res = 0;
	try {
		while(cnt<20) {
			res = await transferVNL(num);
			if(res==0){ break; } /* NO PAYMENTS */
			if(res==-1){ err++; if(err>3){ break; } else { sleep(5000); continue; } } /* ERROR, RETRY */
			if(res==-2){ break; } /* UNKNOWN */
			if(res>0){ cnt++; sum+=res; sleep(5000); continue; } /* NEXT BATCH */
		}
	} catch(ex) {
		console.error('Error in autobatch', ex);
	}
    console.warn(new Date(), 'AutoBatch ended', sum, 'payments in ', cnt, 'batches');
}


//---- EXPORTS

module.exports = {
    botFndr,
    botArts,
    botStks,
    botPool,
    botGold,
    transferVNL,
    autoBatch
}

//botFndr();
//botTeam();
//botArts('2021-05-20','2021-05-27');
//botStks();
//botPool();
//botGold();


// END