// DAVINCI

function setImportStatus(txt, warn=false){
	console.log(txt);
	if(warn){ txt = '<warn>'+txt+'</warn>'; }
	$('import-status').innerHTML = txt;
}

function setImportAction(txt='IMPORT TOKEN', wait=false){
	$('import-save').innerHTML = txt;
	$('import-save').disabled = wait;
}

function onUrlChange(obj){
	console.log('Obj', obj);
	console.log('Image Url', obj.value);
	$('import-image').src = obj.value;
}

async function importToken(collection, tokenId, imageUrl) {
	if(!collection){ setImportStatus('Contract is required', true); setImportAction(); return; }
	if(!tokenId){    setImportStatus('Token Id is required', true); setImportAction(); return; }
	if(!imageUrl){   setImportStatus('Image url is required', true); setImportAction(); return; }
	setImportStatus('Creating token contract...');
	setImportAction('WAIT', true);
	let user = Davinci.addrexx;
	let tid  = tokenId;
	if(!tokenId.startsWith('0x')){
		tid = '0x'+(parseInt(tokenId).toString(16));
	}
	//collection= '0xa7b0afad7d92e91b113563026ea5fa92766d9d61';
	//tokenId 	= '1';
	//imageUrl	= 'https://ipfs.io/ipfs/Qmcgd2W6zkqUhArbVcpQqZrLUc7L7HdiGEAqupxfvqyE65';
	//imageUrl  = 'https://lma-art-gallery.com/arts/1.jpg'
	console.log('User', user);
	console.log('Collection', collection);
	console.log('Token Id', tokenId);
	console.log('Image url', imageUrl);
	let NFTType = '721';
	let copies  = 1;
	let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.addrexx };
	console.log('Getting owner of token', tokenId, tid);
	try {
		setImportStatus('Importing token 721...');
		abi = DavinciToken.abi;
		ctr = await Davinci.contract(abi, collection);
		ctr.wallet = Davinci.wallet;
	    res = await ctr.methods.ownerOf(tid).call(gas);
	    let owner = res.toLowerCase();
		console.log('721 Owner is', owner);
		if(user != owner) { setImportStatus("You don't have any copies of this token", true); setImportAction(); return; }
		else { console.log('User and owner match!'); }
		$('import-owner').innerHTML  = user;
		$('import-copies').innerHTML = 1;
		await verifyToken('721', collection, tokenId, imageUrl, user, copies);
		return;
	} catch(ex) {
		console.log('Error loading 721', ex);
		console.log('Not 721');
		setImportStatus('Error importing token', true);
	}
	NFTType = '1155';
	try {
		setImportStatus('Importing token 1155...');
		abi = DavinciMultipleToken.abi;
		ctr = await Davinci.contract(abi, collection);
		//ctr = Harmony.contracts.createContract(abi, collection);
		ctr.wallet = Davinci.wallet;
		let tid = tokenId;
		if(!tokenId.startsWith('0x')){
			tid = '0x'+(parseInt(tokenId).toString(16));
		}
	    res = await ctr.methods.balanceOf(user, tid).call(gas);
	    bal = parseInt(res.toString());
		console.log('1155 Balance is', bal);
		if(bal < 1) { setImportStatus("You don't have any copies of this token", true); setImportAction(); return; }
		$('import-owner').innerHTML  = user;
		$('import-copies').innerHTML = bal;
		await verifyToken('1155', collection, tokenId, imageUrl, user, copies);
	} catch(ex) {
		console.log('Error loading 1155', ex);
		console.log('Not 1155');
		setImportStatus('Error importing token', true);
		setImportAction();
	}
}


async function verifyToken(type, collection, tokenId, imageUrl, owner, copies) {
	setImportStatus('Importing token to DaVinci app...');
	console.log('Verifying token...', type, collection, tokenId, imageUrl, owner, copies);
	// check if token exists
	let address = null;
	let tokenExists = await checkTokenExists(collection, tokenId);
	let ownerExists = await checkOwnerExists(collection, tokenId, owner);
	if(tokenExists && ownerExists){
		setImportStatus('Token already exists in DaVinci', true);
		setImportAction();
		return;
	}
	if(!tokenExists){ 
		console.log('Token does not exist');
		address = await createToken(type, collection, tokenId, imageUrl, owner, copies); // owner may not be importer
	} else {
		console.log('Token exists', tokenExists);
		address = tokenExists;
	}
	if(!address){ 
		console.log('Token error');
		setImportStatus('Token error');
		setImportAction();
		return false;
	}
	await createOwnership(address, collection, tokenId, owner, copies);
	setImportStatus('Token imported, check it in My Collectibles');
	$('import-save').innerHTML = 'SUCCESS!';
	setImportAction();
}

