// CREATE

let session = {
	wallet    : null,    // user wallet
	address   : null,    // token address
	type      : '1155',	 // 721 or 1155
	media     : 'model', // text image audio music video movie book domain
	category  : 0, 		 // 0.digital 1.painting 2.photos 3.kids 8.memes 9.adult
	collection: {
		type   : '1155',
		owner  : config.Operator,
		address: config.Collections.image
	}
}

function myTime(extramins=0) {
	let date = new Date();
	let minutes = date.getTimezoneOffset() - extramins;
	console.log(date, date.getTimezoneOffset());
    return new Date(date.getTime() - minutes*60000);
}

function onSelectMedia(m) {
	console.log('Media type', m);
	if(m=='domain'){ return; }
	session.media = m;
	let bar = $('media-bar');
	let btn = bar.getElementsByTagName('button');
	for (var i = 0; i < btn.length; i++) {
		btn[i].classList.remove('selected');
	}
	if(m=='image'){ 
		$('cover').classList.add('hidden'); 
		$('extra-files').classList.add('hidden'); 
	} else { 
		$('cover').classList.remove('hidden'); 
		$('file-preview').classList.add('hidden'); 
		if(m=='model'){ 
			$('extra-files').classList.remove('hidden'); 
		}
	}
	switch(m){
		case 'image' : btn[0].classList.add('selected'); $('file-type').innerHTML = 'JPG, PNG, GIF'; break;
		case 'model' : btn[1].classList.add('selected'); $('file-type').innerHTML = 'GLB, GLTF, OBJ'; break;
		//case 'audio' : btn[1].classList.add('selected'); $('file-type').innerHTML = 'MP3'; break;
		case 'music' : btn[2].classList.add('selected'); $('file-type').innerHTML = 'MP3'; break;
		case 'video' : btn[3].classList.add('selected'); $('file-type').innerHTML = 'MP4'; break;
		//case 'movie' : btn[4].classList.add('selected'); $('file-type').innerHTML = 'MP4'; break;
		case 'book'  : btn[4].classList.add('selected'); $('file-type').innerHTML = 'PDF'; break;
		case 'domain': btn[5].classList.add('selected'); $('file-type').innerHTML = 'TXT'; break;
	}
	setPublicCollection(m);
}

function onSelectCategory(m) {
	console.log('Category', m);
	session.category = m;
	let bar = $('category-bar');
	let btn = bar.getElementsByTagName('button');
	let cat = {0:0, 1:1, 2:2, 3:3, 8:4, 9:5}; // cats/btns
	for (var i = 0; i < btn.length; i++) {
		btn[i].classList.remove('selected');
		if(i==cat[m]) { btn[i].classList.add('selected'); }
	}
}

function setPublicCollection(type) {
	session.collection = {
		type   : '1155',
		owner  : config.Operator,
		address: config.Collections[type]
	}
	$('public-collection').dataset.type    = session.collection.type;
	$('public-collection').dataset.owner   = session.collection.owner;
	$('public-collection').dataset.address = session.collection.address;
	console.log('Collection', session.collection);
}

function onTokenType(n) {
	session.type = n;
	$('token-type-721').classList.remove('selected');
	$('token-type-1155').classList.remove('selected');
	switch(n){
		case '721':  $('token-type-721').classList.add('selected'); break;
		case '1155': $('token-type-1155').classList.add('selected'); break;
	}
}

function onSaleOption(opt) {
	switch(opt) { 
		case 0: $('sale-price').innerHTML = 'Sale Price'; 
				$('auction-cnt').style.display = 'none';
				$('sale-warn').innerHTML = 'Collectible is available for sale';
				break;
		case 1: $('sale-price').innerHTML = 'Starting Price';
				$('auction-cnt').style.display = 'block';
				$('token-copies').value  = 1; // If auction only one token is allowed
				$('sale-warn').innerHTML = 'Start bidding price, only one token per auction';
				break;
		case 2: $('sale-price').innerHTML = 'Sale Price'; 
				$('auction-cnt').style.display = 'none';
				$('sale-warn').innerHTML = 'Collectible is not available for sale';
				break;
	}
}

