// API

let crypto      = require('crypto'); 
let fetch       = require('node-fetch');
let { Harmony } = require('@harmony-js/core');
let db          = require('./database');
let Market      = require('./public/contracts/Market3.json');
let Auctions    = require('./public/contracts/Auctions.json');
let Token721    = require('./public/contracts/DavinciToken.json');
let Token1155   = require('./public/contracts/DavinciMultipleToken.json');
let Sculptor    = require('./public/contracts/Sculptor.json');
let Painter     = require('./public/contracts/Painter.json');
let HRC20       = require('./public/contracts/HRC20.json');

let operator    = process.env.OPERATOR;
//let tokenFactory = '0xD9c1FC6CCd93B3e1D8eE8fFF019c9602a5aB2309';
//let multiFactory = '0x4Bd0bEf4c7739b6cbdC386B1b6D12F70d9383726';
let topicToken  = '0x5bcc83d6bc80430f5d0d70151a09012f9e5edd2256bddb907404886915254711';
let topicMulti  = '0x5c0c0f5278addeacb6676046fc1078622d1a1a1fc8a589035b5609ae4fe29dca';
let topicOwner  = '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0';

const ONEWEI    = 10**18;
const VINCI     = process.env.VINCITOKEN;
const VNLTOKEN  = process.env.VNLTOKEN;

function now(){
    //12-31 23:59:31.123
    let t = new Date();
    let m = (t.getMonth()+1).toString().padStart(2,'0');
    let d = t.getDate().toString().padStart(2,'0');
    let h = t.getHours().toString().padStart(2,'0');
    let n = t.getMinutes().toString().padStart(2,'0');
    let s = t.getSeconds().toString().padStart(2,'0');
    let x = t.getMilliseconds().toString().padStart(3,'0');
    return '> '+m+'-'+d+' '+h+':'+n+':'+s+'.'+x;
}

function enow(){
    return 'ERROR>' + (new Date()).toJSON();
}

async function HMY(neturl, chainid, privateKey) {
    //let CHAINID = parseInt(process.env.CHAINID) || 2; // TESTNET
    //if(!process.env.NETWORK){ console.error(enow(), 'initHmy: No env vars'); return null; }
    //let hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: CHAINID })
    if(!neturl){ console.error(enow(), 'initHmy: No env vars'); return null; }
    let hmy = new Harmony(neturl, { chainType: 'hmy', chainId: chainid });
    if(privateKey){
        const account = hmy.wallet.addByPrivateKey(privateKey);
        hmy.wallet.setSigner(account.address);
    }
    //let res = await hmy.blockchain.getShardingStructure();
    //hmy.shardingStructures(res.result);
    return hmy;
}

async function randomAddress() {
    let buf = await crypto.randomBytes(20);
    let adr = '0x'+buf.toString('hex');
    return adr;
}

function addressToOne(hmy, address) {
    if(address.startsWith('0x')){
        return hmy.crypto.getAddress(address).bech32;
    }
    return address;
}

function addressToHex(hmy, address) {
    if(address.startsWith('one')){
        return hmy.crypto.getAddress(address).checksum.toLowerCase();
    }
    return address;
}


async function buyArtwork(address, buyer) {
    console.warn('Buy token', address, ', buyer', buyer);
    if(!address){ 
        console.error(enow(), 'Token address is required');
        return {error: 'Token address is required'};
    }

    if(!buyer){ 
        console.error(enow(), 'Buyer address is required');
        return {error: 'Buyer address is required'};
    }


    try {
        let cfg  = await db.getSettings();
        let hmy  = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        let item = await db.getArtwork(address);
        if(!item){
            console.error(enow(), 'Token not found');
            return {error: 'Token not found'};
        }

        if(!item.onsale){
            console.error(enow(), 'Token not for sale');
            return {error: 'Token not for sale'};
        }

        if(!item.copies<1){
            console.error(enow(), 'No more collectibles available');
            return {error: 'No more collectibles available'};
        }

        // Get item info
        let collection = item.collection;
        let tokenType  = item.type;
        let owner      = item.owner;

        let order = await db.getOrderByAddress(address)
        if(!order || order.error){ 
            console.warn(now(), 'Order not found', order);
            // Save first order
            let res = await newMarketOrder(address, user, hmy);  // Save to blockchain
            if(!res || res.error){
                console.error(enow(), 'Market order not created', res);
                return {error:'Market order not created'};
            }
            order = await db.getOrderByArtwork(address)

            /*
            let now = (new Date()).toJSON();
            let fees = 4; // 2% sell 2% buy
            order = {
                address:     res.address,  // orderid
                ordertype:   0,  // direct sale
                startdate:   now,
                enddate:     now,
                owner:       item.owner,
                seller:      item.owner,
                buyer:       buyer,
                collection:  item.collection,
                tokentype:   item.type,
                tokenid:     item.address,
                sellprice:   item.saleprice,
                buyprice:    item.saleprice,
                amount:      item.copies,
                fees:        fees,
                royalties:   item.royalties,
                beneficiary: item.creator,
                status:      1  // open
            }
            console.warn('Order', order);
            let reo = await db.newOrder(order);  // Now save to DB
            if(!reo || reo.error){
                console.error(enow(), 'Error creating order', reo);
                return {error: 'Error creating order'};
            }
            */
        }

        // Market Buy
        let orderId = order.address;
        console.warn(now(), 'Market order', orderId, buyer, 1)
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        abi = Market.abi;
        ctr = hmy.contracts.createContract(abi, market.address);
        res = await ctr.methods.buy(orderId, buyer, 1).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not buy artwork'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.buy(orderId, buyer, 1).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Buy order rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            //console.warn('Buy order approved');
            //let rec = {address:orderId, ordertype: 0, startdate: nowx, enddate: endx, owner: token.owner, seller: token.owner, token: token.address, tokentype: token.type, collection: token.collection, sellprice: token.saleprice, amount: token.copies, fees: market.fees, royalties: token.royalties, beneficiary: token.creator, status: 1};
            //let rex = await db.newOrder(rec);
            //console.warn('Saved order', rex);
            let rex, rec;
            try {
                rec = {txhash:res.transaction.hash, orderid:orderId, sender:buyer, receiver:owner, tokentype:tokenType, collection:collection, tokenid:address, value:item.saleprice};
                rex = await db.newTransfer(rec);
            } catch(ez){
                console.error(enow(), 'Error saving transfer', ez);
                console.error(enow(), 'Transfer record', rec);
            }
            return {status:'CONFIRMED', orderId:orderId, address:address};
        } else {
            console.error(enow(), 'Order error', res.transaction.txStatus);
            return {error:'Unknown order error: '+res.transaction.txStatus};
        }
    } catch(ex){
        console.error(enow(), 'Error buying token:', ex);
        return {error:'Cancelled buying token: '+ex.message};
    }
    return {status:'Status unknown'};
}

