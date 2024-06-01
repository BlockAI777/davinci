//---- DAVINCI

const fs           = require('fs');
const path         = require('path');
const fetch        = require('node-fetch');
const ejs          = require('ejs');
const express      = require('express');
const uploader     = require('express-fileupload');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const Jimp         = require('jimp');
const gifFrames    = require('gif-frames');
const sharp        = require('sharp');
const Web3         = require('web3');
const api          = require('./api');
const bots         = require('./bots');
const db           = require('./database');
const ipfs         = require('./ipfs');
const migrate      = require('./migrate');
const versions     = require('./versions');

var config = {
    maintenance: process.env.MAINTENANCE,
    explorer:    process.env.EXPLORER,
    theme:       'lite-mode',
    searchbar:   '',
    versions:    versions,
    badge:       0
};

const MediaType = {
    image : 'Images', 
    model : 'Models', 
    audio : 'Audio', 
    music : 'Music', 
    video : 'Videos', 
    movie : 'Movies', 
    book  : 'Books', 
    domain: 'Domains'
};

let admins = [
    '0x66d107bb488a861c245b3fd96de4052b88b8f78d',  // me mainnet
    '0x8c7d955a7d6568a10cc6d9774e9eae7ff5191bd0',  // me testnet
    '0x98e158f49803fa6b54e755f0b89a1c8c9591bb5e',  // bruno
    '0x244546825eb075206729dc4b67729e6b9b1c98cc',  // joseba
    '0x248281592e9dd99d43345cc44c202730615bd3c9',  // codewarrior
    '0xa642c7d416196c65c3a6e34b6dabce90acbd51c9',  // insanitydrop
    '0x6f6bbce31a9a7a66e41e8e73e82e4e81eb725b54'   // FRATE Dumitru
];
    //REMOVED
    //0x0817ac1589813ca9c3aee5305c65ab751961a9d8   // C7
    //0xb85c213bab8c3d3b506fceb5761dcee9cbbc6b4d   // TohsterSG
    //0x66808200f61310dc3b9285997746b7808b704ac8   // MomiMomi
    //0xb337c6372c0cd1fef25385c32c128404450f4871   // globey
    //0x95f6a7d4309b8e70f139394d25e3af6045b36d02   // sirsapient

function isAdminOLD(user){ 
    if(!user) return false;
    return admins.indexOf(user.toLowerCase())>=0;
}

async function isAdmin(user, token){ 
    //console.warn('Admin:', user, token);
    if(!user){ return false; }
    let rec = await db.getUser(user);
    //console.warn('Userx:', rec.address, rec.token, rec.name, rec.isadmin);
    if(!rec || rec.error){ return false; }
    if(rec.token==token && rec.isvalid && rec.isadmin){ return true; }
    return false;
}


//---- UTILS

function hit(txt){ 
    console.warn(new Date(), txt);
}

function errorHandler(ex){
    let nam = ex.name;
    let msg = ex.message;
    let stk = ex.stack;
    let par = ex.stack.split('\n');
    let lst = par[1].trim();
    let mth = lst?.split('(')[0]?.trim() || '';
    let cal = lst?.split('(')[1]?.split(')')[0] || lst;
    let lin = cal?.split(':')?.slice(-2)[0] || '';
    let col = cal?.split(':')?.slice(-2)[1] || '';
    let dat = {
        call   : cal,
        column : col,
        line   : lin,
        message: msg,
        method : mth,
        name   : nam,
        stack  : stk,
        origin : 'S'
    }
    console.log(dat);
    db.saveError(dat);
}

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

async function thumbgif(imgsrc, thumb){
    //let saver = (buffer, name) => { fs.writeFile(name, buffer, {flag: 'w'}, err => console.warn(err)); };
    try {
        gifFrames({ url: imgsrc, frames: 0 }).then(function (frameData) {
            if(frameData){
                console.warn('--- GIF', frameData[0].frameInfo.width, 'x', frameData[0].frameInfo.height);
                frameData[0].getImage().pipe(fs.createWriteStream(thumb));
            } else {
                console.error(enow(), '--- GIF Error framing', imgsrc);
            }
        });
    } catch(ex) {
        console.error(enow(), '--- GIF Error creating', imgsrc);
    }
}

async function thumbitJimp(imgsrc, thumb){
    //console.warn('Thumb', imgsrc)
    try {
        Jimp.read(imgsrc, (err, img) => {
            if (err) { console.error(enow(), 'Error in thumbnail', err); return; }
            let ext = img.getExtension();
            //console.warn('Ext', ext);
            if(ext=='gif' || ext=='image/gif'){ 
                //console.warn('--- GIF', imgsrc, thumb); 
                thumbgif(imgsrc, thumb);
                //console.warn('GIF can not be thumbnailed yet'); 
                return;
            }
            if(['jpeg','jpg','png'].indexOf(ext)<0){ console.warn(now(), 'Only JPG and PNG can be thumbnailed'); return; }
            img.cover(250, 250).quality(80).write(thumb); // save
        });
    } catch(ex) {
        console.error(enow(), 'Error in thumbnail', ex);
    }
}

async function coveritJimp(imgsrc, cover){
    //console.warn('Cover', imgsrc)
    try {
        Jimp.read(imgsrc, (err, img) => {
            if (err) { console.error(enow(), 'Error in cover', err); return; }
            //console.warn('Image size', img.bitmap.width, img.bitmap.height, img.getMIME());
            if(img.bitmap.width<=1024){ console.warn(now(), 'Image size too small, not resized'); return; }
            let ext = img.getExtension();
            if(ext=='gif'){ console.error(enow(), 'GIF can not be resized yet'); return; }
            if(['jpeg','jpg','png'].indexOf(ext)<0){ console.warn(now(), 'Cover: Only JPG and PNG can be resized'); return; }
            img.resize(1024, Jimp.AUTO).quality(80).write(cover); // save
        });
    } catch(ex) {
        console.error(enow(), 'Error in cover', ex);
    }
}

async function thumbit(imgsrc, thumb){
    console.warn('Sharp thumb', imgsrc);
    try {
        let img = await sharp(imgsrc);
        let inf = await img.metadata();
        let ext = inf.format;
        console.warn(inf.format, inf.width, 'x', inf.height);
        if(ext=='gif'){ 
            thumbgif(imgsrc, thumb);
            return;
        }
        if(['jpeg','jpg','png'].indexOf(ext)<0){ console.warn(now(), 'Only JPG and PNG can be thumbnailed'); return; }
        let buf = await img.resize(250, 250, {fit:'cover'}).toBuffer();
        fs.writeFileSync(thumb, buf, {flag: 'w'});
    } catch(ex) {
        console.error(enow(), 'Error in thumbnail', ex);
    }
}

async function coverit(imgsrc, cover){
    console.warn('Sharp cover', imgsrc);
    try {
        let img = await sharp(imgsrc);
        let inf = await img.metadata();
        let ext = inf.format;
        console.warn(inf.format, inf.width, 'x', inf.height);
        if(inf.width<=1024){ console.warn(now(), 'Image size too small, not resized'); return; }
        if(ext=='gif'){ console.error(enow(), 'GIF can not be resized yet'); return; }
        if(['jpeg','jpg','png'].indexOf(ext)<0){ console.warn(now(), 'Cover: Only JPG and PNG can be resized'); return; }
        let buf = await img.resize(1024).toBuffer();
        fs.writeFileSync(cover, buf, {flag: 'w'});
    } catch(ex) {
        console.error(enow(), 'Error in cover', ex);
    }
}

async function fetchFile(fileUrl, filePath) {
    //console.warn('Fetching image...');
    //console.warn('Source', fileUrl);
    //console.warn('Target', filePath);
    try {
        let res = await fetch(fileUrl);
        let buf = await res.buffer();
        fs.writeFileSync(filePath, buf);
        console.warn('Finished downloading!');
    } catch(ex) {
        console.error(enow(), 'Error downloading!', ex)
        return false;
    }
    return true;
}

function titleCase(str) {
  let txt = str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
  return txt;
}

function getRarity(copies) {
    let num = parseInt(copies) || 1;
    if(num==1)  { return 'Unique'; }
    if(num<10)  { return 'Legendary'; }
    if(num<50)  { return 'Epic'; }
    if(num<100) { return 'Rare'; }
    return 'Common';
}

// On the client get zone = new Date().getTimezoneOffset()
function localTime(date, zone) {
    let utc = new Date(date);
    let off = zone * 60;
    let res = new Date(utc.getTime() + off);
    return res;
};

function dateLapse(){
    let d0 = new Date();
    let d1 = new Date();
    let d2 = new Date(d0.setDate(d1.getDate()-30));
    return {from:d2.toJSON().substr(0,10), to:d1.toJSON().substr(0,10)};
}

//---- START