function onPreviewFile(input) {
	console.log('Media type', session.media);
	if(session.media!='image') { 
		// todo: show icon placeholder
		$('file-img').src = '/media/icon-'+session.media+'.png';
        $('file-preview').classList.remove('hidden');
		return; 
	}
    //var file = document.getElementById('file').files[0];
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        //var image = document.createElement("img");
        //image.src = e.target.result;
        $('file-img').src = e.target.result;
        $('file-preview').classList.remove('hidden');
        //document.body.appendChild(image);
    }
    reader.readAsDataURL(file);
 }

function onPreviewFile2(input) {
	console.log('Media type', session.media);
	if(session.media!='image') { 
		// todo: show icon placeholder
		$('file-img2').src = '/media/icon-video.png';
        $('file-preview2').classList.remove('hidden');
		return; 
	}
    //var file = document.getElementById('file').files[0];
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        $('file-img2').src = e.target.result;
        $('file-preview2').classList.remove('hidden');
        //document.body.appendChild(image);
    }
    reader.readAsDataURL(file);
 }

function onPreviewFile3(input) {
	console.log('Media type', session.media);
	if(session.media!='image') { 
		$('file-img3').src = '/media/icon-book.png';
        $('file-preview3').classList.remove('hidden');
		return; 
	}
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        $('file-img3').src = e.target.result;
        $('file-preview3').classList.remove('hidden');
        //document.body.appendChild(image);
    }
    reader.readAsDataURL(file);
 }

function onPreviewFile4(input) {
	console.log('Media type', session.media);
	if(session.media!='image') { 
		$('file-img4').src = '/media/icon-image.png';
        $('file-preview4').classList.remove('hidden');
		return; 
	}
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        $('file-img4').src = e.target.result;
        $('file-preview4').classList.remove('hidden');
        //document.body.appendChild(image);
    }
    reader.readAsDataURL(file);
 }

function onPreviewCover(input) {
	if(session.media=='image') { return; }
    //var file = document.getElementById('file').files[0];
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        //var image = document.createElement("img");
        //image.src = e.target.result;
        $('cover-img').src = e.target.result;
        $('cover-preview').classList.remove('hidden');
        //document.body.appendChild(image);
    }
    reader.readAsDataURL(file);
 }

function onNewCollection(obj) {
	window.event.stopPropagation();
	console.log('New Collection');
	//session.collection = {
	//	type: '1155',
	//	address: '0x0',
	//	owner: Davinci.address
	//};
	showCollectionPopup();
}

function showCollectionPopup(obj) {
	let pop = $('popup-collection');
	pop.style.display = 'block';
	//pop.style.visibility = 'visible';
	pop.onclick = function(event){
		console.log('click', event.target.tagName);
		if(event.target.tagName=='INPUT' || event.target.tagName=='TEXTAREA'){
			if(event.target.id=='coll-file'){
		    	event.stopPropagation();
		    	return true;
			} else {
				console.log(event.target)
		    	event.preventDefault();
		    	event.stopPropagation();
		    	return false;
			}
		} else {
	    	//event.preventDefault();
	    	event.stopPropagation();
	    	return true;
		}
	};
	document.addEventListener('click', hideCollectionPopup, false);
}

function hideCollectionPopup() {
	$('popup-collection').style.display = 'none';
	document.removeEventListener('click', hideCollectionPopup, false);
}

function onPreviewCollCover(input) {
	console.log('File pick');
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        $('coll-img').src = e.target.result;
        $('coll-preview').classList.remove('hidden');
    }
    reader.readAsDataURL(file);
}