/*
async function buyArtwork_OLD(tokenId, txId) {
    console.warn('Transfer token', tokenId, txId);
    let hmy = await HMY(process.env.OPKEY);

    try {
        let item = await db.getArtwork(tokenId);
        if(!item){
            console.error(enow(), 'Token not found');
            return {error: 'Token not found'};
        }

        if(!item.onsale){
            console.error(enow(), 'Token not for sale');
            return {error: 'Token not for sale'};
        }

        let tx = await getTransaction(hmy, txId)
        if(!tx){ 
            console.error(enow(), 'Tx not found');
            return {error: 'Payment not found'};
        }

        // Get tx info
        let collection = item.collection;
        let tokenType  = item.type;
        let owner      = item.owner;
        let ownero     = addressToOne(hmy, item.owner);
        let buyer      = tx.from;
        let buyerx     = addressToHex(hmy, buyer);
        let address    = tx.input;
        if(!address){ 
            console.error(enow(), 'Token address not found');
            return {error: 'Token address not found'};
        }

        // Check value >= price
        let valuex = BigInt(parseInt(tx.value, 16));
        let pricex = BigInt(item.saleprice*10**18);
        let value  = item.saleprice;
        console.warn('Price check', valuex, pricex);
        if(valuex<pricex){
            console.error(enow(), 'Payment less than sale price');
            return {error: 'Payment less than sale price'};
        }

        // Pay fees
        let fees = 0;

        // Pay royalties
        let royalties = 0;

        // Create order
        let now = (new Date()).toJSON();
        let order = {
            ordertype: 0,
            startdate: now,
            enddate: now,
            owner: item.owner,
            seller: item.owner,
            buyer: buyerx,
            token: item.address,
            tokentype: item.type,
            sellprice: item.saleprice,
            buyprice: item.saleprice,
            amount: 1,
            fees: fees,
            royalties: royalties,
            beneficiary: item.creator,
            status: 3
        }
        let reo = await db.newOrder(order);
        if(!reo || reo.error){
            console.error(enow(), 'Error creating order', reo);
        }

        // Transfer money to owner
        let res = await sendPayment(hmy, ownero, value);
        if(!res || res.error){ 
            console.error(enow(), 'Error sending payment to owner', res.error);
            return {error: 'Error sending payment to owner'};
        }

        // Transfer token
        let rex = await transferToken(hmy, collection, tokenId, tokenType, owner, buyerx);
        if(!rex || rex.error){
            console.error(enow(), 'Error transferring token:', rex);
            return {error:'Token transfer incomplete'};
        }

        // Change owner in DB
        let rez = await db.changeOwner(tokenId, owner, buyerx);
        if(!rez || rez.error) {
            console.error(enow(), 'Error transferring ownership', rez);
            return {error:'Ownership transfer incomplete'};
        }
    } catch(ex){
        console.error(enow(), 'Error buying token:', ex);
        return {error:'Cancelled buying token: '+ex.message};
    }
    return {status:'CONFIRMED'};
}
*/

async function payment(hmy, receiver, amount) {
    console.warn('Sending payment', receiver, amount);
    let inf, res, txn;
    //let hmy = await HMY(process.env.EXKEY);
    //let wei = BigInt(amount*10**18).toString(16);
    let cfg = await db.getSettings();
    let adr = addressToOne(hmy, receiver);
    let wei = new hmy.utils.Unit(amount).asOne().toWei();
    let gas = new hmy.utils.Unit('30').asGwei().toWei();
    //let gas = cfg.gasprice;
    let lmt = cfg.gaslimit;

    inf = {
        to       : adr,
        value    : wei,
        shardID  : 0,
        toShardID: 0,
        gasLimit : lmt,
        gasPrice : gas
    };
    //console.warn('Tx Inf', inf);

    try { 
        //hmy.wallet.addByPrivateKey(process.env.OPKEY);
        txn = hmy.transactions.newTx(inf);
        //console.warn('Payment tx', txn);
 
        let signed = await hmy.wallet.signTransaction(txn);
        //let acct   = await new hmy.Modules.Account(process.env.OPKEY);
        //let signed = await acct.signTransaction(txn);

        res = await hmy.blockchain.sendTransaction(signed);
        if(res.error){ 
            console.error(enow(), 'Tx Error:', res.error.message)
            return {error:res.error.message};
        } else { 
            console.warn('CONFIRMED', res.result);
            return {status:'CONFIRMED', result:res.result};
        }
    } catch(ex){
        console.error(enow(), 'Error:', ex);
        return {error:ex.message};
    }
    return {error:'Error while sending payment'};
}

async function payToken(hmy, receiver, amount, token) {
    console.warn('Pay token:', receiver, amount, token);
    let cfg = await db.getSettings();
    let adr = addressToOne(hmy, receiver);
    let wei = new hmy.utils.Unit(amount).asOne().toWei();
    //let wei = amount;
    let gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };

    try {
        let ctr = hmy.contracts.createContract(HRC20.abi, token);
        let res = await ctr.methods.transfer(adr, wei).send(gas);
        //console.warn('RES',res); 
        if(res.status=='called'){ 
            console.warn(res.transaction.txStatus, res.transaction.id); 
            return {status:'CONFIRMED', result:res.transaction.id};
        } else { 
            console.error(enow(), 'PAYTOKEN ERROR', res);
            return {error:'Tx rejected'};
        }
    } catch(ex){ 
        console.error(enow(), 'PayToken Error:', ex) 
        return {error:ex.message};
    }
    return {error:'Unknown error while sending token payment'};
}


async function transferToken(hmy, collection, tokenId, tokenType, oldOwner, newOwner) {
    console.warn('Transferring token', tokenId, tokenType, 'from', oldOwner, 'to', newOwner);
    let cfg, gas, ctr, res;
    try {
        cfg = await db.getSettings();
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        if(tokenType=='721'){ 
            abi = Token721.abi;
            ctr = hmy.contracts.createContract(abi, collection);
            res = await ctr.methods.safeTransferFrom(oldOwner, newOwner, tokenId).send(gas);
        } else {
            abi = Token1155.abi;
            ctr = hmy.contracts.createContract(abi, collection);
            res = await ctr.methods.safeTransferFrom(oldOwner, newOwner, tokenId, 1, []).send(gas);
        }
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not send transaction'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            console.error(enow(), 'Rejected', res);
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            //console.warn('Approved');
            return {status:'CONFIRMED'};
        } else {
            console.error(enow(), 'Transfer error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error transferring token', ex);
        return {error:'Error transferring token to new owner'};
        // TODO: Revert payment?
    }
    console.error(enow(), 'Unknown error transferring token');
    return {error:'Unknown error transferring token'};
}

async function tokenBalance(address) {
    //console.warn('Get balance:', address);
    let art = await db.getArtwork(address);
    if(!art || art.error) { 
        console.error(enow(), 'Artwork not found');
        return {error:art.error}; 
    }
    //console.warn('Token Type :', art.type);
    //console.warn('Collection :', art.collection);
    //console.warn('Token id   :', art.tokenid);
    //console.warn('Creator    :', art.creator);
    let hmy, cfg, res, gas, ctr, bal;
    try {
        cfg  = await db.getSettings();
        hmy  = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        if(art.type=='721'){ 
            abi = Token721.abi;
            ctr = hmy.contracts.createContract(abi, art.collection);
            res = await ctr.methods.ownerOf(art.tokenId).call(gas);
            //console.warn('721 Balance', res);
            bal = 0;
            if(res==art.creator){
                bal = 1;
            }
        } else {
            abi = Token1155.abi;
            ctr = hmy.contracts.createContract(abi, art.collection);
            res = await ctr.methods.balanceOf(art.creator, art.tokenid).call(gas);
            bal = parseInt(res.toString());
            //console.warn('1155 Balance', bal);
        }
        if(bal!=art.available){
            res = await db.updateCopies(art.address, bal);
            //console.warn('Copies updated to', bal);
            //console.warn('RES', res);
        }
        return {status:'SUCCESS', balance:bal};
    } catch(ex) {
        console.error(enow(), 'Error getting token balance', ex);
        return {error:'Error getting token balance'};
    }
    console.error(enow(), 'Unknown error getting token balance');
    return {error:'Unknown error getting token balance'};
}

