// DAVINCI

var session = {
	wallet: null,    // user wallet
	user  : { isApproved: false }
}

function checkAlphanum(text){
	var rex = /^\w+$/;
	if (rex.test(text)) {
		return false;
	}
	return true;
}

function onPreviewFile(input) {
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e)  {
        $('profile-image').src = e.target.result;
    }
    reader.readAsDataURL(file);
 }

async function onApproval() {
	console.log('Approval');
	if(session.user.isApproved){
		approveSales(true);
	} else {
		approveSales(false);
	}
}

async function approveSales(grant) {
	let abi, adr, opr, ctr, res;
    let gas = { gasPrice: config.GASPRICE, gasLimit: config.GASLIMIT, from: Davinci.address };
    try {
	    //abi = DavinciToken.abi;
	    abi = DavinciMultipleToken.abi;
	    adr = config.Collections.image;
	    opr = config.Operator;
		ctr = await Davinci.contract(abi, adr);
		//ctr = Harmony.contracts.createContract(abi, adr);
		ctr.wallet = Davinci.wallet;
	    res = await ctr.methods.setApprovalForAll(opr, true).send(gas);
	    let ok = false;
		if(Davinci.wallet.isMetaMask){
	    	ok = res.status;
	    	txid = res.transactionHash;
		} else {
	        if (res.transaction.txStatus == 'REJECTED') { ok = false; }
	        else if (res.transaction.txStatus == 'CONFIRMED') { ok = true; }
	        else { return {error: 'Unknown status: '+res.transaction.txStatus}; }
	    	txid = res.transaction.id;
		}
        if (ok) {
	        console.log('Approved', txid);
            return {status:'SUCCESS'};
        }  else {
            console.log('Rejected', res);
            return {error: 'Transaction rejected'};
        }
    } catch(ex){ 
        console.log('Contract error:', ex) ;
    }
}

function setStatus(text, warn=false) {
	console.log(text);
	if(warn){ text = '<warn>'+text+'</warn>'; }
	$('statusbar').innerHTML = text;
}

function submitButton(enabled=true, title='SAVE PROFILE') {
	$('profile-save').disabled  = !enabled;
	$('profile-save').innerHTML = enabled?title:'WAIT';
}

async function onSave() {
	console.log('Saving profile...');
	setStatus('Saving your profile, please wait...');
	submitButton(false);
	// TODO: sign a message
	let act = await Davinci.wallet.getAccount()
	console.log('Act',act);
	let address = addressToHex(act.address);
	var data = new FormData();
	data.append('address',     address);
	data.append('name',        $('name').value);
	data.append('tagline',     $('tagline').value);
	data.append('description', $('desc').value);
	data.append('url',         $('url').value);
	data.append('twitter',     $('twitter').value);
	data.append('instagram',   $('instagram').value);
	data.append('file',        $('avatar-file').files[0]);

	let name = $('name').value.toLowerCase();
	let desc = $('desc').value;
	if(checkAlphanum(name)){ setStatus('Invalid characters in user name', true); submitButton(); return; }
	if(name.length>20){ setStatus('Name length max 20 chars', true); submitButton(); return; }
	if(desc.length>1000){ setStatus('Description length max 1000 chars', true); submitButton(); return; }
	let rx = await fetch('/api/checkuser/'+name);
	console.log('RX', rx);
	let ok = await rx.json();
	console.log('OK', ok);
	if(ok.error) { setStatus(ok.error, true); submitButton(); return; }
	if(ok.status=='NO' && ok.user!=address) { setStatus('Name already taken, try again', true); submitButton(); return; }

	// Send to server
	let res = await fetch('/api/user', {method: 'POST', body: data});
	let rex = await res.json();
	console.log('Response', rex);
	if(rex.error) { setStatus(rex.error, true); submitButton(); return; }
	setStatus('Your profile was saved');
	submitButton();
}


async function main() {
	startDavinci();
}

window.onload = main

// END