async function main(){
    let nowd = new Date();
    console.warn(nowd, 'DaVinci is running on', process.env.NETWORK);
    var settings = await db.getSettings();
    console.log('Settings', settings);
    const app = express();
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(uploader());
    //app.use(express.json()) // Instead of bodyParser since express 4.16
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'html');
    app.engine('html', ejs.renderFile);

    /*
    app.use((req, res, next) => {
        if(!req.secure && req.headers.host.indexOf('localhost')<0){
            console.log('Not secure, redirecting...', req.url);
            res.redirect('https://' + req.headers.host + req.url);
        } else {
            console.log('Next', req.url);
            next();
        }
    })
    */


    app.use(cors());
    //app.options('*', cors());
    app.options('*', cors({
        allowHeaders: ['Origin, X-Requested-With, Content-Type, Accept, DaVinci-User']
    }));

    //res.header('Access-Control-Allow-Origin', '*')  // 'http://localhost' || '*' || req.headers.host
    //res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, DaVinci-User');
    //res.header('Access-Control-Allow-Credentials', true);

    //app.options('*', cors({
    //    origin: 'http://localhost',
    //    preflightContinue: true,
    //    credentials: true
    //}));



    //---- ROUTER

    if(settings.maintenance=='ON'){
        app.get('*', (req, res) => { 
            res.status(200).render('maintenance.html', {config}); // Catch all
        });
    }

    app.get('/', async (req, res) => { 
        try {
            //hit(req.path);
            let lapse = dateLapse();
            lapse = {from:'2021-01-01', to:'2022-12-31'}; // REMOVE
            config.theme = req.cookies.theme || config.theme;
            config.searchbar = 'hidden';
            config.user = req.cookies.user;
            let user = await db.getUser(config.user);
            if(user && !user.error){ config.badge = user.badge; }
            config.limit = parseInt(req.query.limit) || 100;
            config.page  = parseInt(req.query.page)  ||   1;
            let data = await db.getStats();
            let cnt  = await db.countOpenTrades();
            let list = await db.getOpenTrades(config.limit, config.page-1);
            config.last = Math.ceil(cnt/100);
            let colshot = await db.getCollectionsHot(24);
            let colsnew = await db.getCollectionsNew(24);
            let usrshot = await db.getLatestSellers(lapse.from, lapse.to, 24);
            let usrsnew = await db.getLatestVerified(24);
            config.oneusd = await api.getOnePrice();
            let info = {config:config, list:list, data:data, colshot:colshot, colsnew:colsnew, usrshot:usrshot, usrsnew:usrsnew};
            //console.log(info.usrshot);
            res.render('index.html', info);
            config.searchbar = '';
        } catch(ex) {
            console.error(enow(), 'Server error', ex);
            return res.status(500).render('servererror.html', {config:config});
        }
    });

    app.get('/index-v1', async (req, res) => { 
        try {
            //hit(req.path);
            config.theme = req.cookies.theme || config.theme;
            config.searchbar = 'hidden';
            config.user = req.cookies.user;
            let user = await db.getUser(config.user);
            if(user && !user.error){ config.badge = user.badge; }
            let data = await db.getStats();
            config.oneusd = await api.getOnePrice();
            res.render('index-v1.html', {config:config, data:data});
            config.searchbar = '';
        } catch(ex) {
            console.error(enow(), 'Server error', ex);
            return res.status(500).render('servererror.html', {config:config});
        }
    });

    app.get('/artists', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = [];
        let mainArtist = null;
        let artists = await db.getUsersListed();
        if(artists && !artists.error && artists.length>0){
            mainArtist = artists[0];
            list = await db.getArtworksByUser(mainArtist.address, 20, config.user);
        }
        let gold = await db.getGoldenArtists(1000);
        //let most = await db.getUsersActive(20);
        //let topg = await db.getArtworksGolden(config.user, 0, 25);
        //let topv = await db.getArtworksVerified(config.user, 0, 25);
        // Merge golden and verified in one list
        //for (var i = 0; i < topv.length; i++) {
        //    topg.push(topv[i]);
        //}
        //console.warn('List', list);
        //console.warn('Artists', artists);
        config.oneusd = await api.getOnePrice();
        res.render('artists.html', {config:config, list:list, gold:gold}); 
    });

    app.get('/galleries', async (req, res) => { 
        //hit(req.path);
        config.theme   = req.cookies.theme || config.theme;
        config.user    = req.cookies.user;
        config.token   = req.cookies.token;
        config.isAdmin = await isAdmin(config.user, config.token);
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getGalleries();
        //console.warn('Galleries', list);
        config.oneusd = await api.getOnePrice();
        res.render('galleries.html', {config:config, list:list}); 
    });

    app.get('/maintenance', async (req, res) => { 
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('maintenance.html', {config:config});
    });

    app.get('/create', async (req, res) => { 
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        res.render('disabled.html', {config:config});
    });

    app.get('/createXXX', async (req, res) => { 
        //hit(req.path);
        config.theme    = req.cookies.theme || config.theme;
        config.user     = req.cookies.user;
        config.posts    = 0;
        config.badge    = false;
        config.inactive = true;
        config.ismaxed  = true;
        config.reason   = '';
        config.maxprice = 50;
        config.pricetag = 'unverified';
        //console.warn(user)

        let maxpost  = 1;
        let user = await db.getUser(config.user);
        if(user && !user.error){
            if(user.inactive) { 
                config.reason = 'User inactive, can not mint tokens'; 
            } else {
                if(user.verified){ maxpost =  5; config.maxprice =  1000000; config.pricetag = 'verified'; }
                if(user.golden){   maxpost = 10; config.maxprice = 10000000; config.pricetag = 'golden'; }
                //if(user.official){ maxpost = 20; config.maxprice = 5000000; config.pricetag = 'official'; }
                let res = await db.getArtworkCount(config.user);
                if(res && res.count){ 
                    config.posts = res.count; 
                    if(config.posts<maxpost){ 
                        config.inactive = false;
                        config.ismaxed  = false;
                    } else {
                        config.reason = 'NFTs per day are limited to '+maxpost;
                        if(maxpost==1){ config.reason = 'NFTs are limited to 1 per day until verified'; }
                        else if(maxpost==5){ config.reason = 'NFTs are limited to 5 per day'; }
                    }
                } else { 
                    config.reason = 'Error checking daily cap'; 
                }
            }
            config.badge = user.badge;
        } else {
            config.reason = 'Profile not found, please create one or connect your wallet';
        }
        let data = await db.getCollectionsByOwner(config.user);
        config.oneusd = await api.getOnePrice();
        //console.warn('Max', config.posts, config.inactive);
        //console.warn(config.inactive)
        //console.warn('Collections', data);
        res.render('create.html', {config:config, data:data});
    });

    app.get('/timeless', async (req, res) => { 
        hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.posts = 0;
        config.ismaxed  = false;
        config.inactive = false;
        config.reason   = '';
        let user = await db.getUser(config.user);
        //console.warn(user)
        let maxpost = 1;
        if(user && !user.error){
            if(user.verified){ maxpost = 5; }
            if(user.golden){ maxpost = 10; }
            let res = await db.getArtworkCount(config.user);
            if(res && res.count){ config.posts = res.count; }
            config.inactive = user.inactive || config.posts >= maxpost; // No more than 5 posts a day
            if(user.inactive) { config.reason = 'User inactive, can not create tokens'; }
            if(config.posts>maxpost){ config.reason = 'Posts per day are limited to '+maxpost; }
            config.ismaxed  = config.posts >= maxpost; // No more than 5 posts a day
            config.badge = user.badge;
        } else {
            config.inactive = true;
            config.reason = 'Profile not found, please create one or connect your wallet';
        }
        let data = await db.getCollectionsByOwner(config.user);
        config.oneusd = await api.getOnePrice();
        //console.warn('Max', config.posts, config.inactive);
        //console.warn(config.inactive)
        //console.warn('Collections', data);
        res.render('timeless.html', {config:config, data:data});
    });

    app.get('/explore', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        let title    = 'Latest Artworks';
        let filter   = req.query.filter;
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        //console.warn('Filter', filter);
        if(filter){
            let filters = {'nfs':'Not For sale', 'fso':'For Sale Only', 'sal':'Direct Sale', 'auc':'Auctions', 'mvi':'Most Viewed', 'mso':'Most Sold', 'mex':'Most Expensive', 'lex':'Less expensive'};
            title = filters[filter];
            if(!title){ title = 'Latest Artworks'; }
        }
        let page  = 0;
        let limit = 100;
        let topg  = [];
        let topv  = [];
        let list  = [];
        if(filter){
            list = await db.getLatestArtworks(filter, config.user, page, limit);
        } else {
            topg = await db.getArtworksGolden(config.user, 0, 100);
            topv = await db.getArtworksVerified(config.user, 0, 100);
            //list = await db.getArtworksNotVerified(config.user, page, limit);
        }
        //response.set('Cache-Control', 'no-cache, must-revalidate');
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:topg, topv:topv});
    });

    app.get('/explore/:type', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let type  = req.params.type;
        let title = MediaType[type];
        let list  = await db.getArtworksByType(type, 100, config.user);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:[]});
    });

    app.get('/explore/tag/:tag', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let tag   = req.params.tag;
        let title = 'Tag '+tag;
        let list  = await db.getArtworksByTags(tag, 100, config.user);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:[]});
    });

    app.get('/explore/artist/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.tools = true;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let artist   = req.params.address;
        let private  = req.query.private  || false;
        let inactive = req.query.inactive || false;
        let data  = await db.getUser(artist);
        let title = 'Artist: '+(data?data.name:artist.substr(0,10));
        let list  = await db.getArtworksByUser(artist, private, inactive, 1000, config.user);
        //console.warn(list);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:[]});
    });

    app.get('/latest', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        let title    = 'Latest Unverified Artworks';
        let filter   = req.query.filter;
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        //console.warn('Filter', filter);
        if(filter){
            let filters = {'nfs':'Not For sale', 'fso':'For Sale Only', 'sal':'Direct Sale', 'auc':'Auctions', 'mvi':'Most Viewed', 'mso':'Most Sold', 'mex':'Most Expensive', 'lex':'Less expensive'};
            title = filters[filter];
            if(!title){ title = 'Latest Unverified Artworks'; }
        }
        let page  = 0;
        let limit = 200;
        let list  = [];
        if(filter){
            list = await db.getLatestArtworks(filter, config.user, page, limit);
        } else {
            list = await db.getArtworksNotVerified(config.user, page, limit);
        }
        //response.set('Cache-Control', 'no-cache, must-revalidate');
        config.oneusd = await api.getOnePrice();
        res.render('latest.html', {config:config, list:list, title:title});
    });

    app.get('/artist/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.tools = true;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let artist   = decodeURIComponent(req.params.address.toLowerCase());
        let address  = artist;
        let private  = req.query.private  || false;
        let inactive = req.query.inactive || false;
        let data = null;
        if(artist.startsWith('0x') && artist.length==42){
            data = await db.getUser(artist);
        } else {
            data = await db.getUserByLowerName(artist);
            if(data) { address = data.address || artist; }
        }
        //let data  = await db.getUser(artist);
        if(address==config.user){ private = true; inactive = true; }
        let title = 'Artist: '+(data?data.name:artist.substr(0,10));
        let list  = await db.getArtworksByUser(address, private, inactive, 1000, config.user);
        //console.warn(list);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:[]});
    });

    app.get('/explore/collection/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let addr  = req.params.address.toLowerCase();
        let data  = await db.getCollection(addr);
        let title = 'Collection: '+(data?data.name:addr.substr(0,10));
        let list  = await db.getArtworksByCollection(addr, 1000, config.user);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:[]});
    });
    /*
    app.get('/search', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let qry   = req.query.q;
        let title = 'Results for '+q;
        let list  = await db.getArtworksBySearch(qry, 100, config.user);
        let topv  = [];
        res.render('explore.html', {config:config, list:list, title:title, topg:[], topv:topv});
    });
    */
    app.get('/like/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        let adr  = req.params.address;
        config.user = req.cookies.user;
        let like = false;
        if(config.user){ like = await db.likeArtwork(adr, config.user); }
        res.status(200).end(JSON.stringify({like:like}));
    });

    app.get('/view/:address', async (req, res) => { 
        //hit(req.path);
        config.host  = req.hostname;
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        config.isAdmin = await isAdmin(config.user, config.token);
        let adr  = req.params.address;
        let ip   = req.header('x-forwarded-for') || req.connection.remoteAddress;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        //let user = await db.getUser(config.user);
        let item = await db.getArtwork(adr, config.user);
        if(!item || item.error){ res.status(404).render('notfound.html', {config:config}); return; }

        db.viewArtwork(adr, ip);
        let owners = await db.getOwnersByArtwork(adr);
        // Only owners can see unlockcode
        let lock = true;
        for (var i = 0; i < owners.length; i++) {
            if(owners[i].ownerid==config.user){ 
                item.owner = config.user; 
                lock = false;
                let rex = await api.ownerBalance(adr, config.user);
                if(rex.status=='SUCCESS'){ owners[i].available = rex.balance; }
                break; 
            }
        }
        if(lock){ item.unlockcode = ''; }
        item.orderid = null;
        item.lastbid = 0;
        item.bids    = [];
        if(item.saletype==1){
            order = await db.getOrderByArtwork(adr);
            if(order && !order.error){ 
                item.orderid = order.address;
                let bids = await db.getBidsByOrder(order.address);
                if(bids && !bids.error){ 
                    item.bids = bids;
                    if(bids.length > 0){
                        item.lastbid = bids[0].price;
                    }
                }
            }
        }
        let orders    = await db.getOrdersByArtwork(adr);
        let comments  = await db.getCommentsByArtwork(adr);
        config.oneusd = await api.getOnePrice();
        res.render('view.html', {config:config, item:item, owners:owners, orders:orders, comments:comments});
    });

    app.get('/edit/:address', async (req, res) => { 
        //hit(req.path);
        config.host  = req.hostname;
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        config.isAdmin = await isAdmin(config.user, config.token);
        config.oneusd = await api.getOnePrice();
        let adr  = req.params.address;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        else { 
            //console.error(enow(), 'Item edit: user not found', config.user);
            //res.status(404).render('notfound.html', {config:config});
            res.redirect('/view/'+adr);
            return;
        }
        let item = await db.getArtwork(adr, config.user);
        //console.warn('User', config.user)
        if(!item || item.error ){ 
            console.error(enow(), 'Token not found', adr)
            res.status(404).render('notfound.html', {config:config});
            return;
        }

        item.orderid = null;
        item.lastbid = 0;
        item.bids    = [];
        if(item.saletype==1){
            order = await db.getOrderByArtwork(adr);
            if(order && !order.error){ 
                item.orderid = order.address;
                let bids = await db.getBidsByOrder(order.address);
                if(bids && !bids.error){ 
                    item.bids = bids;
                    if(bids.length > 0){
                        item.lastbid = bids[0].price;
                    }
                }
            }
        }

        let owners = [];
        let list = await db.getOwnersByArtwork(adr);
        if(list && !list.error){ owners = list; }
        let comments = await db.getCommentsByArtwork(adr);
        if(!comments || comments.error){ comments=[]; }
        //console.warn('Creator', item.creator)
        if(item.creator==config.user){
            //console.warn('Original', adr)
            item.original = true;
            res.render('edit.html', {config:config, item:item, owners:owners, comments:comments}); // edit original
            return;
        }
        let copy = await db.getArtworkByOwner(adr, config.user);
        //console.warn('Owner', copy);
        if(!copy || copy.error ){ 
            //console.warn('No copy found', adr)
            item.unlockcode = '';
            //res.render('view.html', {config:config, item:item, owners:owners, comments:comments});
            res.redirect('/view/'+adr);
            return;
        }
        if(copy.owner==config.user){
            //console.warn('Copy', adr)
            copy.original = false;
            let rex = await api.ownerBalance(adr, config.user);
            if(rex.status=='SUCCESS'){ copy.available = rex.balance; }
            res.render('edit.html', {config:config, item:copy, owners:owners, comments:comments}); // edit copy
            return;
        }
        item.unlockcode = '';
        //console.warn('View', adr)
        //res.render('view.html', {config:config, item:item, owners:owners, comments:comments}); // Edit link, send as view
        res.redirect('/view/'+adr);
        return;
    });