async function ownerBalance(artwork, ownerid) {
    //console.warn('Get balance:', artwork);
    let art = await db.getArtwork(artwork);
    if(!art || art.error) { 
        console.error(enow(), 'Artwork not found');
        return {error:art.error}; 
    }
    let own = await db.getOwnerByArtwork(ownerid, artwork);
    if(!own || own.error) { 
        console.error(enow(), 'Owner not found');
        return {error:art.error}; 
    }
    let cfg, hmy, res, gas, ctr, bal;
    try {
        cfg  = await db.getSettings();
        hmy  = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        if(art.type=='721'){ 
            abi = Token721.abi;
            ctr = hmy.contracts.createContract(abi, art.collection);
            res = await ctr.methods.ownerOf(art.tokenid).call(gas);
            //console.warn('721 Balance', res);
            bal = 0;
            if(res==ownerid){
                bal = 1;
            }
        } else {
            abi = Token1155.abi;
            ctr = hmy.contracts.createContract(abi, art.collection);
            res = await ctr.methods.balanceOf(ownerid, art.tokenid).call(gas);
            bal = parseInt(res.toString());
            //console.warn('1155 Balance', bal);
        }
        if(bal!=own.available){
            res = await db.updateResell(artwork, ownerid, bal);
            console.warn('Copies updated to', bal);
            //console.warn('RES', res);
        }
        return {status:'SUCCESS', balance:bal};
    } catch(ex) {
        console.error(enow(), 'Error getting token balance', ex);
        return {error:'Error getting token balance'};
    }
    console.error(enow(), 'Unknown error getting token balance');
    return {error:'Unknown error getting token balance'};
}

async function newMarketOrder(address, user, hmy) {
    console.warn('--- New order for token', address, 'by', user);
    let market = {
        address: process.env.MARKET,
        fees: 0
    }
    //console.warn('Market', market);

    // Check address doesn't have an order already
    let exist = await db.getOrderByArtwork(address);
    if(exist && !exist.error){ 
        console.warn(now(), 'Market: Token already has an open order'); 
        return {status:'CONFIRMED', message:'Token already has an open order'};
    }

    let token = await db.getArtwork(address);
    if(!token || token.error){ 
        console.error(enow(), 'Token not found'); 
        return {error:'Token not found'}; 
    }
    //console.warn('Token', token);
    let tokenType = token.type=='1155'?1:0;
    let price = BigInt(token.saleprice * 10**18).toString();
    let royal = parseInt(token.royalties);

    if(token.creator != user){
        console.error(enow(), 'Only token creator can open orders'); 
        return {error:'Only token creator can open orders'};        
    }
    //console.warn('Ini', token.inidate)
    //console.warn('End', token.enddate)
    if(!token.inidate){ token.inidate = new Date(); }
    if(!token.enddate){ token.enddate = new Date(); }
    // End date if auction
    let nowd = new Date();
    let nown = nowd.getTime();
    let nowx = nowd.toJSON();
    let date = new Date(token.enddate.toJSON().substr(0,10));
    let enddate = new Date(date.setDate(date.getDate() + 1)); // Date at midnight
    //console.warn('ENDDATE', enddate);
    let endn = enddate.getTime();
    let endx = enddate.toJSON();
    //console.warn('Dates', nowx, endx);

    let orderId = await randomAddress();
    //let orderId = await new hmy.Modules.Account().address;
    //console.warn('Order', orderId);

    let cfg, res, gas, ctr;
    try {
        cfg = await db.getSettings();
        if(!hmy){ 
            //hmy = await HMY(process.env.OPKEY); 
            hmy  = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        }
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gasorder };
        abi = Market.abi;
        console.warn('--- New market order data:', address, orderId, token.owner, tokenType, token.collection, token.tokenid, token.copies, price, market.fees, royal, token.creator, enddate);
        ctr = hmy.contracts.createContract(abi, market.address);
        res = await ctr.methods.newOrder(orderId, token.owner, tokenType, token.collection, token.tokenid, token.copies, price, market.fees, royal, token.creator, endn).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not create order'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.warn('--- New market order rejected', address, orderId);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.newOrder(orderId, token.owner, tokenType, token.collection, token.tokenid, token.copies, price, market.fees, royal, token.creator, endn).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            console.warn('--- New market order approved', address, orderId);
            // Save order in database
            let rec = {address:orderId, ordertype: 0, startdate: nowx, enddate: endx, owner: token.owner, seller: token.owner, artwork: token.address, tokenid: token.tokenid, tokentype: token.type, collection: token.collection, sellprice: token.saleprice, amount: token.copies, fees: market.fees, royalties: royal, beneficiary: token.creator, status: 1};
            let rex = await db.newOrder(rec);
            //console.warn('Saved order', rex);
            return {status:'CONFIRMED', orderId:orderId};
        } else {
            console.warn('--- New market order error', orderId);
            console.error(enow(), 'Order error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.warn('--- New market order failed', orderId);
        console.error(enow(), 'Error creating order', ex);
        return {error:'Error creating order'};
        // TODO: Revert payment?
    }
    console.error(enow(), 'Unknown error creating order');
    return {error:'Unknown error creating order'};
}

async function newAuctionOrder(address, user, hmy) {
    console.warn('New auction for token', address, 'by', user);
    let market = {
        address: process.env.AUCTION,
        fees: 0
    }
    //console.warn('Market', market);

    // Check address doesn't have an order already
    let order = await db.getOrderByArtwork(address);
    if(order && !order.error && order.status == 0){ 
        console.error(enow(), 'Token already has an open auction'); 
        return {status:'CONFIRMED', message:'Token already has an open auction'};
    }

    let token = await db.getArtwork(address);
    if(!token || token.error){ 
        console.error(enow(), 'Token not found'); 
        return {error:'Token not found'}; 
    }
    //console.warn('Token', token);
    let tokenType = token.type=='1155'?1:0;
    let reserve   = token.saleprice;
    let reservex  = BigInt(reserve * 10**18).toString();
    let price     = reserve / 10;
    let pricex    = BigInt(price * 10**18).toString();
    let royal     = parseInt(token.royalties);

    if(token.creator != user){
        console.error(enow(), 'Only token creator can open auctions'); 
        return {error:'Only token creator can open auctions'};        
    }

    // End date if auction
    let nowd = new Date();
    let nown = nowd.getTime();
    let nowx = nowd.toJSON();
    let date = new Date(token.enddate);
    let enddate = new Date(date.setDate(date.getDate() + 1)); // Date at midnight
    let endn = enddate.getTime();
    let endx = enddate.toJSON();
    //console.warn('Dates', nowx, endx);

    let orderId = await randomAddress();
    //let orderId = await new hmy.Modules.Account().address;
    //console.warn('Order', orderId);

    let cfg, res, gas, ctr;
    try {
        cfg = await db.getSettings();
        if(!hmy){ hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY); }
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gasorder };
        abi = Auctions.abi;
        //console.warn('Auction data:', orderId, token.owner, tokenType, token.collection, token.tokenid, price, reserve, market.fees, royal, token.creator, enddate);
        ctr = hmy.contracts.createContract(abi, market.address);
        res = await ctr.methods.newOrder(orderId, token.owner, tokenType, token.collection, token.tokenid, pricex, reservex, market.fees, royal, token.creator, endn).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not create auction'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.newOrder(orderId, token.owner, tokenType, token.collection, token.tokenid, pricex, reservex, market.fees, royal, token.creator, endn).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            // Save order in database
            let rec = {address:orderId, ordertype: 1, startdate: nowx, enddate: endx, owner: token.owner, seller: token.owner, artwork: token.address, tokenid: token.tokenid, tokentype: token.type, collection: token.collection, sellprice: reserve, amount: 1, fees: market.fees, royalties: royal, beneficiary: token.creator, status: 1};
            let rex = await db.newOrder(rec);
            //console.warn('Saved order', rex);
            return {status:'CONFIRMED', orderId:orderId};
        } else {
            console.error(enow(), 'Auction error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error creating auction', ex);
        return {error:'Error creating auction'};
        // TODO: Revert payment?
    }
    console.error(enow(), 'Unknown error creating auction');
    return {error:'Unknown error creating auction'};
}