function onCollection(data) {
	console.log('Collection', data);
	session.collection = {
		type   : data.type,
		address: data.address.toLowerCase(),
		owner  : data.owner
	};
	selectCollection(data.address);
}

function addCollection(data) {
	let list = $('collections');
	let coll = `<div id="${data.address}" class="collection-thumb selected" data-address="${data.address}" data-type="${data.type}" data-owner="${data.owner}" onclick="onCollection(this.dataset)"><img src="/uploads/thumbs/${data.thumbnail}"><label>${data.name}</label></div>`;
	list.innerHTML += coll;
	selectCollection(data.address);
}

function selectCollection(address) {
	console.log('Collection', address);
	// loop collections, deselect all, select address
	let list = $('collections');
	let found = false;
	for (var i = 0; i < list.children.length; i++) {
		let item = list.children[i];
		item.classList.remove('selected');
		if(item.id==address){ 
			found = true;
			console.log('Selected', address);
			item.classList.add('selected');
			let data = item.dataset;
			session.collection = {
				type   : data.type,
				address: data.address.toLowerCase(),
				owner  : data.owner	
			}
		}
	}
	if(!found){
		selectCollection('public-collection');
	}
}

function onFileSelect() {
	let filePath = document.getElementById("token-file").value;
	let fileName = filePath.substr(filePath.lastIndexOf('\\')+1);
	$('file-name').innerHTML = fileName;
}

function setStatus(text, warn=false) {
	console.log(text);
	if(warn){ text = '<warn>'+text+'</warn>'; }
	$('statusbar').innerHTML = text;
}

function submitButton(enabled=true, title='CREATE') {
	$('submit-token').disabled = !enabled;
	$('submit-token').innerHTML = enabled?title:'WAIT';
}

function setCollStatus(text, warn=false) {
	console.log(text);
	if(warn){ text = '<warn>'+text+'</warn>'; }
	$('coll-status').innerHTML = text;
}

function submitCollButton(enabled=true, title='Save Collection') {
	$('coll-save').disabled = !enabled;
	$('coll-save').innerHTML = enabled?title:'WAIT';
}


async function onSaveCollection() {
	console.log('Saving collection...');
	if(typeof Davinci == 'undefined'){ setCollStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setCollStatus('Wallet not connected', true); return; }

	submitCollButton(false);
	try {
		let input = {
			type  : '1155',
			symbol: 'VINCI',
			owner : addressToHex(Davinci.address),
			name  : $('coll-name').value,
			desc  : $('coll-desc').value,
			file  : $('coll-file').files[0]
		};
		console.log('Input', input);
		if(!input.file){ 
			setCollStatus('No file selected', true); 
			submitCollButton(true); 
			return;
		}

		if(input.desc.length>1000){ 
			setCollStatus('Description can not be longer than 1000 chars', true); 
			submitCollButton(true); 
			return;
		}

		// Save file
		setCollStatus('Saving file, please wait...');
		let hash = await saveFile(input.file, null, 'image');
		if(!hash){ setCollStatus('Error saving file to IPFS', true); submitCollButton(true); return; }
		console.log('IPFS Hash', hash);
		setCollStatus('File saved!');

		// Then save metadata
		let meta = {
			name          : input.name,
			type          : input.type,
			symbol        : input.symbol,
			description   : input.desc,
			image         : hash,
			external_link : ''
		}
		
		setCollStatus('Saving metadata, please wait...');
		let mhash = await saveMetadata(meta);
		if(!mhash){ setCollStatus('Error saving metadata to IPFS', true); submitCollButton(true); return; }
		console.log('Meta Hash', mhash);
		setCollStatus('Metadata saved!');

		// Create token
		setCollStatus('Creating collection, please wait...');
		let rec = await newCollection(input, mhash);
		if(!rec || rec.error){ setCollStatus('Error creating collection', true); submitCollButton(true); return; }
		let address = rec.address.toLowerCase();
		if(!address){ setCollStatus('Error creating collection', true); submitCollButton(true); return; }

		// Grant operator rights
		setCollStatus('Granting Davinci operator rights...')
		let apr = await approveSales(address, input.type, config.TransferProxy);
		if(!apr || apr.error) { 
			setCollStatus('Error approving operator rights', true);
			submitCollButton(true); 
			return; 
		}
		setCollStatus('Davinci granted operator rights to sell');

		// Then send data to server
		var data = new FormData();
		data.append('address',    address);
		data.append('type',       input.type);
		data.append('owner',      input.owner);
		data.append('name',       input.name);
		data.append('symbol',     input.symbol);
		data.append('description',input.desc);
		data.append('resource',   config.GATEWAY+hash);
		data.append('thumbnail',  hash);
		data.append('metadata',   config.GATEWAY+mhash);

		setCollStatus('Saving collection, please wait...');
		let res = await fetch('/collection/new', {method: 'POST', body: data});
		let rex = await res.json();
		console.log('Response', rex);
		if(rex.error) { setCollStatus(rex.error, true); submitCollButton(true); return; }

		// Select colection
		session.collection = {
			type   : '1155',
			address: address,
			owner  : input.owner
		}

		var coll = {
			address     : address,
			type        : input.type,
			owner       : input.owner,
			name        : input.name,
			symbol      : input.symbol,
			description : input.desc,
			resource    : config.GATEWAY+hash,
			thumbnail   : hash,
			metadata    : config.GATEWAY+mhash
		}
		addCollection(coll);
		selectCollection(address);

		setCollStatus('Collection created, close this popup to continue');
		submitCollButton(true, 'FINISHED');
		$('coll-save').disabled = true;
	} catch(ex) {
		console.log('Unexpected error', ex);
		setCollStatus('Unexpected error creating collection');
		submitCollButton(true);
	}
}