async function checkTokenExists(collection, tokenId) {
	console.log('Check token...');
	let url = `/api/checkartwork/${collection}/${tokenId}`;
	console.log('Url', url);
	let res = await fetch(url);
	let inf = await res.json();
	console.log('Checked', inf);
    if(!inf || inf.error){ 
		console.error('Error fetching token from database', inf);
		setImportStatus('Error fetching token from database', true);
		setImportAction();
		return false;
	}
	return inf.address;
}	

async function checkOwnerExists(collection, tokenId, owner) {
	console.log('Check owner...');
	let url = `/api/checkowner/${collection}/${tokenId}/${owner}`;
	console.log('Url', url);
	let res = await fetch(url);
	let inf = await res.json();
	console.log('Checked', inf);
    if(!inf || inf.error){ 
		console.error('Error fetching owner from database', inf);
		setImportStatus('Error fetching owner from database', true);
		setImportAction();
		return;
	}
	return (inf.status=='OK');
}	

async function createToken(type, collection, tokenId, imageUrl, owner, copies) {
	console.log('Creating token...');
	// TODO: Validate all data
	let input = {
		creator    : owner,
		owner      : owner,
		media      : 'image',
		symbol     : 'VINCI',
		name       : 'Token '+type,
		desc       : 'Imported token',
		tags       : '',
		type       : type,
		collection : collection,
		onsale     : false,
		saletype   : 0,
		price      : 0,
		reserve    : 0,
		unlock     : false,
		royalties  : 0,
		copies     : copies,
		available  : copies,
		cover      : imageUrl,
		file       : imageUrl
	}
	console.log('Input', input);
	if(!input.file){ 
		setImportStatus('No image url entered', true); 
		setImportAction(true); 
		return false;
	}

	// First save file to ipfs, get hash
	setImportStatus('Saving image, please wait...');
	let address = randomAddress();
	console.log('Token address', address);
	let hash = await fetchImage(imageUrl, address);
	if(!hash){ setImportStatus('Error saving file to IPFS', true); setImportAction(true); return false; }
	console.log('IPFS Hash', hash);
	setImportStatus('Image saved!');

	// Then send data to server
	setImportStatus('Saving token in database...');
	var data = new FormData();
	data.append('address',    address);
	data.append('creator',    input.creator);
	data.append('owner',      input.owner);
	data.append('type',       input.type);
	data.append('collection', input.collection);
	data.append('tokenid',    tokenId);
	data.append('media',      input.media);
	data.append('name',       input.name);
	data.append('symbol',     input.symbol);
	data.append('description',input.desc);
	data.append('onsale',     input.onsale);
	data.append('saletype',   input.saletype);
	data.append('saleprice',  input.price);
	data.append('reserve',    input.reserve);
	data.append('unlock',     input.unlock);
	data.append('royalties',  input.royalties);
	data.append('copies',     input.copies);
	data.append('available',  input.available);
	data.append('resource',   config.GATEWAY+hash);
	data.append('cover',      hash); // only if image else upload cover
	data.append('thumbnail',  hash);

	let res = await fetch('/token/new', {method: 'POST', body: data});
	let rex = await res.json();
	console.log('Response', rex);
	if(rex.error) { setImportStatus(rex.error, true); setImportAction(true); return false; }
	return address;
}

async function createOwnership(address, collection, tokenId, owner, copies) {
	console.log('Creating ownership...');
	try {
		var data = new FormData();
		data.append('address',    address);
		data.append('collection', collection);
		data.append('tokenid',    tokenId);
		data.append('ownerid',    owner);
		data.append('copies',     copies);
		data.append('available',  copies);
		data.append('onsale',     false);
		data.append('saletype',   0);
		data.append('saleprice',  0);
		data.append('updateqty',  false);
		res = await fetch('/api/saveowner', {method: 'POST', body: data});
		jsn = await res.json();
		console.log('Response', jsn);
		if(res.error) { 
			console.log('Ownership error: '+res.error); 
			setViewStatus('Error creating ownership', true); 
			setViewAction(); 
			return false; 
		}
	} catch(ex) {
		console.log('Error saving ownership', ex);
	}
}	

async function fetchImage(file, address) {
	if(!file){ return; }
	console.log('Saving image', file);
	var data = new FormData();
	data.append('file', file);
	data.append('address', address);
	let res = await fetch('/token/fetch', {method: "POST", body: data});
	let rex = await res.json();
	if(rex.error) { console.log(rex.error); return null; }
	if(!rex.hash) { console.log('Error saving file to IPFS'); return null; }
	return rex.hash;
}



// END