async function newResellOrder(rec, owner, hmy) {
    //console.warn('Resell artwork', rec.artwork);
    //console.warn('Owner', owner);
    //console.warn('Order', rec);
    let market = {
        address: process.env.MARKET,
        fees: 0
    }

    // Check address doesn't have an order already
    let exist = await db.getOpenOrderByOwner(rec.artwork, owner);
    if(exist && !exist.error){ 
        console.warn(now(), 'Resell: Token already has an open order'); 
        return {status:'FAILURE', message:'Token already has an open order'};
    }

    let token = await db.getArtwork(rec.artwork);
    if(!token || token.error){ 
        console.error(enow(), 'Token not found'); 
        return {error:'Token not found'}; 
    }
    //console.warn('Token', token);
    rec.tokentype = token.type;
    rec.royalties = token.royalties;
    rec.beneficiary = token.beneficiary;
    let tokenType = token.type=='1155'?1:0;
    let price = BigInt(rec.sellprice * 10**18).toString();
    let royal = parseInt(token.royalties);

    if(rec.owner != owner){
        console.error(enow(), 'Only token owner can create resell orders'); 
        return {error:'Only token owner can create resell orders'};        
    }
    //console.warn('Ini', rec.startdate)
    //console.warn('End', rec.enddate)
    if(!rec.startdate){ rec.startdate = new Date(); }
    if(!rec.enddate){ rec.enddate = new Date(); }
    // End date if auction
    let nowd = new Date();
    let nown = nowd.getTime();
    let nowx = nowd.toJSON();
    let date = new Date(rec.enddate.substr(0,10));
    let enddate = new Date(date.setDate(date.getDate() + 1)); // Date at midnight
    //console.warn('ENDDATE', enddate);
    let endn = enddate.getTime();
    let endx = enddate.toJSON();
    //console.warn('Dates', nowx, endx);
    //console.warn('End', endx)

    let orderId = await randomAddress();
    //let orderId = await new hmy.Modules.Account().address;
    //let rez = {address:orderId, ordertype: 0, startdate: nowx, enddate: endx, owner: rec.owner, seller: rec.owner, artwork: rec.artwork, tokenid: rec.tokenid, tokentype: rec.tokentype, collection: rec.collection, sellprice: rec.sellprice, amount: rec.amount, fees: market.fees, royalties: royal, beneficiary: token.creator, status: 1, original: false};
    //console.warn('Order', rez);

    let cfg, res, gas, ctr;
    try {
        cfg = await db.getSettings();
        if(!hmy){ hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY); }
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gasorder };
        abi = Market.abi;
        //console.warn('Order data:', orderId, rec.owner, tokenType, rec.collection, rec.tokenid, rec.amount, price, market.fees, royal, token.creator, enddate);
        ctr = hmy.contracts.createContract(abi, market.address);
        res = await ctr.methods.newOrder(orderId, rec.owner, tokenType, rec.collection, rec.tokenid, rec.amount, price, market.fees, royal, token.creator, endn).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not create order'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.newOrder(orderId, rec.owner, tokenType, rec.collection, rec.tokenid, rec.copies, price, market.fees, royal, token.creator, endn).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            //console.warn('Approved');
            // Save order in database
            let rey = {address:orderId, ordertype: 0, startdate: nowx, enddate: endx, owner: rec.owner, seller: rec.owner, artwork: rec.artwork, tokenid: rec.tokenid, tokentype: rec.tokentype, collection: rec.collection, sellprice: rec.sellprice, amount: rec.amount, fees: market.fees, royalties: royal, beneficiary: token.creator, status: 1, original: false};
            let rex = await db.newOrder(rey);
            //console.warn('Saved order', rex);
            return {status:'CONFIRMED', orderId:orderId};
        } else {
            console.error(enow(), 'Order error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error creating resell order', ex);
        return {error:'Error creating resell order'};
        // TODO: Revert payment?
    }
    console.error(enow(), 'Unknown error creating resell order');
    return {error:'Unknown error creating resell order'};
}

async function getTransaction(hmy, txId) {
    console.warn('Fetching tx', txId);
    let tx = null;
    //let hmy = await HMY();
    try {
        //let rec = await hmy.blockchain.getTransactionReceipt({txnHash:txId})
        let rec = await hmy.blockchain.getTransactionByHash({txnHash:txId})
        console.warn('Tx', rec.result);
        tx = rec.result;
    } catch(ex) {
        console.error(enow(), 'Error getting tx:', ex);
    }
    return tx;
}


async function changeOwner(info) {
    let address    = info.address;
    let collection = info.collection;
    let tokenId    = info.tokenid;
    let tokenType  = info.tokentype;
    let oldOwner   = info.seller;
    let newOwner   = info.ownerid;
    let total      = info.total;
    console.warn('Change owner', address, 'from', oldOwner, 'to', newOwner);
    let cfg, res, gas, ctr;
    try {
        cfg = await db.getSettings();
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        if(tokenType=='721'){ 
            abi = Token721.abi;
            ctr = hmy.contracts.createContract(abi, collection);
            res = await ctr.methods.ownerOf(tokenId).call(gas);
            //console.warn('Owner is', res);
            if(res==newOwner){
                res = db.changeOwner(address, oldOwner, newOwner);
                //console.warn('Change res', res);
            } else {
                console.error(enow(), 'Buyer not owner?', newOwner, res);
                return {error: 'Error buyer is not owner'};
            }
        } else {
            abi = Token1155.abi;
            ctr = hmy.contracts.createContract(abi, collection);
            res = await ctr.methods.balanceOf(newOwner, address).call(gas);
            if(parseInt(res.toString())==total){
                res = db.changeOwner(address, oldOwner, newOwner);
                //console.warn('Change res', res);
            } else {
                console.error(enow(), 'Buyer does not have all copies?', newOwner, total, res);
                return {error: 'Error buyer is not total owner'};
            }
        }
        if(!res || res.error){
            console.error(enow(), 'Server error', res);
            return {error:'Could not change owner'};
        }
        return {status:'SUCCESS'};
    } catch(ex) {
        console.error(enow(), 'Error changing owner', ex);
        return {error:'Error changing owner'};
    }
    console.error(enow(), 'Unknown error changing owner');
    return {error:'Unknown error changing owner'};
}