async function onFormSubmit() {
	if(typeof Davinci == 'undefined'){ setStatus('Wallet not available', true); return; }
	if(!Davinci.address){ setStatus('Wallet not connected', true); return; }

	let saleopt   = document.querySelector('input[name="saletype"]:checked').value;
	let foradults = $('token-adults').checked;
	let category  = session.category || 0;
	if(foradults) { category = 9; }
	let saletype  = ['direct','auction','nosale'].indexOf(saleopt);
	console.log('saletype', saletype, saleopt);
	let onsale   = saleopt!='nosale';
	let copies = parseInt(validNumber($('token-copies').value));
	if(saletype==1){ copies = 1; }
	//let timeless = $('timeless-check').checked;
	let timeless = true;

	let input = {
		creator    : Davinci.addrexx,
		owner      : Davinci.addrexx,
		media      : session.media,
		symbol     : 'VINCI',
		name       : $('token-name').value,
		desc       : $('token-desc').value,
		tags       : $('token-tags').value,
		type       : session.type,
		collection : session.collection,
		onsale     : onsale,
		saletype   : saletype,
		price      : validNumber($('token-price').value),
		reserve    : validNumber($('token-reserve').value),
		royalties  : validNumber($('token-percent').value),
		copies     : copies,
		available  : copies,
		inidate    : $('auction-ini').value,
		enddate    : $('auction-end').value,
		unlock     : $('token-unlock').checked,
		code       : $('token-code').value,
		category   : category,
		//prop1      : $('token-prop1').value,
		//value1     : $('token-value1').value,
		cover      : $('token-cover').files[0],
		file       : $('token-file').files[0],

		// TIMELESS

		file2      : $('token-file2').files[0],
		file3      : $('token-file3').files[0],
		file4      : $('token-file4').files[0],
		
		ttit       : $('timeless-ttit').value,
		tini       : $('timeless-tini').value,
		tend       : $('timeless-tend').value,
		tloc       : $('timeless-tloc').value,
		torg       : $('timeless-torg').value,
		tweb       : $('timeless-tweb').value,
		tbio       : $('timeless-tbio').value,
		tlnk1      : '',
		tlnk2      : '',
		tlnk3      : ''
	}
	console.log('Input', input);

	// Validate data
	if(!input.name){
		setStatus('Token name is required', true); 
		return;
	}

	if(input.copies<1){
		setStatus('Copies must be greater than zero', true); 
		return;
	}

	if(input.copies>1000000){
		setStatus('Copies must be lower than one million', true); 
		return;
	}

	if(input.price<1){
		setStatus('Price must be greater than zero', true); 
		return;
	}

	if(saletype==1 && input.reserve<input.price){
		setStatus('Reserve price must be greater than starting price', true); 
		return;
	}

	let today  = new Date(new Date().toJSON().substr(0,10));
	let endday = new Date(input.enddate);
	if(endday<today){
		setStatus('Auction end date must be later than today', true); 
		return;
	}

	if(input.royalties>50){
		setStatus('Royalties can not be greater than 50%', true); 
		return;
	}

	if(input.royalties<0){
		setStatus('Royalties can not be less than 0%', true); 
		return;
	}

	if(input.royalties<0){
		setStatus('Royalties can not be less than 0%', true); 
		return;
	}

	if(!input.file){ 
		setStatus('No file selected', true); 
		return;
	}
	if(input.media!='image' && !input.cover){ 
		setStatus('No cover selected', true); 
		return; 
	}
	//if(saletype==1){ input.price = input.reserve / 2; }  // auction


	submitButton(false);

	// Verify collection is davinci or owner
	console.log('Collection', input.collection);
	let canMint = false;
	if(input.collection.address == config.Collections[session.media]) {
		canMint = true;
	} else if(input.collection.owner == input.owner){
		canMint = true;
	} else {
	    console.log('Private collection not owned by user', input.collection.address);
	    setStatus('Selected collection is private, can not mint');
		canMint = false;
		submitButton(true); 
		return; 
	}

	// Verify user gave us operator approval
	setStatus('Checking operator rights to sell');
	if(input.onsale) {
		let approved = await isApproved(input.collection.address, input.collection.type, input.owner, config.TransferProxy);
		if(approved) {
			setStatus('Davinci has operator rights to sell');
		} else {
			setStatus('Granting Davinci operator rights')
			let res = await approveSales(input.collection.address, input.type, config.TransferProxy);
			if(!res || res.error) { 
				setStatus('Error approving operator rights', true);
				submitButton(true); 
				return; 
			}
			setStatus('Davinci granted operator rights to sell');
		}
	}

	// First save file to ipfs, get hash
	setStatus('Saving model, please wait...');
	let hash = await saveFile(input.file, input.cover, input.media);
	if(!hash){ setStatus('Error saving file to IPFS', true); submitButton(true); return; }
	console.log('IPFS Hash', hash);
	setStatus('File saved!');

	// Then save file to ipfs, get hash
	setStatus('Saving video, please wait...');
	let hash2 = await saveExtra(input.file2, 'video');
	if(!hash2){ setStatus('Error saving file to IPFS', true); submitButton(true); return; }
	console.log('IPFS Hash', hash2);
	input.tlnk1 = 'https://ipfs.io/ipfs/'+hash2;
	setStatus('File saved!');

	// Then  save file to ipfs, get hash
	setStatus('Saving json, please wait...');
	let hash3 = await saveExtra(input.file3, 'text');
	if(!hash3){ setStatus('Error saving file to IPFS', true); submitButton(true); return; }
	console.log('IPFS Hash', hash3);
	input.tlnk2 = 'https://ipfs.io/ipfs/'+hash3;
	setStatus('File saved!');

	// Then  save file to ipfs, get hash
	setStatus('Saving banner, please wait...');
	let hash4 = await saveExtra(input.file4, 'image');
	if(!hash4){ setStatus('Error saving file to IPFS', true); submitButton(true); return; }
	console.log('IPFS Hash', hash4);
	input.tlnk3 = 'https://ipfs.io/ipfs/'+hash4;
	setStatus('File saved!');

	// Then save metadata
	let meta = {
		name          : input.name,
		type          : session.type,
		symbol        : input.symbol,
		description   : input.desc,
		image         : hash,
		external_link : ''
	}

	setStatus('Saving metadata, please wait...');
	let mhash = await saveMetadata(meta);
	if(!mhash){ setStatus('Error saving metadata to IPFS', true); submitButton(true); return; }
	console.log('Meta Hash', mhash);
	setStatus('Metadata saved!');

	// TODO: Charge minting fees

	// Create token id with hash, add to collection
	//setStatus('Creating NFT contract, please wait...');
	setStatus('Creating NFT, please wait...');
	//let rec = await newContract(meta, mhash);
	let rec = await mintToken(input.collection, input, mhash);
	if(!rec.address){ setStatus(rec.error, true); submitButton(true); return; }
	let address = rec.address;
	console.log('TokenId', address);

	// Then send data to server
	var data = new FormData();
	data.append('address',    address);
	data.append('creator',    input.creator);
	data.append('owner',      input.owner);
	data.append('collection', input.collection.address);
	data.append('tokenid',    address);
	data.append('media',      input.media);
	data.append('name',       input.name);
	data.append('symbol',     input.symbol);
	data.append('description',input.desc);
	data.append('tags',       input.tags);
	data.append('type',       input.type);
	data.append('onsale',     input.onsale);
	data.append('saletype',   input.saletype);
	data.append('saleprice',  input.price);
	data.append('reserve',    input.reserve);
	data.append('inidate',    new Date(input.inidate).toJSON());
	data.append('enddate',    new Date(input.enddate).toJSON());
	data.append('unlock',     input.unlock);
	data.append('unlockcode', input.code);
	data.append('royalties',  input.royalties);
	data.append('copies',     input.copies);
	data.append('available',  input.available);
	data.append('prop1',      input.prop1);
	data.append('value1',     input.value1);
	data.append('category',   input.category);
	data.append('resource',   config.GATEWAY+hash);
	data.append('cover',      hash); // only if image else upload cover
	data.append('thumbnail',  hash);
	data.append('metadata' ,  config.GATEWAY+mhash);
	//data.append('file',     file);

	// TIMELESS EVENT
	if(timeless){
		console.log('Timeless!')
		data.append('ttit',  input.ttit);
		data.append('tini',  new Date(input.tini).toJSON());
		data.append('tend',  new Date(input.tend).toJSON());
		data.append('tloc',  input.tloc);
		data.append('torg',  input.torg);
		data.append('tweb',  input.tweb);
		data.append('tbio',  input.tbio);
		data.append('tlnk1', input.tlnk1);
		data.append('tlnk2', input.tlnk2);
		data.append('tlnk3', input.tlnk3);
	}
	console.log('Data', input);

	let res = await fetch('/token/new', {method: 'POST', body: data});
	//let res = await fetch('/timeless/new', {method: 'POST', body: data});
	let rex = await res.json();
	console.log('Response', rex);
	if(rex.error) { setStatus(rex.error, true); submitButton(true); return; }

	// If on sale: save order/auction
	if(input.onsale){ 
		let rey, rez;
		if(input.saletype==0){ // Direct sale
			setStatus('Creating sell order, please wait...');
			rey = await fetch('/api/neworder/'+address, {method: 'GET'});
			rez = await rey.json();
			console.log('Order Response', rez);
		} else if(input.saletype==1){ // Auction
			setStatus('Creating auction order, please wait...');
			rey = await fetch('/api/newauction/'+address, {method: 'GET'});
			rez = await rey.json();
			console.log('Auction Response', rez);
		}
	}
	setStatus('<a href="./edit/'+address+'">Click here to see your new collectible</a> or <a href="/create">create a new one</a>');
	submitButton(false);
	$('submit-token').innerHTML = 'SUCCESS!';
}

