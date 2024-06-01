// DAVINCI

var session = {
	wallet: null    // user wallet
}

function setStatus(text, warn=false) {
	console.log(text);
	if(warn){ text = '<warn>'+text+'</warn>'; }
	$('statusbar').innerHTML = text;
}

function submitButton(enabled=true, title) {
	$('form-save').disabled  = !enabled;
	$('form-save').innerHTML = title||'WAIT';
}

async function onSave() {
	setStatus(''); 
	console.log('Saving proposal...');
	console.log('Title', $('title').value);
	console.log('From',  $('inidate').value);
	console.log('To',    $('enddate').value);
	if($('title').value==''){ setStatus('Title is required', true); return; }
	if($('details').value==''){ setStatus('Details are required', true); return; }
	let action = session.item.action;
	let today  = new Date().toJSON().substr(0,10);
	let iniday = $('inidate').value;
	let endday = $('enddate').value;
	//console.log($('enddate').value, endday, today);
	if(action=='new' && iniday<today){
		setStatus('Starting date must be later than today', true); 
		return;
	}
	if(action=='new' && endday<today){
		setStatus('Ending date must be later than today', true); 
		return;
	}
	if(endday<iniday){
		setStatus('Ending date must be later than starting date', true); 
		return;
	}

	setStatus('Saving your proposal, please wait...');
	submitButton(false);

	// TODO: sign a message
	var data = new FormData();
	data.append('title',   $('title').value);
	data.append('details', $('details').value);
	data.append('link',    $('link').value);
	data.append('quorum',  $('quorum').value);
	data.append('inidate', $('inidate').value);
	data.append('enddate', $('enddate').value);

	// Send to server
	let res = null;
	if(action=='new'){
		console.log('---NEW')
		let address = randomAddress();
		data.append('address', address);
		data.append('author',  Davinci.addrexx);
		res = await fetch('/api/proposal', {method: 'POST', body: data});
	} else if(action=='edit'){
		console.log('---EDIT')
		data.append('govid', session.item.govid);
		res = await fetch('/api/proposal', {method: 'PUT', body: data});
	}
	let rex = await res.json();
	console.log('Response', rex);
	if(rex.error) { setStatus(rex.error, true); submitButton(); return; }
	setStatus('Your proposal was saved');
	submitButton(false, 'SUCCESS');
	window.location.href='/governance';
}

async function moderate(status) {
	var data = new FormData();
	data.append('govid', session.item.govid);
	data.append('moderator', Davinci.addrexx);
	data.append('moddate', new Date().toJSON());
	data.append('reason', $('reason').value);
	data.append('status', status);
	let res = await fetch('/api/proposal', {method: 'PUT', body: data});
	window.location.href = '/governance';
}

async function onApprove() {
	moderate(2);
}

async function onReject() {
	moderate(1);
}


function voteStatus(text, warn=false) {
	console.log(text);
	if(warn){ text = '<warn>'+text+'</warn>'; }
	$('vote-bar').innerHTML = text;
}

function voteButtons(enabled=true, title) {
	$('vote0').disabled  = !enabled;
	$('vote1').disabled  = !enabled;
	$('vote2').disabled  = !enabled;
	$('vote0').innerHTML = title||'WAIT';
	$('vote1').innerHTML = title||'WAIT';
	$('vote2').innerHTML = title||'WAIT';
}

