// IPFS

let ipfsClient  = require('ipfs-http-client');
//let ipfsGateway = 'https://ipfs.io/ipfs/'
//let ipfsGateway = 'https://gateway.ipfs.io/ipfs/'
let ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

async function upload(file) {
	//let file = { path:'', content: Buffer.from(bytes) };
	//let file = { path:'', content: file };
	let hash = null;
	try {
		let res = await ipfs.add(file);
		if(res && res.path){
			console.warn('IPFS UPLOAD', res.path);
			hash = res.path;
		} else {
			console.warn('ERROR>' + (new Date()).toJSON(), 'IPFS WARN', res);
		}
	} catch(ex) {
		console.error('ERROR>' + (new Date()).toJSON(), 'IPFS ERROR', ex);
	}
	return hash;
}

// async function main() {
// 	let data = {name:'test',content:'hello world'};
// 	let text = JSON.stringify(data);
// 	let hash = await upload(text);
// 	console.log('HASH', hash)
// 	console.log('URL', ipfsGateway + hash)
// }

exports.upload = upload;

// END