async function newCollection(rec, mhash) {
	console.log('New collection for metahash', mhash);

	try {
		let abi, ctr, res;
		let name   = rec.name;
		let symbol = rec.symbol;
		let type   = rec.type;
		let uri    = mhash;
		let prefix = config.GATEWAY;
	    let gas    = { gasPrice: config.GASPRICE, gasLimit: config.GASDEPLOY, from: Davinci.addrexx };

	    if(type=='721'){
	    	arg = [name, symbol, Davinci.addrexx, uri, prefix];
			inf = { arguments: arg, data: DavinciToken.bytecode };
		    abi = DavinciToken.abi;
			console.log('New 721 collection', arg);
			//ctr = Harmony.contracts.createContract(abi);
			ctr = await Davinci.contract(abi);
			ctr.wallet = Davinci.wallet;
			res = await ctr.deploy(inf).send(gas);
		    //res = await ctr.methods.contractConstructor(inf).send(gas);
	    } else {
	    	arg = [name, symbol, Davinci.addrexx, uri, prefix];
			inf = { arguments: arg, data: DavinciMultipleToken.bytecode };
		    abi = DavinciMultipleToken.abi;
			console.log('New 1155 collection', arg);
			//ctr = Harmony.contracts.createContract(abi);
			ctr = await Davinci.contract(abi);
			ctr.wallet = Davinci.wallet;
			//if(Davinci.wallet.isMetaMask){
			res = await ctr.deploy(inf).send(gas);
			//} else {
			//    res = await ctr.methods.contractConstructor(inf).send(gas);
			//}
	    }
	    console.log('RES',res);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
	    	ok = (res.options && res.options.address);
	    	txid = res.transactionHash;
		} else {
	        if (res.transaction.txStatus == 'REJECTED') { ok = false }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else {
	            console.log('Unknown error', res);
	            return {error: 'Unknown status: '+res.transaction.txStatus};
	        }
	    	txid = res.transaction.id;
	    }
        if (ok) {
            console.log('Confirmed');
            console.log('TX', txid);
            if(res.options && res.options.address){ 
            	let address = res.options.address
            	console.log('Deployed at ', address);
            	return {address:address};
            } else {
            	console.log('Error: no contract address');
            	return {error: 'Error creating collection, tx id: '+txid};
            }
        } else {
            console.log('Rejected', res);
            return {error: 'Transaction rejected'};
        }
    } catch(ex){ 
        console.log('Contract error:', ex) ;
        return {error: ex.message||ex};
    }
    return null;
}