/*
    app.get('/market-old', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        config.limit = parseInt(req.query.limit) || 100;
        config.page  = parseInt(req.query.page)  ||   1;
        let cnt  = await db.countOpenTrades();
        let list = await db.getOpenTrades(config.limit, config.page-1);
        config.last = Math.ceil(cnt/100);
        //console.warn('Count', cnt);
        //console.warn('Page',  config.page);
        //console.warn('Last',  config.last);
        //console.warn('Limit', config.limit);
        //console.warn('Trades', list)
        config.oneusd = await api.getOnePrice();
        //console.warn('ONE/USD', config.oneusd)
        res.render('market.html', {config:config, list:list}); 
    });
*/
    app.get('/market', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        config.limit = parseInt(req.query.limit) || 100;
        config.page  = parseInt(req.query.page)  ||   1;
        let cnt  = await db.countOpenTrades();
        let list = await db.getOpenTrades(config.limit, config.page-1);
        config.last = Math.ceil(cnt/100);
        ///let colsdav = await db.getDavinciCollections(process.env.OPERATOR);
        let colshot = await db.getCollectionsHot(24);
        let colsnew = await db.getCollectionsNew(24);
        //console.warn('COLSDAV', colsdav)
        config.oneusd = await api.getOnePrice();
        //console.warn('ONE/USD', config.oneusd)
        res.render('market.html', {config:config, list:list, colshot:colshot, colsnew:colsnew}); 
    });

    app.get('/collection/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        config.limit = parseInt(req.query.limit) || 1000;
        config.page  = parseInt(req.query.page)  ||    1;
        let adr  = req.params.address;
        let coll = await db.getCollection(adr);
        let list = await db.getOpenTradesByCollection(adr, config.limit, config.page-1);
        config.oneusd = await api.getOnePrice();
        //console.warn('ONE/USD', config.oneusd)
        res.render('collection.html', {config:config, collid: adr, coll: coll, list:list}); 
    });

    app.get('/resell/:artwork', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getOpenTradesByArtwork(req.params.artwork);
        //console.warn('Trades', list)
        config.oneusd = await api.getOnePrice();
        //console.warn('ONE/USD', config.oneusd)
        res.render('resell.html', {config:config, list:list, parent:0}); 
    });

    app.get('/order/:address', async (req, res) => { 
        //hit(req.path);
        config.host  = req.hostname;
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        config.isAdmin = await isAdmin(config.user, config.token);
        //let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        //let user = await db.getUser(config.user);
        let order = await db.getOrderByAddress(req.params.address);
        if(!order || order.error){ res.status(404).render('notfound.html', {config:config}); return; }
        let artwork = order.artwork;
        let item = await db.getArtwork(artwork, config.user);
        if(!item || item.error){ res.status(404).render('notfound.html', {config:config}); return; }
        let owners = await db.getOwnersByArtwork(artwork);
        // Only owners can see unlockcode
        let lock = true;
        for (var i = 0; i < owners.length; i++) {
            if(owners[i].ownerid==config.user){ item.owner = config.user; lock = false; break; }
        }
        if(lock){ item.unlockcode = ''; }
        item.orderid = order.address;
        item.lastbid = 0;
        item.bids    = [];
        if(order.ordertype==1){
            let bids = await db.getBidsByOrder(order.address);
            if(bids && !bids.error){ 
                item.bids = bids;
                if(bids.length > 0){
                    item.lastbid = bids[0].price;
                }
            }
        }
        let orders    = await db.getOrdersByArtwork(artwork);
        let comments  = await db.getCommentsByArtwork(artwork);
        config.oneusd = await api.getOnePrice();
        res.render('order.html', {config:config, item:item, owners:owners, order:order, orders:orders, comments:comments});
    });


    app.get('/collect', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        res.render('todo.html', {config:config}); 
    });

    app.get('/follow', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        res.render('todo.html', {config:config}); 
    });

    app.get('/profile', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user = req.cookies.user;
        //console.warn('User cookie', config.user);
        let user = await db.getUser(config.user);
        if(!user || user.error){ user = {address:'0x0', name: 'Not found', avatar: 'nopic.png', edit: false}; }
        else { user.edit = true; config.badge = user.badge; }
        // User stats
        let stats = await db.getUserStats(config.user);
        //console.warn('Stats', stats);
        user.earnqty = stats.earnqty || 0;
        user.earntot = stats.earntot || 0;
        user.earnavg = (stats.earntot / stats.earnqty) || 0;
        user.earnlst = stats.earnlst || 0;
        user.earndat = stats.earndat || 0;
        user.expnqty = stats.expnqty || 0;
        user.expntot = stats.expntot || 0;
        user.expnavg = (stats.expntot / stats.expnqty) || 0;
        user.expnlst = stats.expnlst || 0;
        user.expndat = stats.expndat || 0;
        user.collect = stats.collect || 0;
        user.mintqty = stats.minted  || 0;
        user.mintcst = user.mintqty * 0.001; // USD
        user.mintsec = user.mintqty * 2;     // secs
        user.mintsav = user.mintqty * 70;    // USD
        user.minttim = user.mintqty * 15;    // mins
        user.mintcok = user.mintqty * 48;    // CO2
        res.render('profile.html', {config:config, item:user});
    });

    app.get('/profile/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        let pid  = decodeURIComponent(req.params.address.toLowerCase());
        //console.warn('User', pid);
        let user = null;
        if(pid.startsWith('0x') && pid.length==42){
            user = await db.getUser(pid);
        } else {
            user = await db.getUserByLowerName(pid);
        }
        if(!user || user.error){ user = {address:'0x0', name: null, avatar: 'nopic.png', missing:true, badge:0, inactive:false}; }
        let admin = await isAdmin(config.user, config.token);
        if(user.inactive && !admin){
            res.status(404).render('notfound.html', {config:config});
            return;
        }
        let stats = await db.getUserStats(user.address);
        //console.warn('Stats', stats);
        user.edit = false;
        user.earnqty = stats.earnqty || 0;
        user.earntot = stats.earntot || 0;
        user.earnavg = (stats.earntot / stats.earnqty) || 0;
        user.earnlst = stats.earnlst || 0;
        user.earndat = stats.earndat || 0;
        user.expnqty = stats.expnqty || 0;
        user.expntot = stats.expntot || 0;
        user.expnavg = (stats.expntot / stats.expnqty) || 0;
        user.expnlst = stats.expnlst || 0;
        user.expndat = stats.expndat || 0;
        user.collect = stats.collect || 0;
        user.mintqty = stats.minted  || 0;
        user.mintcst = user.mintqty * 0.001; // USD
        user.mintsec = user.mintqty * 2;     // secs
        user.mintsav = user.mintqty * 70;    // USD
        user.minttim = user.mintqty * 15;    // mins
        user.mintcok = user.mintqty * 48;    // CO2
        config.badge = user.badge;
        //console.warn('User', user);
        res.render('profile-view.html', {config:config, item:user});
    });

    app.get('/mycreations', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.limit = req.query.limit || 100;
        config.page  = req.query.page  ||   0;
        let user = await db.getUser(config.user);
        let list = await db.getArtworksBySelf(config.user, config.user, config.limit, config.page);
        let cols = await db.getCollectionsByUser(config.user);
        if(!user || user.error){ user = {name:config.user, badge:0}; }
        config.badge = user.badge;
        //console.warn('Collections', cols);
        config.oneusd = await api.getOnePrice();
        res.render('mycreations.html', {config:config, list:list, cols:cols, user:user});
    });

    app.get('/mycollection', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.limit = req.query.limit || 100;
        config.page  = req.query.page  ||   0;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getArtworksByOwner(config.user, config.user, config.limit, config.page);
        //console.warn('List', list)
        config.oneusd = await api.getOnePrice();
        res.render('mycollection.html', {config:config, list:list});
    });

    app.get('/mycollection/:address', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        config.limit = req.query.limit || 100;
        config.page  = req.query.page  ||   0;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let addr = req.params.address.toLowerCase();
        if(addr.startsWith('0x') && addr.length==42){ } else { 
            let rec = await db.getUserByLowerName(addr);
            if(!rec || rec.error){ 
                console.error(enow(), 'Mycollection: user not found', addr);
                res.status(404).end(JSON.stringify({error:'User not found'})); 
                return;
            }
            addr = rec.address;
        }
        let list = await db.getArtworksByOwner(addr, config.user, config.limit, config.page);
        //console.warn('List', list)
        config.oneusd = await api.getOnePrice();
        res.render('mycollection.html', {config:config, list:list});
    });

    app.get('/comments', async (req, res) => { 
        config.user = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getComments();
        res.render('comments.html', {config:config, list:list}); 
    });

    app.get('/activity', async (req, res) => { 
        config.user = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getActivityByUser(config.user);
        let read = await db.readActivity(config.user);
        res.render('activity.html', {config:config, list:list}); 
    });

    app.get('/settings', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('todo.html', {config:config}); 
    });

    app.get('/vinci', async (req, res) => { 
        //hit(req.path);
        config.theme  = req.cookies.theme || config.theme;
        config.user   = req.cookies.user;
        config.oneusd = await api.getOnePrice();
        let user = await db.getUser(config.user);
        let list = [];
        config.unlock = 0;
        if(user && !user.error){ 
            config.badge = user.badge; 
            list = await db.getVincisLocked(config.user)
            config.unlock = await db.getVincisToUnlock(config.user);
        }
        res.render('vinci.html', {config:config, list:list});
    });

    app.get('/vinci/stats', async (req, res) => { 
        //hit(req.path);
        let stats = await api.getVinciStats();
        console.warn('VINCI', stats);
        res.header('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(stats)); 
    });


    app.get('/vinci/swaps', async (req, res) => { 
        //hit(req.path);
        let lmt = req.query.limit||100;
        let amt = req.query.amount||1000;
        config.theme  = req.cookies.theme || config.theme;
        config.user   = req.cookies.user;
        config.oneusd = await api.getOnePrice();
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let lsto = null;
        let lsti = null;
        let info = await api.getVinciSwaps(lmt, amt);
        let infi = await api.getVinciSwapsIn(lmt, amt);
        if(info){ lsto = info?.data?.swaps; }
        if(infi){ lsti = infi?.data?.swaps; }
        //console.warn('VINCI', info);
        res.render('swaps.html', {config:config, lsto:lsto, lsti:lsti});
    });

    app.get('/vinci/unlock/:txid', async (req, res) => {
        config.user = req.cookies.user;
        let txid    = req.params.txid;
        console.warn('Unlock', config.user, txid);
        if(!config.user){
            const result = {status:false, error:'invalid user', unlocked:0};
            console.warn('Result', result);
            res.status(200).send(JSON.stringify(result));
            return;
        }
        let rsp = await api.unlockVincis(config.user, txid);
        console.warn('Unlocked', rsp.amount||0);
        let result = {status:false, error:'unknown error', unlocked:0};
        if(rsp.error){
            result = {status:false, error:rsp.error, unlocked:0};
        } else {
            result = {status:true, unlocked:rsp.amount, txid:rsp.txid};
        }
        console.warn('Result', result);
        res.status(200).send(JSON.stringify(result));
    });

    app.get('/exchange', async (req, res) => { 
        //hit(req.path);
        config.theme  = req.cookies.theme || config.theme;
        config.user   = req.cookies.user;
        config.oneusd = await api.getOnePrice();
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('exchange.html', {config:config}); 
    });

    app.get('/terms', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('terms.html', {config:config}); 
    });

    app.get('/privacy', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('privacy.html', {config:config}); 
    });

    app.get('/swap', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('todo.html', {config:config}); 
    });

    app.get('/stake', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('todo.html', {config:config}); 
    });

    app.get('/myvinci', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        res.render('todo.html', {config:config}); 
    });

    app.get('/governance', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getLatestProposals();
        //let list = null;
        //console.writeHeadn('List', list)
        res.render('governance.html', {config:config, list:list}); 
    });

    app.get('/governance/:status', async (req, res) => { 
        //hit(req.path);
        config.theme  = req.cookies.theme || config.theme;
        config.user   = req.cookies.user;
        config.status = req.params.status.toLowerCase();
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let nstatus = ['draft','rejected','active','closed'].indexOf(config.status);
        let list = [];
        if(nstatus<0){ 
            config.status = 'all';
            list = await db.getLatestProposals();
        } else {
            list = await db.getProposalsByStatus(nstatus);
        }
        //let list = null;
        //console.writeHeadn('List', list)
        res.render('governance.html', {config:config, list:list}); 
    });

    app.get('/proposal', async (req, res) => { 
        //hit(req.path);
        config.theme  = req.cookies.theme || config.theme;
        config.user   = req.cookies.user;
        config.name   = 'Anonymous';
        config.action = 'new';
        if(!config.user){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
        }
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; config.name = user.name || 'Anonymous'; }
        let recs = await db.getLatestProposals(0, 1);
        let nextid = 0;
        if(recs.length>0) { nextid = recs[0].govid; }
        let inidate = new Date();
        let enddate = new Date();
        enddate = (new Date(enddate.setDate(enddate.getDate() + 10))); // Ten days from now
        let item = { action:'new', govid:nextid, address:'', created:0, author:config.user, name: config.name, title:'', details:'', link:'', inidate:inidate, enddate:enddate, quorum:100 };
        //console.warn('Item', item);
        res.render('proposal.html', {config:config, item:item}); 
    });

    app.get('/proposal/:address', async (req, res) => { 
        //hit(req.path);
        config.theme   = req.cookies.theme || config.theme;
        config.user    = req.cookies.user;
        config.token   = req.cookies.token;
        config.voted   = false;
        config.isAdmin = await isAdmin(config.user, config.token);
        let item = await db.getProposal(req.params.address);
        if(!item || item.error){ res.status(404).render('notfound.html', {config:config}); return; }
        if(item.status < 3 && new Date(item.enddate) < new Date()){ 
            //console.warn('Close proposal', item.govid);
            db.modProposal({govid:item.govid,status:3}); 
            item.status = 3;
        }
        item.action = 'view';
        let user = await db.getUser(config.user);
        if(user && !user.error){ 
            config.badge = user.badge;
            if(user.address == item.author){ 
                item.action = 'edit';
            }
        }
        let vote = await db.checkVote(item.govid, config.user);
        if(vote && !vote.error && vote>0){ 
            config.voted = true;
            item.voted = true;
        }
        let list = await db.getLatestVotes(item.govid);
        let tally = null;
        if(item.status==3){
            tally = await db.tallyVotes(item.govid);
        }
        //console.warn('Config', config);
        //console.warn('Item', item);
        res.render('proposal.html', {config:config, item:item, list:list, tally:tally}); 
    });

    app.get('/graphics',  async (req, res) => { showCategory(req, res, 0) });
    app.get('/paintings', async (req, res) => { showCategory(req, res, 1) });
    app.get('/photos',    async (req, res) => { showCategory(req, res, 2) });
    app.get('/kids',      async (req, res) => { showCategory(req, res, 3) });
    app.get('/memes',     async (req, res) => { showCategory(req, res, 8) });
    app.get('/private',   async (req, res) => { showCategory(req, res, 9) });

    async function showCategory(req, res, cat) {
        //hit(req.path);
        config.user  = req.cookies.user;
        config.tools = false;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let title = ['Digital Art', 'Paintings', 'Photos', 'Kids', '', '', '', '', 'Memes', 'Private Gallery'][cat];
        let filter  = req.query.filter;
        //console.warn('Filter', filter);
        if(filter){
            let filters = {'nfs':'Not For sale', 'fso':'For Sale Only', 'sal':'Direct Sale', 'auc':'Auctions', 'mvi':'Most Viewed', 'mso':'Most Sold', 'mex':'Most Expensive', 'lex':'Less expensive'};
            title = filters[filter];
            if(!title){ title = 'Latest Artworks'; }
        } else {
            filter = ''
        }
        let page  = 0;
        let limit = 100;
        let list = await db.getArtworksByCategory(cat, filter, config.user, page, limit);
        //console.warn('list', list);
        config.oneusd = await api.getOnePrice();
        res.render('explore.html', {config:config, list:list, title:title, user:config.user, topg:[], topv:[]});
    }

    /*
    app.get('/private', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user = req.cookies.user;
        let title = 'Private collection';
        let filter  = req.query.filter;
        //console.warn('Filter', filter);
        if(filter){
            let filters = {'nfs':'Not For sale', 'fso':'For Sale Only', 'sal':'Direct Sale', 'auc':'Auctions', 'mvi':'Most Viewed', 'mso':'Most Sold', 'mex':'Most Expensive', 'lex':'Less expensive'};
            title = filters[filter];
            if(!title){ title = 'Private Collection'; }
        } else {
            filter = ''
        }
        let page  = 0;
        let limit = 100;
        let list = await db.getLatestAdultContent(filter, config.user, page, limit);
        //console.warn('list', list);
        res.render('explore.html', {config:config, list:list, title:title, user:config.user}); 
    });
    */

    app.post('/collection/new', async (req, res) => { 
        //hit(req.path);
        //console.warn('FORM', req.body);
        let rec = req.body;
        let rex = await db.saveCollection(rec);
        res.status(200).end(JSON.stringify(rex));
    });

    app.post('/token/new', async (req, res) => { 
        hit(req.path);
        //console.warn('FORM', req.body);
        let rex;
        let rec = req.body;
        let uid = req.cookies.user;
        if(!uid) { uid = req.headers['davinci-user']; }
        //console.warn('UID', uid);
        if(!uid){
            console.warn('Token New: user address is required')
            res.status(400).send(JSON.stringify({error:'User address is required'})); 
            return; 
        }
        if(uid!=rec.creator){ 
            console.warn('Token New: user address and creator must match')
            res.status(400).send(JSON.stringify({error:'User address and creator must match'})); 
            return; 
        }
        let cap = await api.getPostCount(uid);
        //console.warn('Cap', cap);
        if(!cap || cap.error){ 
            if(cap.error){
                rex = {error:cap.error}; 
            } else {
                rex = {error:'Error getting daily post limit'}; 
            }
            res.status(200).end(JSON.stringify(rex));
            return;
        }
        if(cap.inactive){ 
            rex = {error:cap.reason};
        } else { 
            rex = await db.saveArtwork(rec); 
        }
        res.status(200).end(JSON.stringify(rex));
    });

    app.post('/token/metadata', async (req, res) => { 
        hit(req.path);
        //console.warn('META', req.body);
        let meta = {};
        for(key in req.body){
            meta[key] = req.body[key];
        }
        // Upload to IPFS
        let hash = await ipfs.upload(JSON.stringify(meta));
        if(!hash) { 
            console.error(enow(), 'Error uploading to IPFS');
            return res.status(500).send(JSON.stringify({error:'Error uploading file to IPFS'})); 
        }
        res.status(200).end(JSON.stringify({hash:hash}));
    });

    app.post('/token/upload', async (req, res) => { 
        hit(req.path);
        //console.warn('Headers', req.headers);
        //console.warn('Cookies', req.cookies);
        //console.warn('Url', req.url);
        //console.warn('Host', req.headers.host);
        //console.warn('Origin', req.headers.origin);
        //console.warn('XUser', req.headers.xuser);
        //console.warn('User', req.headers['davinci-user']);
        let uid = req.cookies.user;
        if(!uid) { uid = req.headers['davinci-user']; }
        //console.warn('UID', uid);
        if(!uid){
            console.warn('Upload: user address is required')
            res.status(400).send(JSON.stringify({error:'User address is required'})); 
            return; 
        }
        let cap = await api.getPostCount(uid);
        //console.warn('Cap', cap);
        if(!cap || cap.error){ 
            res.status(400).send(JSON.stringify({error:'Error getting daily post limit'})); 
            return; 
        }
        if(cap.inactive){ 
            res.status(400).send(JSON.stringify({error:cap.reason})); 
            return; 
        }
    //res.status(200).send(JSON.stringify({status:'OK', hash:'123'})); 
    //return; 

        try {
            if (!req.files || !req.files.file) { return res.status(400).send(JSON.stringify({error:'No files uploaded'})); }
            let fileToken = req.files.file;
            //console.warn('File', req.files.file);
            if(!req.files.file.name){ return res.status(400).send(JSON.stringify({error:'No token files uploaded'})); }
            let fileName  = req.files.file.name;
            //console.warn('File name', req.files.file.name)

            // Upload to IPFS
            let hash = await ipfs.upload(fileToken.data);
            if(!hash) { 
                console.error(enow(), 'Error uploading to IPFS');
                res.status(500).send(JSON.stringify({error:'Error uploading file to IPFS'}));
                return;
            }

            let folder = path.join(__dirname, 'public/uploads/artwork/');
            let filePath = folder+hash;
            //console.warn('Body', req.body);
            //console.warn('Media', req.body.media);
            if(req.body.media=='image'){
                //console.warn('Uploading image')
                fileToken.mv(filePath, function(err) {
                    if (err) { return res.status(500).send(JSON.stringify({error:err})); }
                    let coverType = fileToken.mimetype;
                    //console.warn('EXT', coverType);
                    // Make cover
                    //console.warn('Cover for', fileName, coverType);
                    let cover = path.join(__dirname, 'public/uploads/artwork/'+hash);
                    coverit(filePath, cover);
                    //console.warn('Cover created');
                    // Make thumb
                    if(coverType=='image/jpg'||coverType=='image/jpeg'||coverType=='image/png'||coverType=='image/gif'){
                        //console.warn('Thumbnail for', fileName, coverType);
                        let thumb = path.join(__dirname, 'public/uploads/thumbs/'+hash);
                        thumbit(filePath, thumb);
                        //console.warn('Thumb created');
                    } else {
                        console.error(enow(), 'No thumbnail for file type', coverType);
                    }
                });
            } else {
                if(req.files.cover){
                    //console.warn('Uploading cover')
                    //console.warn('COVER', req.files.cover);
                    let fileCover = req.files.cover;
                    let coverName = req.files.cover.name;
                    let coverType = fileCover.mimetype;
                    fileCover.mv(filePath, function(err) {
                        if (err) { return res.status(500).send(JSON.stringify({error:err})); }
                        // Make thumb
                        if(coverType=='image/jpg'||coverType=='image/jpeg'||coverType=='image/png'||coverType=='image/gif'){
                            //console.warn('Thumbnail for', coverName, coverType);
                            let thumb = path.join(__dirname, 'public/uploads/thumbs/'+hash);
                            thumbit(filePath, thumb);
                            //console.warn('Thumb created');
                        } else {
                            console.error(enow(), 'No thumbnail for file type', coverType);
                        }
                        // Make cover
                        //console.warn('Cover for', coverName, coverType);
                        let cover = path.join(__dirname, 'public/uploads/artwork/'+hash);
                        coverit(filePath, cover);
                        //console.warn('Cover created');
                    });
                }
            }
            //console.warn('Uploaded');
            //res.status(200).end(JSON.stringify({hash:'123456'}));
            //return;
            res.status(200).end(JSON.stringify({hash:hash}));
        } catch(ex) {
            console.error(enow(), 'Upload error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.post('/extra/upload', async (req, res) => { 
        //hit(req.path);
        try {
            if (!req.files || !req.files.file) { return res.status(400).send(JSON.stringify({error:'No files uploaded'})); }
            let fileToken = req.files.file;
            //console.warn('File', req.files.file);
            if(!req.files.file.name){ return res.status(400).send(JSON.stringify({error:'No token files uploaded'})); }
            let fileName  = req.files.file.name;
            //console.warn('File name', req.files.file.name)

            // Upload to IPFS
            let hash = await ipfs.upload(fileToken.data);
            if(!hash) { 
                console.error(enow(), 'Error uploading to IPFS');
                return res.status(500).send(JSON.stringify({error:'Error uploading file to IPFS'})); 
            }

            let folder = path.join(__dirname, 'public/uploads/artwork/');
            let filePath = folder+hash;
            //console.warn('Body', req.body);
            //console.warn('Media', req.body.media);
            //console.warn('Uploading file');
            fileToken.mv(filePath, function(err) {
                if (err) { return res.status(500).send(JSON.stringify({error:err})); }
                let fileType = fileToken.mimetype;
                //console.warn('EXT', fileType);
            });
            //console.warn('Uploaded');
            res.status(200).end(JSON.stringify({hash:hash}));
        } catch(ex) {
            console.error(enow(), 'Upload error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.post('/token/fetch', async (req, res) => { 
        //hit(req.path);
        //console.warn('Fetch', req.body);
        if (!req.body.file) { return res.status(400).send(JSON.stringify({error:'No file to fetch'})); }

        try {
            let address = req.body.address;
            let source  = req.body.file;
            let target  = path.join(__dirname, 'public/uploads/artwork/') + address;
            //console.warn('Source', source);
            //console.warn('Target', target);
            let ok = await fetchFile(source, target);
            if(!ok) { return res.status(500).send(JSON.stringify({error:'Error fetching image file'})); }

            // Upload to IPFS
            let hash = await ipfs.upload(target);
            if(!hash) { 
                console.error(enow(), 'Error uploading to IPFS');
                return res.status(500).send(JSON.stringify({error:'Error uploading file to IPFS'})); 
            }

            // Thumbnail
            //console.warn('Thumbnail for', target);
            let thumb = path.join(__dirname, 'public/uploads/thumbs/'+hash);
            thumbit(target, thumb);
            //console.warn('Thumb created');

            // Make cover
            //console.warn('Cover for', target);
            let cover = path.join(__dirname, 'public/uploads/artwork/'+hash);
            coverit(target, cover);
            //console.warn('Cover created');
            
            // Delete target
            //fs.unlink(target, console.error);

            res.status(200).end(JSON.stringify({hash:hash}));
        } catch(ex) {
            console.error(enow(), 'Fetch image error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.get('/faq', async (req, res) => { 
        res.redirect('https://davinci-how-it-work.notion.site/davinci-how-it-work/daVinci-gallery-FAQ-b1064d650e9e48089ebfdcaddd821f67');
    });






    //---- API

    app.get('/api/config', async (req, res) => { 
        let cfg = await db.getSettings();
        res.status(200).send(JSON.stringify(cfg));
    });


    app.get('/api/closeorder/:orderid', async (req, res) => { 
        hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let oid = req.params.orderid;
        let ok  = await db.modOrder({orderid:oid, status:2});
        res.status(200).end(JSON.stringify({status:ok})); 
    });

    app.get('/api/cancelorder/:artwork', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(!user || user.error){ 
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        config.badge = user.badge;
        let order = await db.getOpenOrderByOwner(req.params.artwork, config.user);
        if(!order || order.error){
            res.status(200).end(JSON.stringify({error:'Order not found'})); 
            return
        }
        let data = await api.cancelOrder(order.address);
        //console.warn('Cancel data:', data);
        if(data.status=='CONFIRMED'){ 
            // Cancel order in database
            let rec = {orderid:order.orderid, status: 2};
            let res = await db.modOrder(rec);
            console.warn('DB Cancel order', res);
        }
        res.status(200).end(JSON.stringify(data)); 
    });


    app.post('/api/proposal', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let data = await db.newProposal(req.body);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.put('/api/proposal', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let data = await db.modProposal(req.body);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.post('/api/vote', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let vote = await db.checkVote(req.body.govid, req.body.voter);
        if(vote && !vote.error && vote>0){ 
            res.status(200).send(JSON.stringify( {error: 'You already voted'} )); 
            return;
        }
        let data = await db.newVote(req.body);
        //console.warn('Data', data);
        if(data && !data.error){
            let info = await db.tallyVotes(req.body.govid);
            //console.warn('Info', info);
            res.status(200).send(JSON.stringify(info)); 
        } else {
            res.status(200).send(JSON.stringify(data)); 
        }
    });

    app.get('/api/tally/:govid', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let info = await db.tallyVotes(req.params.govid);
        //console.warn('Info', info);
        res.status(200).send(JSON.stringify(info)); 
    });









    //---- API

    app.get('/api/artwork/:address', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let item = await db.getArtwork(req.params.address, config.user);
        if(!item || item.error){ res.status(200).end(JSON.stringify({error:'Item not found'})); return; }
        item.orderid = null;
        item.lastbid = 0;
        item.bids = [];
        if(item.saletype==1){
            order = await db.getOrderByArtwork(req.params.address);
            if(order && !order.error){ 
                item.orderid = order.address;
                let bids = await db.getBidsByOrder(order.address);
                if(bids && !bids.error){ 
                    item.bids = bids;
                    if(bids.length > 0){
                        item.lastbid = bids[0].price;
                    }
                }
            }
        }
        res.status(200).send(JSON.stringify(item));
    });

    app.post('/api/artwork', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.modArtwork(req.body);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/artworks/:page', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let limit = 100;
        let list  = await db.getArtworksByPage(config.user, req.params.page, limit);
        //res.status(200).send(JSON.stringify(data));
        config.oneusd = await api.getOnePrice();
        res.render('explore-page.html', {config:config, list:list}); 
    });

    app.get('/api/checkartwork/:contract/:tokenid', async (req, res) => { 
        //hit(req.path);
        let data = await db.checkArtwork(req.params.contract, req.params.tokenid);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/checkowner/:contract/:tokenid/:owner', async (req, res) => { 
        //hit(req.path);
        let data = await db.checkOwner(req.params.contract, req.params.tokenid, req.params.owner);
        res.status(200).send(JSON.stringify(data));
    });

    app.post('/api/changeowner', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let info = req.body;
        let data = await db.changeOwner(info);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/lastowner/:collection/:tokenid', async (req, res) => { 
        hit(req.path);
        let data = await api.getLastOwner(req.params.collection, req.params.tokenid);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/categorize/:address/:category', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.changeCategory(req.params.address, req.params.category);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/porn/:address', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let data = await db.changeCategory(req.params.address, 9);
        res.status(200).send('Marked as inappropriate');
    });

    app.post('/api/saveowner', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.saveOwnership(req.body);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data));
    });

    app.post('/api/resellowner', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.resellOwnership(req.body);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data));
    });

    /*
    app.get('/api/buy/:address', async (req, res) => { 
        //hit(req.path);
        let address = req.params.tokenid;
        config.user  = req.cookies.user;
        let data  = await api.buyArtwork(address, config.user);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data));
    });
    */
    app.get('/api/counter/:address', async (req, res) => { 
        //hit(req.path);
        let data = await api.tokenBalance(req.params.address);
        //console.warn('Counter', data);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/countresell/:artwork/:ownerid', async (req, res) => { 
        //hit(req.path);
        let data = await api.ownerBalance(req.params.artwork, req.params.ownerid);
        //console.warn('Balance', data);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/api/removeowner/:artwork/:ownerid', async (req, res) => { 
        //hit(req.path);
        let data = await db.removeOwner(req.params.artwork, req.params.ownerid);
        console.warn('Removed ownership', req.params.artwork, req.params.ownerid, data);
        res.status(200).send(JSON.stringify(data));
    });

    app.get('/counter/:address', async (req, res) => { 
        //hit(req.path);
        let data = await api.tokenBalance(req.params.address);
        //console.warn('Counter', data);
        res.redirect('/view/'+req.params.address);
    });

    app.get('/api/neworder/:address', async (req, res) => { 
        //hit(req.path);
        let uid = req.cookies.user;
        if(!uid) { uid = req.headers['davinci-user']; }
        //console.warn('UID', uid);
        if(!uid){
            console.warn('Order New: user address is required')
            res.status(400).send(JSON.stringify({error:'User address is required'})); 
            return; 
        }
        let data = await api.newMarketOrder(req.params.address, uid);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.get('/api/newauction/:address', async (req, res) => { 
        hit(req.path);
        let uid = req.cookies.user;
        if(!uid) { uid = req.headers['davinci-user']; }
        //console.warn('UID', uid);
        if(!uid){
            console.warn('Auction New: user address is required')
            res.status(400).send(JSON.stringify({error:'User address is required'})); 
            return; 
        }
        let data = await api.newAuctionOrder(req.params.address, uid);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.post('/api/newresellorder', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let data = await api.newResellOrder(req.body, config.user);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.post('/api/newresellauction', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let data = await api.newResellAuction(config.user);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.post('/api/newbid', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        //console.dir(req.body);
        let data = await db.newBid(req.body);
        console.warn('New bid', data);
        let ok = db.updatePrice(req.body.artwork, req.body.price);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.post('/api/newcomment', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        //console.dir(req.body);
        let data = await db.newComment(req.body);
        console.warn('New comment', data);
        if(data && !data.error){
            let rex = await db.getArtwork(req.body.artwork);
            if(rex && !rex.error){
                let rey = await newActivity('comment', rex.owner, req.body.comment, `/view/${req.body.artwork}#comment-${data.id}`);
                //console.warn('New activity', rey);
            }
        }
        res.status(200).send(JSON.stringify(data)); 
    });

    app.put('/api/comment', async (req, res) => { 
        //hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        //console.dir(req.body);
        let comid = req.body.comid;
        let data = await db.getComment(comid);
        if(!data || data.error){ 
            res.status(404).send(JSON.stringify({error:'Comment not found'})); 
            return;
        }
        let admin = await isAdmin(config.user, config.token);
        if(config.user!=data.userid && !admin){
            res.status(401).send(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let ok = await db.modComment(req.body);
        console.warn('Updated comment', ok);
        if(!ok || ok.error){
            res.status(200).send(JSON.stringify({success:'NO'}));
            return;
        }
        res.status(200).send(JSON.stringify({success:'OK'}));   
    });

    app.get('/api/moderate/:comid', async (req, res) => { 
        //hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        //console.dir(req.body);
        let comid = req.params.comid;
        let data = await db.getComment(comid);
        if(!data || data.error){ 
            res.status(404).send(JSON.stringify({error:'Comment not found'})); 
            return;
        }
        let item = await db.getArtwork(data.artwork);
        if(!item || item.error){ 
            res.status(404).send(JSON.stringify({error:'Artwork not found'}));
            return;
        }
        let admin = await isAdmin(config.user, config.token);
        if(config.user==item.owner || admin){
            let ok = await db.modComment({comid:comid, status:2}); // 0.queue 1.ok 2.removed
            console.warn('Moderated comment', ok);
            res.status(200).send(JSON.stringify({success:'OK'}));   
        } else {
            res.status(401).send(JSON.stringify({error:'Unauthorized'})); 
        }
    });

    app.get('/api/username/:address', async (req, res) => { 
        //hit(req.path);
        //config.user = req.cookies.user;
        let name = 'Anonymous';
        let user = await db.getUser(req.params.address);
        if(user && !user.error){ name = user.name; }
        res.status(200).send(JSON.stringify({name: name || 'Anonymous'}));
    });

    app.post('/api/transfer', async (req, res) => { 
        //hit(req.path);
        //config.user = req.cookies.user;
        //console.warn('Xfer', req.body);
        let data = await db.newTransfer(req.body);
        if(req.body.orderid){
            console.warn('Transfer with order', req.body.orderid);
            let order = await db.getOrderByAddress(req.body.orderid);
            if(order && !order.error){
                if(order.amount==1){
                    console.warn('Closing order', req.body.orderid);
                    let ok = await db.modOrder({orderid:order.orderid, status:2});  // Close order
                }
            } else {
                console.error('Transfer order not found', req.body.orderid);
            }
        } else {
            console.warn('Transfer without order for', req.body.artwork);
        }
        //console.warn('Xfer', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.get('/api/orderbyartwork/:address', async (req, res) => { 
        //hit(req.path);
        let data = await db.getOpenOrderByArtwork(req.params.address);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.get('/api/orderbytoken/:collection/:tokenid', async (req, res) => { 
        //hit(req.path);
        let data = await db.getOrderByToken(req.params.collection, req.params.tokenid);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.get('/api/orderbyowner/:artwork/:owner', async (req, res) => { 
        //hit(req.path);
        let data = await db.getOpenOrderByOwner(req.params.artwork, req.params.owner);
        //console.warn('Data', data);
        res.status(200).send(JSON.stringify(data)); 
    });

    app.get('/api/user/:address', async (req, res) => { 
        let user = await db.getUser(req.params.address);
        //if(!user || user.error){ 
        //  user = { name: 'Anonymous', avatar:'' };
        //}
        res.status(200).send(JSON.stringify(user));
    });

    app.post('/api/user', async (req, res) => { 
        //hit(req.path);
        let item = null, ok = false;
        config.user = req.cookies.user;
        let data = req.body;
        let hash = req.body.address.substr(2,10);
        data.avatar = hash;
        console.warn('User cookie', config.user);
        //console.warn('User data', data);
        if(config.user!=data.address){ 
            item = {error:'Unauthorized'}; 
        } else {
            item = await db.getUser(config.user);
            if(!item || item.error){ 
                //item = {error: 'User not found'};
                ok = await db.newUser(data);
                if(ok){ item = {status:'OK'}; }
                else { item = {error:'Could not save user info'}; }
            } else {
                ok = await db.modUser(data);
                if(ok){ item = {status:'OK'}; }
                else { item = {error:'Could not update user info'}; }
            }
        }
        if(item.status=='OK'){
            try {
                //console.warn('FILES', req.files);
                if (req.files && req.files.file) { 
                    //console.warn('FILE', req.files.file);
                    console.warn('File name', req.files.file.name)
                    let avatar = req.files.file;
                    let fileName  = req.files.file.name;
                    if(!fileName){ console.error(enow(), 'No token files uploaded'); }
                    else {
                        let folder = path.join(__dirname, 'public/uploads/avatars/');
                        let filePath = folder+hash;
                        console.warn('Uploading avatar')
                        avatar.mv(filePath, function(err) {
                            if (err) { console.error(enow(), 'Error uploading avatar', err); }
                            else { console.warn('Avatar uploaded', hash); }
                        });
                    }
                } else {
                    console.warn(now(), 'No avatar to upload');
                }
            } catch(ex){
                console.error(enow(), 'Error uploading avatar:', ex);
            }
        }
        res.status(200).send(JSON.stringify(item));
    });

    app.get('/api/checkuser/:user', async (req, res) => { 
        //hit(req.path);
        let rec = await db.getUserByLowerName(req.params.user.toLowerCase());
        if(!rec){ 
            res.status(200).send(JSON.stringify({status:'OK'}));
        } else if(rec.error){ 
            console.error(enow(), 'Name error');
            res.status(200).send(JSON.stringify({error:rec.error}));
        } else { 
            res.status(200).send(JSON.stringify({status:'NO', user:rec.address})); 
        }
    });

    app.get('/api/inactive/:address', async (req, res) => { 
        hit(req.path);
        let item = await db.getArtwork(req.params.address);
        if(!item || item.error){
            res.status(404).end(JSON.stringify({error:'Token not found'})); 
            return;
        } 
        if(req.cookies.user!=item.creator){ 
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        db.setArtworkInactive(req.params.address);
        res.status(200).end(JSON.stringify({status:'OK'}));
    });

    app.get('/api/remove/:address', async (req, res) => { 
        hit(req.path);
        let own = req.cookies.user;
        let art = req.params.address;
        let item = await db.getOwnerByArtwork(own, art);
        //let item = await db.getArtwork(req.params.address);
        if(!item || item.error){
            res.status(404).end(JSON.stringify({error:'Token not found'})); 
            return;
        }
        let inf = await db.modOwner({recid:item.recid, available:0});
        if(inf.error){
            res.status(404).end(JSON.stringify({error:inf.error})); 
            return;
        }
        res.status(200).end(JSON.stringify({status:'OK'}));
    });

    app.post('/api/reported', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let rex = await db.newReported(req.body);
        //console.warn('Rex', rex);
        res.status(200).end(JSON.stringify(rex));
    });

    app.get('/api/mycreations', async (req, res) => { 
        //hit(req.path);
        config.user   = req.cookies.user;
        config.limit  = req.query.limit || 100;
        config.page   = req.query.page  ||   0;
        config.oneusd = await api.getOnePrice();
        let list = await db.getArtworksBySelf(config.user, config.user, config.limit, config.page);
        //console.warn('List', list)
        res.render('manage-page.html', {config:config, list:list});
    });

    app.get('/api/creations/:address', async (req, res) => { 
        //hit(req.path);
        //config.user   = req.cookies.user;
        let address  = req.params.address;
        let limit    = req.query.limit    || 100;
        let page     = req.query.page     ||   0;
        let private  = req.query.private  || false;
        let inactive = req.query.inactive || false;
        let data     = await db.getArtworksByUser(address, private, inactive, limit, address);
        //let list = data.map(x => { return {address:x.address}; });
        let list = data.map(x => {return {address:x.address,created:x.created,inactive:x.inactive,type:x.type,creator:x.creator,owner:x.owner,tokenid:x.tokenid,collection:x.collection,colname:x.colname,media:x.media,name:x.name,symbol:x.symbol,description:x.description,tags:x.tags,category:x.category,metadata:x.metadata,resource:x.resource,thumbnail:x.thumbnail,cover:x.cover,copies:x.copies,available:x.available,onsale:x.onsale,saletype:x.saletype,saleprice:x.saleprice,reserve:x.reserve,inidate:x.inidate,enddate:x.enddate,royalties:x.royalties,unlock:x.unlock,likes:x.likes,views:x.views,qty:x.qty,author:x.author,golden:x.golden,verified:x.verified,redflag:x.redflag,ownerx:x.ownerx,ogolden:x.ogolden,overified:x.overified,oredflag:x.oredflag,favorite:x.favorite}});
        //console.warn('Adr', address)
        //console.warn('Prv', private)
        //console.warn('Inc', inactive)
        //console.warn('Lmt', limit)
        //console.warn('Pag', page)
        //console.warn('Lst', list)
        res.status(200).end(JSON.stringify(list,null,4));
    });

    app.get('/api/explore', async (req, res) => { 
        //hit(req.path);
        let limit = req.query.limit || 100;
        let page  = req.query.page  ||   0;
        if(limit>1000){ res.status(500).end(JSON.stringify({error:'Limit can not be greater than 1000'})); return; }
        let list  = await db.apiLatestArtworks(limit, page);
        res.status(200).end(JSON.stringify(list,null,4));
    });

    app.get('/api/mycollection', async (req, res) => { 
        //hit(req.path);
        config.user   = req.cookies.user;
        config.limit  = req.query.limit || 100;
        config.page   = req.query.page  ||   0;
        config.oneusd = await api.getOnePrice();
        //console.warn('- My Collection Page', req.query.page);
        let list = await db.getArtworksByOwner(config.user, config.user, config.limit, config.page);
        //console.warn('- List N', list.length)
        res.render('manage-page.html', {config:config, list:list});
    });

    app.get('/api/mycollection/:address', async (req, res) => { 
        //hit(req.path);
        config.user   = req.cookies.user;
        config.limit  = req.query.limit || 100;
        config.page   = req.query.page  ||   0;
        config.oneusd = await api.getOnePrice();
        //console.warn('- My Collection Page', req.query.page);
        let list = await db.getArtworksByOwner(req.params.address, config.user, config.limit, config.page);
        //console.warn('- List N', list.length)
        res.render('manage-page.html', {config:config, list:list});
    });

    app.get('/api/closeauction/:orderid', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await api.auctionClose(req.params.orderid);
        res.status(200).end(JSON.stringify(data));
    });

    app.post('/api/claimed', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        console.warn('Claiming', req.body);
        let data = await api.auctionClaim(req.body);
        //console.warn('Claimed', data);
        res.status(200).end(JSON.stringify(data));
    });

    app.get('/api/reneged/:bidid', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        console.warn('Reneging', req.params.bidid);
        let data = await api.auctionReneged(req.params.bidid, config.user);
        console.warn('Reneged', data);
        res.status(200).end(JSON.stringify(data));
    });

    /*
    app.post('/api/activity', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let res1 = await db.newActivity(req.body);
        let res2 = await db.updateSocialBadge(config.user);
        res.status(200).end(JSON.stringify(res1));
    });
    */


    async function newActivity(type, userid, activity, reference) {
        let res1 = await db.newActivity({type, userid, activity, reference});
        let res2 = await db.updateSocialBadge(userid);
        return res1;
    }




    //---- ORDERBOOK

    app.get('/api/orderbook/:market', async (req, res) => { 
        //hit(req.path);
        //console.warn('Orderbook', req.params.market);
        let data = await db.getOrderBook(req.params.market);
        //console.warn('- Orderbook', data);
        res.status(200).end(JSON.stringify(data));
    });

    app.post('/api/marketoffer', async (req, res) => { 
        //hit(req.path);
        console.warn('New market offer');
        console.warn('TxId', req.body.txid);
        config.user = req.cookies.user;
        let data = await db.newMarketOffer(req.body);
        //console.warn('Res', data);
        if(data && !data.error) {
            data = await api.fillOrder(data.id);
        }
        res.status(200).end(JSON.stringify(data));
    });

    app.get('/api/tradesopen/:address', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.getOpenOffersByUser(req.params.address);
        res.status(200).end(JSON.stringify(data));
    });

    app.get('/api/tradeshist/:address', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let data = await db.getTradeHistoryByUser(req.params.address);
        res.status(200).end(JSON.stringify(data));
    });

    app.get('/api/canceloffer/:offerid', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user  = req.cookies.user;
        let user = await db.getUser(config.user);
        if(!user || user.error){ 
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let offerid = req.params.offerid;
        let data = await api.cancelOffer(offerid, config.user);
        console.warn('Cancel offer', offerid, data);
        res.status(200).end(JSON.stringify(data));
    });

    app.get('/api/stakereg/:address', async (req, res) => {
        let gld = 'STKS';
        let adr = req.params.address;
        let act = await db.getAccount(adr, gld);
        if(!act){
            let dat = await db.newAccount({address:adr, guild:gld});
            res.status(200).end(JSON.stringify(dat));
            return;
        } else if(act.error){
            res.status(200).end(JSON.stringify({error:act.error}));
            return;
        } else {
            console.warn('Account already exists', adr);
            res.status(200).end(JSON.stringify({error:'Account already registered'}));
        }
    });

    app.get('/api/checkstakereg/:address', async (req, res) => {
        let gld = 'STKS';
        let adr = req.params.address;
        let act = await db.getAccount(adr, gld);
        if(!act){
            res.status(200).end(JSON.stringify({status:'NO'}));
            return;
        } else if(act.error){
            res.status(200).end(JSON.stringify({error:act.error}));
            return;
        } else {
            res.status(200).end(JSON.stringify({status:'OK'}));
        }
    });

    app.get('/api/getvincis/:address', async (req, res) => {
        let adr = req.params.address;
        let bal = await db.getVincisByAddress(adr);
        res.status(200).end(JSON.stringify({address:adr, balance:bal}));
    });

    app.get('/api/getvincis/:guild/:address', async (req, res) => {
        let gld = req.params.guild.toUpperCase();
        let adr = req.params.address;
        let bal = await db.getVincisByAccount(adr, gld);
        let tot = await db.getVincisByGuild(gld);
        let shr = bal/tot || 0.0;
        res.status(200).end(JSON.stringify({address:adr, guild:gld, balance:bal, shares:shr}));
    });


    app.get('/api/ticker', async (req, res) => {
        let tkr = await api.getTicker();
        res.status(200).end(JSON.stringify(tkr));
    });





    //---- CRON JOBS

    app.get('/cron/carve', async (req, res) => { 
        //hit(req.path);
        api.sculptorCarve();
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/cron/brush', async (req, res) => { 
        //hit(req.path);
        api.painterBrush();
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/fndr', async (req, res) => { 
        //hit(req.path);
        bots.botFndr();
        res.status(200).end(JSON.stringify({status:200}));
    });

    //app.get('/bots/team', async (req, res) => { 
    //  //hit(req.path);
    //  bots.botTeam();
    //  res.status(200).end(JSON.stringify({status:200}));
    //});

    app.get('/bots/arts/:dini/:dend', async (req, res) => { 
        //hit(req.path);
        bots.botArts(req.params.dini, req.params.dend);
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/stks', async (req, res) => { 
        //hit(req.path);
        bots.botStks();
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/pool', async (req, res) => { 
        //hit(req.path);
        bots.botPool();
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/gold', async (req, res) => { 
        //hit(req.path);
        bots.botGold();
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/transfer/:num', async (req, res) => { 
        //hit(req.path);
        bots.transferVNL(req.params.num);
        res.status(200).end(JSON.stringify({status:200}));
    });

    app.get('/bots/auto/:num', async (req, res) => { 
        //hit(req.path);
        bots.autoBatch(req.params.num);
        res.status(200).end(JSON.stringify({status:200}));
    });






    //---- ADMIN

    app.get('/inactive/:address', async (req, res) => { 
        //hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){ res.status(200).end(JSON.stringify({error:'Unauthorized'})); return; }
        db.setArtworkInactive(req.params.address);
        res.redirect('/explore');
    });

    app.get('/verified/:address', async (req, res) => { 
        hit(req.path);
        let data = await db.setArtistVerified(req.params.address);
        res.redirect('/profile/'+req.params.address);
    });

    app.get('/unverified/:address', async (req, res) => { 
        hit(req.path);
        let data = await db.setArtistUnverified(req.params.address);
        res.redirect('/profile/'+req.params.address);
    });

    app.get('/redflag/:address', async (req, res) => { 
        hit(req.path);
        let data = await db.setArtistRedflag(req.params.address);
        res.redirect('/profile/'+req.params.address);
    });

    app.get('/unflag/:address', async (req, res) => { 
        hit(req.path);
        let data = await db.setArtistUnflag(req.params.address);
        res.redirect('/profile/'+req.params.address);
    });

    app.get('/reported', async (req, res) => { 
        hit(req.path);
        config.user = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getReportedArtworks();
        //console.warn('list', list);
        res.render('reported.html', {config:config, list:list});
    });

    app.get('/transfers', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        let list = await db.getLatestTransfers();
        //console.warn('Xfer', list);
        res.render('transfers.html', {config:config, list:list});
    });

    app.get('/banuser/:address', async (req, res) => { 
        hit(req.path);
        let data = await db.setArtistInactive(req.params.address);
        res.redirect('/profile/'+req.params.address);
    });



    app.get('/tools/thumb/:img', async (req, res) => { 
        //hit(req.path);
        try {
            let img = req.params.img;
            //console.warn('File', img);
            let file  = path.join(__dirname, 'public/uploads/artwork/'+img);
            let thumb = path.join(__dirname, 'public/uploads/thumbs/'+img);
            thumbit(file, thumb);
            res.status(200).send('<img src="/uploads/thumbs/'+img+'">');
        } catch(ex) {
            console.error(enow(), 'Thumbnail error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.get('/tools/avatars/:img', async (req, res) => { 
        //hit(req.path);
        try {
            let img = req.params.img;
            //console.warn('Avatar', img);
            let file   = path.join(__dirname, 'public/uploads/avatars/'+img);
            let avatar = path.join(__dirname, 'public/uploads/avatars/'+img);
            thumbit(file, avatar);
            res.status(200).end(JSON.stringify({avatar:avatar}));
        } catch(ex) {
            console.error(enow(), 'Avatar error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.get('/tools/cover/:img', async (req, res) => { 
        //hit(req.path);
        try {
            let img = req.params.img;
            //console.warn('File', img);
            let file  = path.join(__dirname, 'public/uploads/artwork/'+img);
            let cover = path.join(__dirname, 'public/uploads/artwork/'+img);
            coverit(file, cover);
            res.status(200).end(JSON.stringify({cover:cover}));
        } catch(ex) {
            console.error(enow(), 'Cover error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.get('/tools/tracker/:address', async (req, res) => { 
        //hit(req.path);
        try {
            config.user  = req.cookies.user;
            config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
            if(!admin){
                res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
                return;
            }
            let user = await db.getUser(config.user);
            if(user && !user.error){ config.badge = user.badge; }
            let address = req.params.address;
            let artwork = await db.getArtwork(address);
            let owners  = await db.getOwnersByArtwork(address);
            let orders  = await db.getOrdersByArtwork(address);
            let bids    = await db.getBidsByAddress(address);
            let xfers   = await db.getTransfersByToken(address);
            let reports = await db.getReportsByArtwork(address);
            res.render('tracker.html', {config:config, item:artwork, owners:owners, orders:orders, bids:bids, xfers:xfers, reports:reports});
        } catch(ex) {
            console.error(enow(), 'Tracker error:', ex);
            res.status(500).end(JSON.stringify({error:'Server error: '+(ex.message||ex)}));
        }
    });

    app.get('/tools/migrate', async (req, res) => { 
        //hit(req.path);
        migrate.run();
        res.status(200).end('OK');
    });

    app.get('/agenda', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        config.token = req.cookies.token;
        config.category = 'features';
        let admin = await isAdmin(config.user, config.token);
        if(!admin){ 
            res.redirect('/');
            return;
        }
        //let list = await db.getTasks();
        let list = [];
        res.render('tasks.html', {config:config, list:list}); 
    });

    app.get('/agenda/:cat', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        config.token = req.cookies.token;
        config.category = req.params.cat;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){ 
            res.redirect('/');
            return;
        }
        //let list = await db.getTasksByCategory(req.params.cat);
        let list = [];  
        res.render('tasks.html', {config:config, list:list}); 
    });

    app.get('/reserve', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.user = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){ 
            res.redirect('/');
            return;
        }
        let inidate = new Date();
        let enddate = new Date();
        enddate = (new Date(enddate.setDate(enddate.getDate() + 7))); // Seven days from now
        let item = { action:'new', hallid:'davinci', artist:'', inidate:inidate, enddate:enddate, payment:10 };
        res.render('reserve.html', {config:config, item:item}); 
    });

    app.post('/reserve', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){ 
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let item = req.body;
        //console.warn('Data', item);
        // TODO: Verify user exists
        // TODO: Verify dates are not reserved for gallery
        let ok = await db.newReservation(item);
        console.warn('Res', ok);
        if(ok.status=='OK'){
            res.status(200).end(JSON.stringify({status:'Confirmed', id:ok.id}));
        } else {
            console.error(enow(), 'DB error reserving gallery', ok);
            res.status(401).end(JSON.stringify({error:'DB error reserving gallery'})); 
        }
    });




    //---- TOOLS

    app.get('/proxy', async (req, res) => { 
        try {
            //hit('Proxy '+req.query.url);
            if(!req.query.url){
                return res.status(404).end('error:Resource not found');
            }
            let url = unescape(req.query.url);
            let buf = await fetch(url);
            let txt = await buf.text();
            return res.status(200).end(txt);
        } catch(ex) {
            console.error(enow(), 'Server error', ex);
            return res.status(500).end('error:'+ex.message);
        }
    });

    app.get('/servertime', async (req, res) => { 
        try {
            hit(req.path);
            config.user  = req.cookies.user;
            let time = await db.getTime();
            let data = { database: time, server: new Date() };
            return res.status(200).end(JSON.stringify(data));
        } catch(ex) {
            console.error(enow(), 'Server error', ex);
            return res.status(500).render('servererror.html', {config:config});
        }
    });

    app.get('/logs', async (req, res) => { 
        //res.writeHead(200, {'Content-Type': 'text/plain'});
        let fhn = path.join(__dirname, 'stderr.log');
        let txt = fs.readFileSync(fhn, {encoding: 'utf8'});
        res.end('<body style="padding:20px;color:#AFA;background-color:#111;font-size:130%;"><pre>'+txt+'</pre></body>');
    });

    app.get('/logx', async (req, res) => { 
        //res.writeHead(200, {'Content-Type': 'text/plain'});
        let fn = path.join(__dirname, 'stderr.log');
        let ok = fs.writeFileSync(fn, '----\n');
        res.end('<body style="padding:20px;color:#AFA;background-color:#111;font-size:130%;"><pre>Logs cleared</pre></body>');
    });

    app.get('/api/token/:act/:tkn/:sig', async (req, res) => {
        let act = req.params.act;
        let tkn = req.params.tkn;
        let msg = 'DAVINCI LOGIN TOKEN: '+tkn;
        let sig = req.params.sig;

        let web3 = new Web3();
        //let hsh  = web3.utils.utf8ToHex('\x19Ethereum Signed Message:\n'+msg.length+''+msg);
        let hsh  = web3.utils.sha3('\x19Ethereum Signed Message:\n'+msg.length+''+msg);
        console.warn('Act:', act);
        console.warn('Tkn:', tkn);
        console.warn('Msg:', msg);
        console.warn('Hsh:', hsh);
        console.warn('Sig:', sig);
        let rsv = {
            messageHash: hsh,
            r: sig.substr(0,66),
            s: '0x'+sig.substr(66,128),
            v: '0x'+sig.substr(130)
        }
        console.warn('RSV:', rsv);
        let rec = await web3.eth.accounts.recover(rsv);
        let adr = rec.toString().toLowerCase();
        console.warn('Adr:', adr);
        
        let ok = act==adr;
        if(ok){
            let inf = await db.modUser({address:adr, token:tkn, isvalid:true});
            console.warn('Inf', inf);
        }
        res.status(200).end(adr);
    });

    app.get('/login', async (req, res) => { 
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        res.render('login.html', {config:config});
    });

    app.get('/logout', async (req, res) => { 
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        // TODO: clear token for user
        res.redirect('/');
    });

    app.get('/admin/errors', async (req, res) => { 
        //hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        let fhn = path.join(__dirname, 'stderr.log');
        let txt = fs.readFileSync(fhn, {encoding: 'utf8'});
        let lns = txt.split('\n');
        let cnt = 0;
        let err = [];
        for (var i = 0; i < lns.length; i++) {
            if(lns[i].toLowerCase().indexOf('error')>-1){
                err.push(lns[i]);
                cnt++;
            }
        }
        err.push(cnt + ' errors');
        res.end('<body style="padding:20px;color:#AFA;background-color:#111;font-size:130%;"><pre>'+err.join('\n')+'</pre></body>');
    });

    app.get('/admin/errorsweb', async (req, res) => { 
        //hit(req.path);
        config.user  = req.cookies.user;
        config.token = req.cookies.token;
        let admin = await isAdmin(config.user, config.token);
        if(!admin){
            res.status(401).end(JSON.stringify({error:'Unauthorized'})); 
            return;
        }
        config.theme = req.cookies.theme || config.theme;
        let limit = req.query.limit || 100;
        let start = req.query.start || 0;
        let list  = await db.getErrors(limit, start);
        res.render('errorsweb.html', {config:config, list:list});
    });

    app.get('/test/error', async (req, res) => { 
        hit(req.path);
        try {
            let a = b + c;
        } catch(ex){
            errorHandler(ex);
        }
        res.status(200).end('Error trapped');
    });

    app.post('/error', async (req, res) => { 
        //hit(req.path);
        //console.warn(enow(), req.body);
        //let rec = req.body;
        //let agt = req.get('user-agent');
        //let ipx = req.header('x-forwarded-for') || req.connection.remoteAddress;
        //console.warn('User agent :', agt);
        //console.warn('IP address :', ipx);
        //console.warn('ClientError:', rec);
        ////rec.ipadr = ipx
        //db.saveError(rec);
        res.status(200).end('{"status":"OK"}');
    });

    app.get('/todo', async (req, res) => { 
        //hit(req.path);
        config.user = req.cookies.user;
        let ip1 = req.connection.remoteAddress;
        let ip2 = req.header('x-forwarded-for');
        //let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        let agt = req.get('user-agent');
        console.warn('Agent', agt);
        console.warn('IPRmt', ip1);
        console.warn('IPFwd', ip2);
        let user = await db.getUser(config.user);
        if(user && !user.error){ config.badge = user.badge; }
        config.theme = req.cookies.theme || config.theme;
        res.render('todo.html', {config:config}); 
    });

    app.get('/notfound', async (req, res) => { 
        //hit(req.path);
        config.theme = req.cookies.theme || config.theme;
        config.ipadr = req.connection.remoteAddress;
        config.ipfwd = req.header('x-forwarded-for');
        res.status(404).render('notfound.html', {config:config}); // Catch all
    });

    app.get('*', (req, res) => { 
        //hit(req.path);
        //console.warn('- 404', req.url)
        res.status(404).render('notfound.html', {config:config}); // Catch all
        //res.status(404).end('Not found'); // Catch all
    });

    app.listen(5000);
    //app.listen();
}

main();

// END