async function getOnePrice() {
    let data = { price:0, updated:0 };
    try {
        let res = await db.getConfig('oneprice');
        if(res){ data = JSON.parse(res); } 
        let last = new Date(data.updated).getTime();
        let nowd  = new Date().getTime();
        if(nowd-last > 600000){ /* 10 mins */
            //console.warn('Updating...');
            //console.warn(nowd);
            //console.warn(last);
            //console.warn(nowd-last);
            let res = await fetch('https://api.binance.com/api/v1/ticker/24hr?symbol=ONEUSDT');
            let inf = await res.json();
            data.price = parseFloat(inf.weightedAvgPrice) || 0.0;
            data.updated = nowd;
            db.setConfig('oneprice', JSON.stringify(data));  // update db
        }
    } catch(ex) {
        console.error(enow(), 'Error getting ONE price', ex.message);
    }
    //console.warn('ONE price', data);
    return data;
}

async function auctionClaim(data) {
    // get order and bid
    order = await db.getOrderByAddress(data.orderid);
    if(!order){ 
        console.error(enow(), 'Order not found'); 
        return {error:'Order not found'}; 
    }
    if(order.error){ 
        console.error(enow(), 'Error getting order'); 
        return {error:order.error}; 
    }
    
    lastbid = await db.getLastValidBid(data.orderid);
    if(!lastbid){ 
        console.error(enow(), 'Bid not found'); 
        return {error:'Bid not found'}; 
    }
    if(lastbid.error){ 
        console.error(enow(), 'Error getting bid'); 
        return {error:lastbid.error}; 
    }
    //console.warn('Order', order)
    //console.warn('Bid', lastbid)
    if(lastbid.bidder!=data.receiver){ 
        console.error(enow(), 'User is not winning bidder'); 
        return {error:'User is not winning bidder'}; 
    }

    let rec, res;
    // artwork not for sale
    rec = {address:data.artwork, saletype:2, available:0};
    res = await db.modArtwork(rec);
    // bid status claimed
    rec = {bidid:lastbid.bidid, status:1};
    res = await db.modBid(rec);
    // order status claimed, buyprice to lastbid
    rec = {orderid:order.orderid, buyer:data.receiver, buyprice:lastbid.price, status:1};
    res = await db.modOrder(rec);
    return {status:'SUCCESS'};
}

async function auctionReneged(bidid, userid) {
    // get order and bid
    lastbid = await db.getBid(bidid);
    if(!lastbid){ 
        console.error(enow(), 'Bid not found'); 
        return {error:'Bid not found'}; 
    }
    if(lastbid.error){ 
        console.error(enow(), 'Error getting bid'); 
        return {error:lastbid.error}; 
    }
    let orderId = lastbid.orderid;

    order = await db.getOrderByAddress(orderId);
    if(!order){ 
        console.error(enow(), 'Order not found'); 
        return {error:'Order not found'}; 
    }
    if(order.error){ 
        console.error(enow(), 'Error getting order'); 
        return {error:order.error}; 
    }

    //console.warn('Order', order)
    //console.warn('Bid', lastbid)
    if(userid!=order.seller){ 
        console.error(enow(), 'User is not seller'); 
        return {error:'User is not seller'}; 
    }

    // Auction.forfeit(orderId, index) then Auction.invalidOrder(orderId)
    let cfg, hmy, res, gas, ctr, idx, ok=false;
    try {
        cfg = await db.getSettings();
        hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        abi = Auctions.abi;
        ctr = hmy.contracts.createContract(abi, process.env.AUCTION);
        res = await ctr.methods.invalidOrder(orderId).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not invalidate auction'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Renegation rejected', res.transaction.txStatus);
            ctr.methods.invalidOrder(orderId).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            ok = true;
            console.warn('Auction invalidated', res.transaction.txStatus);
            // Now forfeit bid, needs index as .getLastValidIndex
            //res = await ctr.methods.forfeit(orderId, index).send(gas);
            //if(!res || !res.transaction){
            //    console.error(enow(), 'Server error', res);
            //    return {error:'Could not renege bid'};
            //}
            //if (res.transaction.txStatus == 'REJECTED') {
            //    //console.error(enow(), 'Rejected', res);
            //    console.error(enow(), 'Rejected', res.transaction.txStatus);
            //    ctr.methods.forfeit(orderId, index).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            //    return {error:'Transaction rejected'};
            //} else if (res.transaction.txStatus == 'CONFIRMED') {
            //    console.warn('Bid reneged', res.transaction.txStatus);
            //    ok = true;
            //} else {
            //    console.error(enow(), 'Auction error', res.transaction.txStatus);
            //    return {error:'Unknown status: '+res.transaction.txStatus};
            //}
        } else {
            console.error(enow(), 'Auction error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error invalidating auction', ex);
        return {error:'Error invalidating auction'};
        // TODO: Revert payment?
    }

    if(!ok){
        return {error:'Error invalidating auction'};
    }

    // Update DB: artwork, order, bid

    // artwork not for sale
    rec = {address:order.artwork, saletype:2};
    res = await db.modArtwork(rec);
    // bid status reneged
    rec = {bidid:lastbid.bidid, status:2};
    res = await db.modBid(rec);
    // order status invalid
    rec = {orderid:order.orderid, status:2};
    res = await db.modOrder(rec);
    return {status:'SUCCESS'};
}

async function auctionClose(orderId) {
    console.warn('Closing auction', orderId);
    try {
        let cfg = await db.getSettings();
        let hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        let abi = Auctions.abi;
        let adr = process.env.AUCTION;
        let ctr = hmy.contracts.createContract(abi, adr);
        let gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        let res = await ctr.methods.closeOrder(orderId).send(gas);

        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not close auction'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.closeOrder(orderId).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Transaction rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            console.warn('Closed', orderId);
            return {status:'CONFIRMED', orderId:orderId};
        } else {
            console.error(enow(), 'Auction error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error closing auction', ex);
        return {error:'Error closing auction'+ex.message};
    }
    return {error:'Unknown error closing auction'};
}

async function cancelOrder(orderId) {
    console.warn('Cancel order:', orderId);
    let cfg, hmy, gas, abi, adr, ctr, res;
    try {
        cfg = await db.getSettings();
        hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        abi = Market.abi;
        adr = process.env.MARKET;
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gasorder };
        ctr = hmy.contracts.createContract(abi, adr);
        res = await ctr.methods.cancelOrder(orderId).send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not cancel order'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.cancelOrder(orderId).call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Cancel rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            console.warn('SUCCESS', orderId);
            return {status:'CONFIRMED', orderId:orderId};
        } else {
            console.error(enow(), 'Order error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error cancelling order', ex);
        return {error:'Error cancelling order'};
    }
    console.error(enow(), 'Unknown error cancelling order');
    return {error:'Unknown error cancelling order'};
}

async function cancelAuction(orderId) {
    //
}

async function sculptorCarve() {
    // CRON: CARVE EVERY 24 HRS
    console.warn(new Date(), '- Sculptor carving...');
    let cfg, hmy, gas, abi, adr, ctr, res;
    try {
        cfg = await db.getSettings();
        hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        abi = Sculptor.abi;
        adr = process.env.SCULPTOR;
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        ctr = hmy.contracts.createContract(abi, adr);
        res = await ctr.methods.carve().send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not carve stone'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.carve().call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Carving rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            console.warn('- Carved successfully');
            return {status:'CONFIRMED'};
        } else {
            console.error(enow(), 'Carving error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error carving stone', ex);
        return {error:'Error carving stone'};
    }
    console.error(enow(), 'Unknown error carving stone');
    return {error:'Unknown error carving stone'};
}