// Can only mint in your own collection
async function mintToken(collection, rec, mhash) {
	try {
		let abi, ctr, res;
		let address = randomAddress();
		let tokenId = address;
		let name    = rec.name;
		let symbol  = rec.symbol;
		let type    = collection.type;
		let uri     = mhash;
		let prefix  = config.GATEWAY;
		let supply  = rec.copies;
	    let gas     = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.address };
        let fees    = [];
        if(rec.royalties>0){
        	fees = [[rec.creator, rec.royalties]];
        }
        console.log('Minting...');
        console.log('Collection', collection.address);
        console.log('TokenId', tokenId);
        console.log('Fees', fees);
        console.log('Supply', supply);
        console.log('Uri', uri);
	    if(type=='721'){
	    	console.log('Minting 721 with tokenId', tokenId);
		    abi = DavinciToken.abi;
		    adr = collection.address;
			//ctr = Harmony.contracts.createContract(abi, adr);
			ctr = await Davinci.contract(abi, adr);
			ctr.wallet = Davinci.wallet;
		    res = await ctr.methods.mint(tokenId, fees, uri).send(gas);
	    } else {
	    	console.log('Minting 1155 with tokenId', tokenId);
		    abi = DavinciMultipleToken.abi;
		    adr = collection.address;
			//ctr = Harmony.contracts.createContract(abi, adr);
			ctr = await Davinci.contract(abi, adr);
			ctr.wallet = Davinci.wallet;
		    res = await ctr.methods.mint(tokenId, fees, supply, uri).send(gas);
	    }
	    console.log('MINT RES',res);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
			//res = await web3.eth.getTransactionReceipt(res.transactionHash);
	    	//console.log('REC',res);
	    	ok = res.status;
	    	txid = res.transactionHash;
		} else {
	        if (res.transaction.txStatus == 'REJECTED') { ok = false; }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else { return {error: 'Unknown status: '+res.transaction.txStatus}; }
	    	txid = res.transaction.id;
	    }
       if (ok) {
            console.log('Token minted, tx id', txid);
            console.log('TID', tokenId);
            return {address:address};
    	} else {
            console.log('Rejected', res);
            return {error: 'Transaction rejected'};
    	}
    } catch(ex){ 
        console.log('Contract error:', ex) ;
        return {error: ex.message||ex};
    }
    return null;
}

