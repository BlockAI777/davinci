//---- DAVINCI

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const fetch  = require('node-fetch');
const db     = require("./database");
const { Harmony }  = require('@harmony-js/core');

let Market = require("./public/contracts/Market3.json");
let DavinciToken = require("./public/contracts/DavinciToken.json");
let DavinciMultipleToken = require("./public/contracts/DavinciMultipleToken.json");

let operator     = process.env.OPERATOR;
let topicToken   = '0x5bcc83d6bc80430f5d0d70151a09012f9e5edd2256bddb907404886915254711';
let topicMulti   = '0x5c0c0f5278addeacb6676046fc1078622d1a1a1fc8a589035b5609ae4fe29dca';
let topicOwner   = '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0';


async function HMY(privateKey) {
    let CHAINID = parseInt(process.env.CHAINID) || 2; // TESTNET
    if(!process.env.NETWORK){ console.error('initHmy: No env vars'); return null; }
    let hmy = new Harmony(process.env.NETURL, { chainType: 'hmy', chainId: CHAINID })
    if(privateKey){
        const account = hmy.wallet.addByPrivateKey(privateKey);
        hmy.wallet.setSigner(account.address);
    }
    //let res = await hmy.blockchain.getShardingStructure();
    //hmy.shardingStructures(res.result);
    return hmy
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

async function randomAddress() {
    let buf = await crypto.randomBytes(20);
    let adr = '0x'+buf.toString('hex');
    return adr;
}


//---- MAIN

async function run() {
    console.warn('---- Migration...');
    doNothing();
    //firstOrders();
    //await animocaOwners();
    //await atariTokens();
    //await atariOwners();
}

function doNothing() {
    console.warn('Nothing to do');
    return;
}

async function firstOrders() {
    console.warn('First orders');
    //let data = await db.getLatestArtworks();
    //for (var i = 0; i < data.length; i++) {
    //  console.warn(data[i].address);
    //}

    return;
}


async function animocaOwners() {
    let list = require('./animoca-owners.json');
    console.warn('Creating ownership...');
    for (var i = 0; i < list.length; i++) {
        let item = list[i];
        let input = {
            'address':    item[1],
            'collection': '0xd45f2890afc159f96702de015b414c7d1cda3dba',
            'tokenid':    item[2],
            'ownerid':    item[0],
            'copies':     1,
            'available':  1,
            'onsale':     false,
            'saletype':   2,
            'saleprice':  250,
            'updateqty':  false
        };
        let rex = await db.newOwner(input);
        console.warn(rex);
        if(rex.error) { console.warn(rex.error); }
    }
}

async function atariTokens() {
    console.warn('Saving atari tokens in database...');
    let list = require('./atari-tokens.json');
    let now  = '2021-05-27';
    for (var i in list) {
        let address = await randomAddress();
        let token = i;
        let owner = list[i];
        let name  = 'Centipede 2600 Cartridge Classic - RED';
        let desc  = 'Quidd Atari Collectibles sold on Harmony blockchain';
        let rsrc  = 'http://ipfs.infura.io/ipfs/QmbJTf5WcWKFRfkkKZKNvybqGgTFjRfzyLu2775qyf2ujU';
        let hash  = 'QmbJTf5WcWKFRfkkKZKNvybqGgTFjRfzyLu2775qyf2ujU';
        let input = {
            'address':    address,
            'creator':    '0x1611a9c94fab50f1bc09d3964d93f0f30211ed00',
            'owner':      owner,
            'type':       '721',
            'collection': '0x1611a9c94fab50f1bc09d3964d93f0f30211ed89',
            'tokenid':    token,
            'media':      'video',
            'name':       name,
            'symbol':     'VINCI',
            'description':desc,
            'onsale':     false,
            'tags':       'quidd atari centipede',
            'saletype':   2,
            'saleprice':  1000,
            'reserve':    0,
            'inidate':    now,
            'enddate':    now,
            'unlock':     false,
            'royalties':  10,
            'copies':     1,
            'available':  0,
            'resource':   rsrc,
            'cover':      hash,
            'thumbnail':  hash
        };
        console.warn(i, owner);
        let rex = await db.newArtwork(input);
        console.warn(rex);
        if(rex.error) { console.warn(rex.error); }
        
        // Ownership
        let rec = {
            'address':    address,
            'collection': '0x1611a9c94fab50f1bc09d3964d93f0f30211ed89',
            'tokenid':    token,
            'ownerid':    owner,
            'copies':     1,
            'available':  1,
            'onsale':     false,
            'saletype':   2,
            'saleprice':  1000,
            'updateqty':  false
        };
        let rey = await db.newOwner(rec);
        console.warn(rey);
        if(rey.error) { console.warn(rey.error); }

    }
}

async function atariOwners() {
    let list = require('./atari-owners.json');
    console.warn('Creating ownership...');
    for (var i = 0; i < list.length; i++) {
        let item = list[i];
        let input = {
            'address':    item[1],
            'collection': '0x1611a9c94fab50f1bc09d3964d93f0f30211ed89',
            'tokenid':    item[2],
            'ownerid':    item[0],
            'copies':     1,
            'available':  1,
            'onsale':     false,
            'saletype':   2,
            'saleprice':  250,
            'updateqty':  false
        };
        let rex = await db.newOwner(input);
        console.warn(rex);
        if(rex.error) { console.warn(rex.error); }
    }
}


exports.run = run;

// END