async function painterBrush() {
    // CRON: PAINT EVERY 7 DAYS
    console.warn(new Date(), '- Painter brushing...');
    let cfg, hmy, gas, abi, adr, ctr, res;
    try {
        cfg = await db.getSettings();
        hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        abi = Painter.abi;
        adr = process.env.PAINTER;
        gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
        ctr = hmy.contracts.createContract(abi, adr);
        res = await ctr.methods.brush().send(gas);
        if(!res || !res.transaction){
            console.error(enow(), 'Server error', res);
            return {error:'Could not paint canvas'};
        }
        if (res.transaction.txStatus == 'REJECTED') {
            //console.error(enow(), 'Rejected', res);
            console.error(enow(), 'Rejected', res.transaction.txStatus);
            ctr.methods.brush().call().then().catch(revertReason => console.error(enow(), {revertReason}));
            return {error:'Painting rejected'};
        } else if (res.transaction.txStatus == 'CONFIRMED') {
            console.warn('- Painted successfully');
            return {status:'CONFIRMED'};
        } else {
            console.error(enow(), 'Painting error', res.transaction.txStatus);
            return {error:'Unknown status: '+res.transaction.txStatus};
        }
    } catch(ex) {
        console.error(enow(), 'Error painting canvas', ex);
        return {error:'Error painting canvas'};
    }
    console.error(enow(), 'Unknown error painting canvas');
    return {error:'Unknown error painting canvas'};
}

async function fillOrder(offerId) {
    let offer = await db.getMarketOffer(offerId);
    if(!offer || offer.error){
        console.error(enow(), 'Error: market offer not found');
        return {error: 'Market offer not found'};
    }
    console.warn('-- Fill order', offer.orderid, offer.ordertype, offer.amount, offer.price);
    
    // TODO: Verify txid
    //let hmy = await HMY(process.env.OPKEY);
    //let tx  = await getTransaction(hmy, offer.txid)
    //if(!tx){
    //    console.error(enow(), 'Tx not found');
    //    return {error: 'Payment not found'};
    //}

    // get open offers, if buy: asks - if sell bids
    let list = [];
    if(offer.ordertype==0){
        list = await db.getBidOffers(offer.price);
    } else {
        list = await db.getAskOffers(offer.price);
    }
    console.warn('Offers', list);

    // loop offers from highest and check if price < offer
    if(list.length<1){
        // No matching offers, add to orderbook
        console.warn('No matching offers, add to orderbook as open order');
        return {status:0, text:'open'};
    }

    let rest = parseFloat(offer.amount);
    let paid = 0;
    let fill = 0;
    let send = 0;
    //let pays = [];

    // SELL
    if(offer.ordertype==0){
        console.warn('- SELL');
        for (var i = 0; i < list.length; i++) {
            item = list[i];
            amnt = parseFloat(item.amount);
            prce = parseFloat(item.price);
            if(amnt<=rest){
                paid  = amnt;
                total = amnt * prce;
                fill += amnt;
                send += total;
                rest -= amnt;
                console.warn('Filling Bid', item.orderid, paid, rest);
                ok = await db.filledOffer(item.orderid);
                console.warn('Filling result', ok);
                // send VINCI to buyer
                //pays.push([item.userid, paid, 0]); // 0.base 1.quote
                ok = await db.newTrade({orderid:offerId, ordertype:1, market:offer.market, userid:item.userid, amount:paid, price:item.price, total:total, status:0, maker:false});
                console.warn('Trade result', ok);
            } else {
                paid  = rest;
                fill += rest;
                total = rest * prce;
                send += total;
                diff  = amnt-paid;
                console.warn('Partial bid', item.orderid, paid, diff);
                ok = await db.partialOffer(item, paid, diff);
                console.warn('Partial result', ok);
                // send VINCI to buyer
                //pays.push([item.userid, paid, 0]); // 0.base 1.quote
                ok = await db.newTrade({orderid:offerId, ordertype:1, market:offer.market, userid:item.userid, amount:paid, price:item.price, total:total, status:0, maker:false});
                console.warn('Trade result', ok);
                rest = 0;
            }
            if(rest==0){ break; }
        }

        let oamt = parseFloat(offer.amount);
        console.warn('Filled?', fill, oamt);
        if(fill==oamt){
            console.warn('Filling offer', offer.orderid, offer.amount);
            ok = await db.filledOffer(offerId);
            console.warn('Filling result', ok);
            // Send ONE filled
            //pays.push([offer.userid, send, 1]); // 0.base 1.quote
            ok = await db.newTrade({orderid:offerId, ordertype:0, market:offer.market, userid:offer.userid, amount:fill, price:offer.price, total:fill*offer.price, status:0, maker:true});
            console.warn('Trade result', ok);
            info = {status:2, text:'filled'};
        } else {
            console.warn('Partial offer', offer.orderid, fill, rest);
            ok = await db.partialOffer(offer, fill, rest);
            console.warn('Partial result', ok);
            // Send ONE filled
            //pays.push([offer.userid, send, 1]); // 0.base 1.quote
            ok = await db.newTrade({orderid:offerId, ordertype:0, market:offer.market, userid:offer.userid, amount:fill, price:offer.price, total:fill*offer.price, status:0, maker:true});
            console.warn('Trade result', ok);
            info = {status:1, text:'partial'};
        }
    } else {
    // BUY
        console.warn('- BUY');
        for (var i = 0; i < list.length; i++) {
            item = list[i];
            amnt = parseFloat(item.amount);
            prce = parseFloat(item.price);
            if(item.amount<=rest){
                paid  = item.amount;
                total = item.amount * item.price;
                fill += item.amount;
                rest -= item.amount;
                console.warn('Filling ask', item.orderid, paid, rest);
                ok = await db.filledOffer(item.orderid);
                console.warn('Filling result', ok);
                // send ONE to seller
                //pays.push([item.userid, paid, 1]); // 0.base 1.quote
                ok = await db.newTrade({orderid:offerId, ordertype:0, market:offer.market, userid:item.userid, amount:paid, price:item.price, total:total, status:0, maker:false});
                console.warn('Trade result', ok);
            } else {
                paid  = rest;
                fill += rest;
                total = rest * item.price;
                diff  = amnt-paid;
                console.warn('Partial ask', item.orderid, paid, diff);
                ok = await db.partialOffer(item, paid, diff);
                console.warn('Partial result', ok);
                // send ONE to seller
                //pays.push([item.userid, paid, 1]); // 0.base 1.quote
                ok = await db.newTrade({orderid:offerId, ordertype:0, market:offer.market, userid:item.userid, amount:paid, price:item.price, total:total, status:0, maker:false});
                console.warn('Trade result', ok);
                rest = 0;
            }
            if(rest==0){ break; }
        }

        let oamt = parseFloat(offer.amount);
        console.warn('Filled?', fill, oamt);
        if(fill==oamt){
            console.warn('Filling offer', offer.orderid, offer.amount);
            ok = await db.filledOffer(offerId);
            console.warn('Filling result', ok);
            // Send VINCI filled
            //pays.push([offer.userid, fill, 0]); // 0.base 1.quote
            ok = await db.newTrade({orderid:offerId, ordertype:1, market:offer.market, userid:offer.userid, amount:fill, price:offer.price, total:fill*offer.price, status:0, maker:true});
            console.warn('Trade result', ok);
            info = {status:2, text:'filled'};
        } else {
            console.warn('Partial offer', offer.orderid, offer.amount, rest);
            ok = await db.partialOffer(offer, fill, rest);
            console.warn('Partial result', ok);
            // Send VINCI filled
            //pays.push([offer.userid, fill, 0]); // 0.base 1.quote
            ok = await db.newTrade({orderid:offerId, ordertype:1, market:offer.market, userid:offer.userid, amount:fill, price:offer.price, total:fill*offer.price, status:0, maker:true});
            console.warn('Trade result', ok);
            info = {status:1, text:'partial'};
        }
    }

    paybot();  // Run paybot to send moneys
    return info;
}