async function saveMetadata(meta) {
	if(!meta){ 
		//return {error:'No metadata provided'};
		return null;
	}
	var data = new FormData();
	for(key in meta){
		data.append(key, meta[key]);
	}
	console.log('META', meta);
	let res, rex, hash = null;
	try {
		res = await fetch('/token/metadata', {method: "POST", body: data});
		rex = await res.json();
		if(rex.error) { 
			console.log('Server error saving metadata', rex.error);
			//return {error:rex.error}; 
			return null;
		}
		if(!rex.hash) { 
			console.log('Server error, no hash returned', rex);
			//return {error:'Error saving metadata to IPFS'}; }
			return null;
		}
		hash = rex.hash;
	} catch(ex) {
		console.log('Server error:', ex);
		//return {error:'Metadata server error, try again later'};
		return null;
	}
	return hash;
}

async function saveFile(file, cover, media) {
	if(!file){ return; }
	console.log('Saving file', file);
	var data = new FormData();
	data.append('file', file);
	data.append('cover', cover);
	data.append('media', media);
	let res = await fetch('/token/upload', {method: "POST", body: data});
	let rex = await res.json();
	if(rex.error) { console.log(rex.error); return null; }
	if(!rex.hash) { console.log('Error saving file to IPFS'); return null; }
	return rex.hash;
}