async function onVote(option) {
	if(typeof(Davinci)=='undefined' || !Davinci.address){ 
		voteStatus('Wallet not connected', true);
		return;
	}
	voteStatus('Saving your vote, please wait...');
	voteButtons(false);
	let balancex  = await Davinci.getTokenBalance(config.VinciToken, Davinci.addrexx); // <<<< USE VINCI 
	//let balancex  = await Davinci.getBalance(Davinci.address);
	let balancen = parseInt(balancex);
	if(balancen<100){ voteStatus('You need at least 100 VINCI to vote'); voteButtons(false, 'ERROR'); return; }
	let stakes = 0;
	if(balancen>=    100){ stakes = 1; }
	if(balancen>=   1000){ stakes = 2; }
	if(balancen>=  10000){ stakes = 3; }
	if(balancen>= 100000){ stakes = 4; }
	if(balancen>=1000000){ stakes = 5; }
	//let stakex = stakes.toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 0});
	console.log('Stakes', stakes);
	//let symbol = 'ONE';
	let symbol = 'VINCI';
	voteStatus('Your vote weight '+stakes+' '+symbol);

	var data = new FormData();
	data.append('govid',   session.item.govid);
	data.append('voter',   Davinci.addrexx);
	data.append('option',  option);
	//data.append('other', $('other').value);
	data.append('stakes',  stakes);
	data.append('balance', balancen);

	let res = await fetch('/api/vote', {method: 'POST', body: data});
	let rex = await res.json();
	console.log('Response', rex);
	if(rex.error) { voteStatus(rex.error, true); voteButtons(false, 'ERROR'); return; }
	tallyVotes(rex);
}

function tallyVotes(info) {
	console.log('Info', info);
	let tally = {
		agree   :{votes:0, stakes:0, balance:0, option:0},
		disagree:{votes:0, stakes:0, balance:0, option:1},
		abstain :{votes:0, stakes:0, balance:0, option:2}
	};
	for (var i = 0; i < info.length; i++) {
		info[i].votes   = parseInt(info[i].votes);
		info[i].stakes  = parseInt(info[i].stakes);
		info[i].balance = parseInt(info[i].balance);
		info[i].option  = parseInt(info[i].option);
		if(info[i].option==0){      tally.agree    = info[i]; }
		else if(info[i].option==1){ tally.disagree = info[i]; }
		else if(info[i].option==2){ tally.abstain  = info[i]; }
	}

	console.log('Tally', tally);
	//let symbol = 'ONE';
	let symbol = 'VINCI';
	let tot = tally.agree.stakes + tally.disagree.stakes + tally.abstain.stakes;
	let tox = parseInt(tot).toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 0})
	console.log('Total', tot);
	console.log('Totax', tox);
	let sub0 = tally.agree.stakes/tot;
	let sub1 = tally.disagree.stakes/tot;
	let sub2 = tally.abstain.stakes/tot;
	let sux0 = (sub0*100).toFixed(2)+'%';
	let sux1 = (sub1*100).toFixed(2)+'%';
	let sux2 = (sub2*100).toFixed(2)+'%';
	console.log('Sub0', sub0, sux0);
	console.log('Sub1', sub1, sux1);
	console.log('Sub2', sub2, sux2);
	$('vote-total').innerHTML = 'Total weighted votes '+tox+' '+symbol;
	let v0 = $('vote0');
	let v1 = $('vote1');
	let v2 = $('vote2');
	let l0 = v0.parentNode;
	let l1 = v1.parentNode;
	let l2 = v2.parentNode;
	l0.style.textAlign = 'left';
	l1.style.textAlign = 'left';
	l2.style.textAlign = 'left';
	l0.style.paddingLeft = '40px';
	l1.style.paddingLeft = '40px';
	l2.style.paddingLeft = '40px';
	v0.disabled  = true;
	v1.disabled  = true;
	v2.disabled  = true;
	v0.innerHTML = sux0;
	v1.innerHTML = sux1;
	v2.innerHTML = sux2;
	v0.style.width = (sub0 * 300)+'px';
	v1.style.width = (sub1 * 300)+'px';
	v2.style.width = (sub2 * 300)+'px';
	v0.style.minWidth = '70px';
	v1.style.minWidth = '70px';
	v2.style.minWidth = '70px';
	v0.style.backgroundColor = '#00ade8';
	v1.style.backgroundColor = '#800';
	v2.style.backgroundColor = '#333'
	v0.style.color = '#fff';
	v1.style.color = '#fff';
	v2.style.color = '#fff';
}

async function main() {
	await startDavinci();
	if(session.item.status==3 || session.item.voted){
		let res = await fetch('/api/tally/'+session.item.govid);
		let rex = await res.json();
		console.log('Response', rex);
		if(rex.error) { voteStatus(rex.error, true); return; }
		tallyVotes(rex);
	}
}

window.onload = main

// END