async function cancelOffer(offerId, userId) {
    console.warn('-- Cancel offer', offerId);
    let order = await db.getMarketOffer(offerId);
    if(!order || order.error){
        return {error:'Offer not found'};
    }
    if(order.userid != userId){
        return {error:'Unauthorized'};
    }
    let data = {error:'unknown'};
    let ok = await db.cancelMarketOffer(offerId);
    if(ok && ok.error)   { data = {error:ok.error}; }
    else if(ok == false) { data = {status:'REJECTED',  orderid:offerId}; }
    else if(ok == true)  { 
        let rcv = userId;
        let cfg = await db.getSettings();
        let hmy = await HMY(cfg.neturl, cfg.chainid, process.env.EXKEY);
        let amt, res;
        if(order.ordertype==0){
            amt = order.amount;
            res = await payToken(hmy, rcv, amt, VINCI);
        } else {
            amt = order.total;
            res = await payment(hmy, rcv, amt);
        }
        if(res && res.error){
            data = {error:res.error};
        } else {
            data = {status:'CONFIRMED', result:res.result};
        }
    }
    return data;
}

async function paybot() {
    console.warn('Paybot running...');
    let list = await db.getPendingTrades();
    if(list.length<1){ 
        console.warn('Nothing to pay');
        return;
    }

    try {
        let cfg = await db.getSettings();
        let hmy = await HMY(cfg.neturl, cfg.chainid, process.env.EXKEY);
        for (var i = 0; i < list.length; i++) {
            let tradeId  = list[i].tradeid;
            let receiver = list[i].userid;
            let amount   = list[i].amount;
            let total    = list[i].total;
            let paytype  = list[i].ordertype;
            let res, txid, ok;
            if(paytype==0){
                console.warn('Payment', receiver, total);
                res = await payment(hmy, receiver, total);  // SEND ONE
                console.warn('Res', res);
            } else {
                console.warn('Paytoken', receiver, amount);
                res = await payToken(hmy, receiver, amount, VINCI);  // SEND VINCI
                console.warn('Res', res);
            }
            if(res.error){ 
                /* Leave trade open and retry later */ 
                console.error(enow(), 'Pay error', res);
                ok = await db.failTrade(tradeId);
                console.error(enow(), 'Fail', ok);
            } else {
                txid = res.result;
                ok = await db.payTrade(tradeId, txid);
                console.error(enow(), 'Paid', ok);
            }
        }
    } catch(ex) {
        console.error(enow(), 'Paybot error', ex);
    }
}

async function getPostCount(userid) {
    let user     = await db.getUser(userid);
    let canpost  = 0; // can post
    let posts    = 0; // has posted
    let maxposts = 1; // max post
    let inactive = false;
    let reason   = 'Ok';
    let error    = null;
    if(user && !user.error){
        if(user.verified){ maxposts = 5; }
        if(user.golden){ maxposts = 10; }
        let res = await db.getArtworkCount(userid);
        if(res && res.count){ 
            posts = parseInt(res.count);
            canpost = maxposts - posts;
        } else {
            reason = 'Error getting daily cap';
            error  = 'Error getting daily cap';
        }
        if(user.inactive) {
            inactive = true;
            reason   = 'User inactive, can not create tokens'; }
        else if(posts>=maxposts){
            inactive = true;
            reason   = 'Posts per day are limited to '+maxposts;
        }
    } else {
        maxposts = 0;
        inactive = true;
        reason   = 'Profile not found, please create one or connect your wallet';
        error    = 'Profile not found, please create one or connect your wallet';
    }
    //console.warn({posts, maxposts, inactive, reason});
    return {userid, posts, canpost, maxposts, inactive, reason, error};
}

async function getVinciSupply(hmy){
    let cfg = await db.getSettings();
    if(!hmy){ hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY); }
    let gas = { gasPrice: cfg.gasprice, gasLimit: cfg.gaslimit };
    let ctr = await hmy.contracts.createContract(HRC20.abi, VINCI);
    let res = await ctr.methods.totalSupply().call(gas);
    console.warn('Current supply', res.toString());
    let supply = parseInt(res.toString()/10**18);
    return supply;
}

async function getVinciPrice() {
    console.warn('Getting Vinci price...');
    let price = 0.0;
    try {
        let qry = {query:'{pair(id:"0xca3680580e01bd12cc86818fff62eda2d255677c"){token1Price}}'};
        let url = 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap-v2';
        let hdr = {
            method: 'POST', 
            headers: {'content-type': 'application/json'}, 
            body: JSON.stringify(qry)
        };
        let res = await fetch(url, hdr);
        let inf = await res.json();
        //console.warn('Viper price:', inf);
        if(inf && inf.data){
            price = parseFloat(inf?.data?.pair?.token1Price) || 0.0;
            //showLastPrice();
        } else {
            console.error(enow(), 'Error in Vinci price:', inf);
            price = 0.0;
        }
        console.warn('Viper price:', price);
    } catch(ex) {
        console.error(enow(), 'Error in Vinci price:', ex);
        price = 0.0;
    }
    return price;
}


async function getVinciStats(){
    let stats = {};
    try {
        let supply = 90000000
        let pools  =  9000000;
        let oneusd = await getOnePrice();
        let vinone = await getVinciPrice();
        let minted = await getVinciSupply();
        let vprice = vinone * oneusd.price;
        let circul = minted - ((minted - pools) * 0.685);
        let locked = minted - circul;
        let mktcap = supply * vprice;
        let curmkt = minted * vprice;
        let nowd   = (new Date()).toJSON();
        stats = {
            totalsupply: supply,
            totalminted: minted,
            totallocked: locked,
            circulating: circul,
            totalmktusd: mktcap,
            currmktusd:  curmkt,
            lastprice:   vprice,
            lastupdate:  nowd
        };
    } catch(ex){
        console.error(enow(), 'Error getting VINCI stats', ex);
        stats = {error:'Error getting VINCI stats'};
    }
    return stats;
}

async function getVinciSwaps(limit=100, amount=1000) {
    console.warn('Vinci swaps out...');
    let qry = {query:'{swaps(skip:0,first:'+limit+',where:{pair:"0xca3680580e01bd12cc86818fff62eda2d255677c",amountUSD_gt:'+amount+',amount0In_gt:0},orderBy:timestamp,orderDirection:desc){timestamp,from,amount0In,amount1Out,amountUSD}}'};
    let url = 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap-v2';
    let hdr = {
        method: 'POST', 
        headers: {'content-type': 'application/json'}, 
        body: JSON.stringify(qry)
    };
    let res = await fetch(url, hdr);
    let inf = await res.json();
    //console.log('Vinci swaps:', inf);
    if(inf && inf.data){
        return inf;
    }
    return null;
}