async function saveExtra(file, media) {
	if(!file){ return; }
	console.log('Saving extra file', file);
	var data = new FormData();
	data.append('file', file);
	data.append('media', media);
	let res = await fetch('/extra/upload', {method: "POST", body: data});
	let rex = await res.json();
	if(rex.error) { console.log(rex.error); return null; }
	if(!rex.hash) { console.log('Error saving extra file to IPFS'); return null; }
	return rex.hash;
}

function calcPrice() {
	$('price-usd').innerHTML = (validNumber($('token-price').value) * session.oneusd.price).toFixed(2) + ' USD';
}

function toggleTimeless() {
	let checked = $('timeless-check').checked;
	console.log('Toggle', checked);
	let form = $('timeless-form');
	form.style.display = form.style.display=='none'?'block':'none';
}

async function main() {
	console.log('Session', session)
	setPublicCollection('image');
	let today  = myTime();
	let endday = myTime();
	let tenday = myTime(60);
	endday = new Date(endday.setDate(endday.getDate() + 3)); // Three days from now
	//$('auction-ini').valueAsDate = today;
	//$('auction-end').valueAsDate = endday;
	$('auction-ini').value   = today.toJSON().substr(0,16);
	$('auction-end').value   = endday.toJSON().substr(0,16);
	$('timeless-tini').value = today.toJSON().substr(0,16);
	$('timeless-tend').value = tenday.toJSON().substr(0,16);
	startDavinci();
	calcPrice();
	onSelectMedia('model');
}

window.onload = main


// END