async function getVinciSwapsIn(limit=100, amount=1000) {
    console.warn('Vinci swaps in...');
    let qry = {query:'{swaps(skip:0,first:'+limit+',where:{pair:"0xca3680580e01bd12cc86818fff62eda2d255677c",amountUSD_gt:'+amount+',amount0Out_gt:0},orderBy:timestamp,orderDirection:desc){timestamp,from,amount0Out,amount1In,amountUSD}}'};
    let url = 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap-v2';
    let hdr = {
        method: 'POST', 
        headers: {'content-type': 'application/json'}, 
        body: JSON.stringify(qry)
    };
    let res = await fetch(url, hdr);
    let inf = await res.json();
    //console.log('Vinci swaps:', inf);
    if(inf && inf.data){
        return inf;
    }
    return null;
}

async function unlockVincis(address, txId) {
    console.warn('API unlock', address, txId);
    let unlock = await db.getVincisToUnlock(address);
    if(unlock<=0) { 
        console.warn('Nothing to unlock');
        return {status:false, error:'Nothing to unlock'}; 
    }
    console.warn('Unlock', unlock, 'VINCIs');
    ////let unloxx = unlock * ONEWEI;
    //console.warn('Unloxx', unloxx, 'VINCIs');
    let ok1 = await db.setVincisToUnlocking(address);
    console.warn('ok1', ok1);
    try {
        console.warn('Unlocking...');
        let cfg = await db.getSettings();
        let hmy = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        let tx  = await getTransaction(hmy, txId);
        //console.warn('Tx', tx);
        if(!tx){ 
            console.error(enow(), 'Tx not found');
            return {status:false, error: 'Tx not found'};
        }
        // Get tx info
        let sender = addressToHex(hmy, tx.from);
        let token  = addressToHex(hmy, tx.to);
        let method = tx.input.substr(2,8);  // Token transfer method a9059cbb
        let destin = '0x'+tx.input.substr(34,40);
        let amounx = '0x'+tx.input.substr(74,64);    // wei in hex
        let amount = hmy.utils.hexToNumber(amounx);  // amt in wei 
        let unloxx = hmy.utils.toWei(unlock, hmy.utils.Units.one); // in wei
        console.warn('Amounx', amounx);
        console.warn('Amount', amount);
        console.warn('Unloxx', unloxx.toString());
        let burner = '0x7bdef7bdef7bdef7bdef7bdef7bdef7bdef6e7ad';  // burner address
        let xfer   = 'a9059cbb';
        console.warn('-Sendr', sender);
        console.warn('-Token', token);
        console.warn('-Methd', method);
        console.warn('-Recvr', destin);
        console.warn('-Amntx', amount);
        if(address!=sender){ return {status:false, error:'Wrong sender'}; } // verify sender == wallet user
        if(token!=VNLTOKEN){ return {status:false, error:'Wrong token'};  } // verify token == VNL
        if(method!=xfer)   { return {status:false, error:'Wrong method'}; } // verify method == a9059cbb
        if(destin!=burner) { return {status:false, error:'Wrong destin'}; } // verify receiver == 0000000000000000000000007bdef7bdef7bdef7bdef7bdef7bdef7bdef6e7ad
        if(amount<unloxx)  { return {status:false, error:'Wrong amount'}; } // Verify tx amount no less than unlocked
        
        // Pay VINCIS
        console.warn('Paytoken', sender, unlock, VINCI);
        res = await payToken(hmy, sender, unlock, VINCI);  // SEND VINCI
        console.warn('Res', res);
        if(res.error){ return {status:false, error:'Error in payment'}; }
        let ok2 = await db.setVincisToUnlocked(address);
        console.warn('ok2', ok2);
        return {status:true, amount:unlock, txid:res.result};
    } catch(ex){
        console.error('Error unlocking', ex);
        return {status:false, error:'Server error '+ex.message};
    }
}

async function getLastOwner(col, tkn){
    //console.warn('Token Id', tkn);
    let resp, info, data, logs;
    let owner = '0xNotfound';
    try { 
        let cfg  = await db.getSettings();
        let hmy  = await HMY(cfg.neturl, cfg.chainid, process.env.OPKEY);
        //let hmy  = await HMY(process.env.OPKEY);
        let blck = await hmy.blockchain.getBlockNumber();
        let topc = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'; // TransferSingle(sender,from,to,id,value)
        let bini = '0x'+(parseInt(blck.result,16) - 100000).toString(16);
        //console.warn('Last', blck.result);
        //console.warn('Bini', bini);  // 0x10f0000
        let bend = 'latest';
        let opts = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "id":1,
                "jsonrpc":"2.0",
                "method":"hmy_getLogs",
                "params":[
                    {
                        "fromBlock": bini,
                        "toBlock": bend,
                        "address":[col],
                        "topics":[topc]
                    }
                ]
            })
        };
        //let url = process.env.NETURL;
        let url = cfg.neturl;
        resp = await fetch(url, opts);
        info = await resp.json();
        //console.warn('Info', info);
        logs = [];
        if(info.result.length>0) {
            for(var i=0; i<info.result.length; i++) {
                item = info.result[i];
                data = {
                    //topic : item.topics[0],
                    operat: '0x'+item.topics[1].substr(26, 40),
                    sender: '0x'+item.topics[2].substr(26, 40),
                    receiv: '0x'+item.topics[3].substr(26, 40),
                    toknid: '0x'+item.data.substr(26, 40),
                    amount: parseInt('0x'+item.data.substr(66), 16)
                    //amount: '0x'+item.data.substr(66),
                };
                logs.push(data);
                //console.warn(data.operat, data.sender, data.receiv, data.toknid, data.amount);
                if(data.toknid==tkn){
                    owner = data.receiv;
                    console.warn('Last owner is', owner);
                    //break;
                }
            }
        }
        //console.warn('Logs', logs);
    } catch(ex) {
        console.error(enow(), 'Error fetching logs:', ex);
    }
    //console.warn('Last Own', owner);
    return owner;
}

async function getTicker() {
    console.warn('Getting CMC ticker...');
    let url, opt, res, tkr = {};
    try {
        url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
        //url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD%2CBTC';
        opt = {
            method: 'GET', 
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'X-CMC_PRO_API_KEY': '91b71c41-5bd6-42eb-98ba-497957d9a506'
            }
        };
        res = await fetch(url, opt);
        tkr = await res.json();
        //console.warn('Ticker:', tkr);
    } catch(ex) {
        console.error(enow(), 'Error in CMC ticker:', ex);
        tkr = {error:ex.message};
    }
    return tkr;
}


module.exports = {
    buyArtwork,
    newMarketOrder,
    newAuctionOrder,
    newResellOrder,
    tokenBalance,
    ownerBalance,
    getOnePrice,
    getVinciPrice,
    getVinciSupply,
    getVinciStats,
    getVinciSwaps,
    getVinciSwapsIn,
    unlockVincis,
    auctionClose,
    auctionClaim,
    auctionReneged,
    cancelOrder,
    cancelAuction,
    cancelOffer,
    sculptorCarve,
    painterBrush,
    fillOrder,
    paybot,
    payment,
    payToken,
    getPostCount,
    getLastOwner,
    getTicker
}

// END