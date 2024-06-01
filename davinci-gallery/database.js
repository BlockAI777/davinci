// DATABASE
//postgresql://username:password@host:port/database
const postgres = require('pg');
const dbconn   = process.env.DATABASE;
if(!dbconn){ console.error('DATASERVER NOT AVAILABLE'); }
const dbp = new postgres.Pool({ connectionString: dbconn });

const schema = {
    tables:{
        accounts: {
            primaryKey: 'actid',
            accessKey: 'actid',
            fields: ['actid', 'created', 'address', 'guild', 'percent', 'total', 'locked', 'unlock', 'inactive']
        },
        activity: {
            primaryKey: 'actid',
            accessKey: 'actid',
            fields: ['actid', 'created', 'type', 'userid', 'activity', 'reference', 'status']
        },
        artwork: {
            primaryKey: 'artid',
            accessKey: 'address',
            fields: ['artid', 'created', 'inactive', 'address', 'creator', 'owner', 'collection', 'tokenid', 'name', 'symbol', 'description', 'resource', 'metadata', 'thumbnail', 'cover', 'copies', 'available', 'media', 'royalties', 'onsale', 'saletype', 'saleprice', 'reserve', 'inidate', 'enddate', 'unlock', 'unlockcode', 'tags', 'likes', 'views', 'type', 'category', 'ttit', 'tini', 'tend', 'tloc', 'torg', 'tweb', 'tbio', 'tlnk1', 'tlnk2', 'tlnk3']
        },
        bids: {
            primaryKey: 'bidid',
            accessKey: 'bidid',
            fields: ['bidid', 'orderid', 'created', 'collection', 'tokenid', 'bidder', 'price', 'status']
        },
        collections: {
            primaryKey: 'colid',
            accessKey: 'address',
            fields: ['colid', 'created', 'inactive', 'address', 'type', 'owner', 'name', 'symbol', 'description', 'resource', 'metadata', 'thumbnail']
        },
        comments: {
            primaryKey: 'comid',
            accessKey: 'comid',
            fields: ['comid', 'reply', 'created', 'userid', 'artwork', 'comment', 'likes', 'status']
        },
        galleries: {
            primaryKey: 'galid',
            accessKey: 'galid',
            fields: ['galid', 'hall', 'artist', 'inidate', 'enddate', 'payment']
        },
        governance: {
            primaryKey: 'govid',
            accessKey: 'govid',
            fields: ['govid', 'address', 'created', 'author', 'moderator', 'moddate', 'reason', 'title', 'details', 'link', 'inidate', 'enddate', 'quorum', 'votes', 'agree', 'disagree', 'abstain', 'tokens', 'status', 'result']
        },
        gvotes: {
            primaryKey: 'voteid',
            accessKey: 'voteid',
            fields: ['voteid', 'govid', 'created', 'voter', 'option', 'other', 'stakes', 'balance', 'invalid']
        },
        orderbook: {
            primaryKey: 'orderid',
            accessKey: 'orderid',
            fields: ['orderid', 'ordertype', 'created', 'market', 'userid', 'amount', 'price', 'total', 'status', 'txid']
        },
        orders: {
            primaryKey: 'orderid',
            accessKey: 'orderid',
            fields: ['orderid', 'created', 'address', 'ordertype', 'startdate', 'enddate', 'owner', 'seller', 'buyer', 'collection', 'tokentype', 'artwork', 'tokenid', 'sellprice', 'buyprice', 'amount', 'fees', 'royalties', 'beneficiary', 'status', 'original']
        },
        owners: {
            primaryKey: 'recid',
            accessKey: 'ownerid',
            fields: ['recid', 'created', 'ownerid', 'address', 'collection', 'tokenid', 'copies', 'available', 'onsale', 'saletype', 'saleprice']
        },
        reported:{
            primaryKey: 'repid',
            accessKey: 'repid',
            fields: ['repid', 'created', 'artwork', 'authorid', 'reason', 'url', 'contact', 'status']
        },
        tasks: {
            primaryKey: 'taskid',
            accessKey: 'taskid',
            fields: ['taskid', 'created', 'author', 'title', 'details', 'inidate', 'estdate', 'enddate', 'priority', 'status', 'result']
        },
        transfers: {
            primaryKey: 'txid',
            accessKey: 'txhash',
            fields: ['txid', 'txhash', 'created', 'orderid', 'sender', 'receiver', 'tokentype', 'collection', 'tokenid', 'value', 'data', 'artwork']
        },
        trades: {
            primaryKey: 'tradeid',
            accessKey: 'tradeid',
            fields: ['tradeid', 'created', 'orderid', 'ordertype', 'market', 'userid', 'amount', 'price', 'total', 'maker', 'status', 'txid']
        },
        users: {
            primaryKey: 'userid',
            accessKey: 'address',
            fields: ['userid', 'created', 'inactive', 'address', 'name', 'namelower', 'avatar', 'tagline', 'description', 'url', 'twitter', 'instagram', 'listed', 'golden', 'verified', 'redflag', 'badge', 'token', 'isvalid', 'isadmin']
        },
        vincis: {
            primaryKey: 'vid',
            accessKey: 'vid',
            fields: ['vid', 'created', 'address', 'guild', 'percent', 'total', 'locked', 'unlock', 'status']
        },
    }
}

class DataServer {
    async connect() {}
    async disconnect() {}

    async insert(sql, params, key) {
        var dbc, res, recid, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rowCount>0) { 
                recid = key?res.rows[0][key]:0;
                data  = { status:'OK', id: recid }; 
            }
        } catch(ex) {
            console.error('DB error on new record:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async update(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rowCount>0) {
                data = true;
            } else { 
                data = false;
            }
        } catch(ex) {
            console.error('DB error updating records:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async query(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows;
            } else {
                data = [];
            }
        } catch(ex) {
            console.error('DB error in query:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async queryObject(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows[0];
            }
        } catch(ex) {
            console.error('DB error getting data object:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async queryValue(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows[0].value; // Select should have field as value
            }
        } catch(ex) {
            console.error('DB error getting data value:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }
}


const DS = new DataServer();

//---- UTILS

function parseFields(flds, excl) {
    let fields = [];
    for (var i = 0; i < flds.length; i++) {
        if(excl[i].indexOf(flds[i])>=0) { continue; }
        fields.push(flds[i]);
    }
    return fields.join(',');
}

function parseInsert(table, flds, excl, key, rec) {
    let npos = 0
    let arrf = [];
    let arrv = [];
    let data = [];
    let keys = Object.keys(rec)
    for (var i = 0; i < keys.length; i++) {
        if(excl.indexOf(keys[i])>=0) { continue; }
        if(flds.indexOf(keys[i])>=0){ 
            npos++; 
            arrf.push(keys[i]); 
            arrv.push('$'+npos); 
            data.push(rec[keys[i]]); 
        }
    }
    let fields = arrf.join(',');
    let values = arrv.join(',');
    let sql = `insert into ${table}(${fields}) values(${values}) returning ${key}`;
    //console.error('SQL', sql);
    //console.error('DATA', data);
    if(npos<1){ return null; } else { return {sql:sql, data:data }; }
}

function parseUpdate(table, flds, excl, key, rec) {
    let npos = 1; // first value is primary key
    let arrf = [];
    let arrv = [];
    let data = [];
    let keys = Object.keys(rec)
    for (var i = 0; i < keys.length; i++) {
        if(excl.indexOf(keys[i])>=0) { continue; }
        if(keys[i]==key){ 
            data.unshift(rec[keys[i]]); 
            continue;
        }
        if(flds.indexOf(keys[i])>=0){ 
            npos++; 
            arrf.push(keys[i]+'=$'+npos); 
            data.push(rec[keys[i]]); 
        }
    }
    let fields = arrf.join(', ');
    let sql = `update ${table} set ${fields} where ${key} = $1`;
    //console.error('SQL', sql);
    //console.error('DATA', data);
    if(npos<1){ return null; } else { return {sql:sql, data:data }; }
}



// Get server tiime to test connectivity
async function getTime() { 
    let sql  = 'SELECT NOW() as value';
    let data = await DS.queryValue(sql);
    return data;
}


//---- CONFIG

async function getSettings() {
    let sql  = 'Select * From config';
    let info = await DS.query(sql);
    let data = {};
    for (var i = 0; i < info.length; i++) {
        switch(info[i].type){
            case 'i': data[info[i].name] = parseInt(info[i].value)   || 0;    break;
            case 'f': data[info[i].name] = parseFloat(info[i].value) || 0.0;  break;
            case 'd': data[info[i].name] = new Date(info[i].value)   || null; break;
            case 'o': data[info[i].name] = JSON.parse(info[i].value) || null; break;
            default : data[info[i].name] = info[i].value             || '';   break;
        }
    }
    return data;
}

async function getConfig(name) {
    let sql  = 'Select value From config Where name=$1';
    let pars = [name];
    let data = await DS.queryValue(sql, pars);
    return data;
}

async function setConfig(name, value) {
    let sql  = 'Update config Set value = $2 Where name=$1';
    let pars = [name, value];
    let data = await DS.update(sql, pars);
    return data;
}


//---- USERS

async function newUser(rec) { 
    if(rec.name){ rec.namelower = rec.name.toLowerCase(); }
    let fields = schema.tables.users.fields;
    let key    = schema.tables.users.primaryKey;
    let except = [key];
    let parsed = parseInsert('users', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getUser(address) {
    let sql  = 'SELECT created, inactive, address, name, description, avatar, url, tagline, twitter, instagram, listed, golden, verified, redflag, badge, token, isvalid, isadmin FROM users WHERE address = $1';
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getUserByLowerName(name) {
    let sql  = 'SELECT created, inactive, address, name, description, avatar, url, tagline, twitter, instagram, listed, golden, verified, redflag, badge FROM users WHERE namelower = $1';
    let pars = [name];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modUser(rec) { 
    if(rec.name){ rec.namelower = rec.name.toLowerCase(); }
    let key    = schema.tables.users.accessKey;
    let fields = schema.tables.users.fields;
    let except = ['userid', 'created'];
    let parsed = parseUpdate('users', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getLatestUsers(limit=100) {
    let sql  = 'SELECT userid, created, inactive, address, name, avatar, url, tagline, twitter, instagram, listed, golden, verified, redflag, badge FROM users WHERE NOT inactive ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestVerified(limit=100) {
    let sql  = 'SELECT userid, created, inactive, address, name, avatar, url, tagline, twitter, instagram, listed, golden, verified, redflag, badge FROM users WHERE NOT inactive AND verified ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getUsersActive(limit=100) {
    let sql = 'SELECT count(a.address) as qty, a.creator as address, u.avatar, u.name as name' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE u.listed > 0 AND NOT a.inactive AND NOT u.redflag' +
              '  GROUP BY a.creator, u.avatar, u.name' +
              '  ORDER BY qty desc' +
              '  LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getUsersListed() {
    let sql = 'SELECT count(a.address) as qty, a.creator as address, u.avatar, u.name as name, u.listed' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE listed>0' +
              '  GROUP BY a.creator, u.avatar, u.name, listed' +
              '  ORDER BY listed';
    let data = await DS.query(sql);
    return data;
}

async function getGoldenArtists(limit=50) {
    let sql = 'SELECT count(a.address) as qty, a.creator as address, u.created, u.avatar, u.name, u.golden' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE u.golden = true AND NOT a.inactive AND NOT u.redflag' +
              '  GROUP BY a.creator, u.created, u.avatar, u.name, u.golden' +
              '  ORDER BY qty desc' +
              '  LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getVerifiedArtists(limit=50) {
    let sql = 'SELECT count(a.address) as qty, a.creator as address, u.avatar, u.name, u.golden' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE u.verified = true AND NOT a.inactive AND NOT u.redflag' +
              '  GROUP BY a.creator, u.avatar, u.name, u.golden' +
              '  ORDER BY qty desc' +
              '  LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getGoldenUsers() {
    let sql  = 'SELECT * FROM users WHERE golden = true AND NOT inactive ORDER BY created desc';
    let data = await DS.query(sql);
    return data;
}

async function setArtistVerified(address) { 
    let sql  = 'Update users set verified = true where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function setArtistUnverified(address) { 
    let sql  = 'Update users set verified = false where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function setArtistRedflag(address) { 
    let sql  = 'Update users set redflag = true where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function setArtistUnflag(address) { 
    let sql  = 'Update users set redflag = false where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function setArtistInactive(address) { 
    let sql  = 'Update users set inactive = true where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function updateSocialBadge(address) {
    let sql  = 'UPDATE users SET badge=badge+1 WHERE address=$1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function updateGoldenBadge(address, badge) {
    let sql  = 'UPDATE users SET golden=$2 WHERE address=$1';
    let pars = [address, badge];
    let data = await DS.update(sql, pars);
    return data;
}



//---- COLLECTION

async function newCollection(rec) { 
    let fields = schema.tables.collections.fields;
    let key    = schema.tables.collections.primaryKey;
    let except = [key];
    let parsed = parseInsert('collections', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getCollection(address) {
    let sql  = 'SELECT * FROM collections WHERE address = $1';
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modCollection(rec) { 
    let fields = schema.tables.collections.fields;
    let except = ['colid'];
    let parsed = parseUpdate('collections', fields, except, 'address', rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function saveCollection(rec) { 
    //console.warn('Adding collection', rec.address);
    rec.address = rec.address.toLowerCase();
    let res = await newCollection(rec);
    //console.warn('NEW', res);
    if(!res || res.error){ return {error: 'Error saving collection'}; }
    return {success:'ok', address:rec.address};
}

async function getCollections(start=0, limit=100) {
    let sql  = 'SELECT * FROM collections LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestCollections(limit=100) {
    let sql  = 'SELECT * FROM collections ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getCollectionsByOwner(owner) {
    let sql  = 'SELECT * FROM collections WHERE owner = $1 AND NOT inactive ORDER BY created DESC';
    let pars = [owner];
    let data = await DS.query(sql, pars);
    return data;
}

async function getCollectionsByUser(owner) {
    let sql = 'SELECT count(1) as count, c.address, c.created, c.owner, c.type, c.name, c.description, c.thumbnail' +
              '  FROM artwork a' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  WHERE c.owner = $1 AND NOT c.inactive' +
              '  GROUP BY c.address, c.created, c.owner, c.type, c.name, c.description, c.thumbnail' +
              '  ORDER BY c.created DESC';
    let pars = [owner];
    let data = await DS.query(sql, pars);
    return data;
}

async function getCollectionsHot(limit=100) {
    let sql  = 'SELECT count(1) as count, collection, address, thumbnail, name, description'+
               '  FROM'+
               '    (SELECT x.collection, c.address, c.thumbnail, c.name, c.description'+
               '       FROM transfers x'+
               '       LEFT OUTER JOIN collections c ON x.collection = c.address'+
               '       WHERE orderid is not null AND c.address is not null AND x.collection NOT IN'+
               '         (SELECT address FROM collections WHERE owner = $1 ORDER by address)'+
               '       ORDER by x.created desc LIMIT $2) tx'+
               '  GROUP by collection, address, thumbnail, name, description'+
               '  ORDER by count desc';
    let pars = [process.env.OPERATOR, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getCollectionsNew(limit=100) {
    let sql = 'SELECT count(1) as count, c.address, c.created, c.owner, c.type, c.name, c.description, c.thumbnail' +
              '  FROM artwork a' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  WHERE c.address is not null'+
              '  GROUP BY c.address, c.created, c.owner, c.type, c.name, c.description, c.thumbnail' +
              '  ORDER BY c.created DESC'+
              '  LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getDavinciCollections() {
    let sql = 'SELECT address FROM collections WHERE owner = $1';
    let pars = [process.env.OPERATOR];
    let data = await DS.query(sql, pars);
    let list = [];
    for(var i=0; i<data.length; i++){
        list.push(data[i].address);
    }
    return list;
}


//---- ARTWORK

async function newArtwork(rec) { 
    let fields = schema.tables.artwork.fields;
    let key    = schema.tables.artwork.primaryKey;
    let except = [key];
    let parsed = parseInsert('artwork', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getArtwork(address, user) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $2' +
              '  WHERE a.address = $1'
    let pars = [address, user];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getArtworkCount(user) {
    let sql  = "SELECT count(1) as value FROM artwork where creator=$1 and created > timezone('UTC', now()) - interval '1 day'";
    let pars = [user];
    let val  = await DS.queryValue(sql, pars);
    if(!val || val.error){ val = 0; }
    let data = { count: val };
    return data;
}

async function viewArtwork(address, ipaddr) {
    let sql1 = 'Select * From viewcounter Where artwork=$1 And ipaddress=$2';
    let sql2 = 'Insert into viewcounter values($1, $2)';
    let sql3 = 'Update artwork set views = views + 1 where address = $1';
    let par1 = [address, ipaddr];
    let par2 = [address];
    var dbc, res, data = null;
    try {
        dbc  = await dbp.connect();
        res1 = await dbc.query(sql1, par1);
        if(res1.rowCount>0) { return false; }
        res2 = await dbc.query(sql2, par1);
        res3 = await dbc.query(sql3, par2);
        if(res3.rowCount>0) {
            data = true;
        } else { 
            data = false;
        }
    } catch(ex) {
        console.error('DB error on view artwork:', ex.message);
        console.error('DB values:', address, ipaddr);
        data = { error: ex.message };
    } finally {
        if (dbc) { dbc.release(); }
    }
    return data;
}

async function setArtworkInactive(address) { 
    let sql  = 'Update artwork set inactive = NOT inactive where address = $1';
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}

async function modArtwork(rec) { 
    let key    = schema.tables.artwork.accessKey;
    let fields = schema.tables.artwork.fields;
    let except = ['artid', 'created'];
    let parsed = parseUpdate('artwork', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function changeCategory(address, category) { 
    let sql  = 'Update artwork set category = $2 where address = $1';
    let pars = [address, category];
    let data = await DS.update(sql, pars);
    return data;
}


async function saveArtwork(rec) { 
    // Check artwork does not exist
    let art = await getArtwork(rec.address);
    if(art==null){
        //console.warn('Adding token', rec.address);
        let res = await newArtwork(rec); // both 721 and 1155
        //console.warn('NEW', res);
        if(res.error){ return {error:'Database error creating artwork'}; }
        return {status:'CONFIRMED', artid:res.id, address:rec.address};
    } else if(art.error){
        console.error('Error adding token', art.error);
        return {error: 'Database error adding artwork'};
    } else {
        console.error('Token already exists', rec.address, art);
        return {error: 'Artwork already exists'};
    }
}

async function checkArtwork(collection, tokenId) { 
    let sql  = 'SELECT address, type, collection, tokenid FROM artwork WHERE collection = $1 AND tokenid = $2'
    let pars = [collection, tokenId];
    let res  = await DS.queryObject(sql, pars);
    if(!res || res.error) { 
        data = { error: 'Not found' };
    } else {
        data = { status: 'OK', address: res.address };
    }
    return data;
}

async function getArtworks(start=0, limit=100) {
    let sql  = 'SELECT * FROM artwork WHERE NOT inactive AND a.category<9 LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let res  = await DS.query(sql, pars);
    return data;
}

async function getLatestArtworks(filter, user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<8 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlNFS = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE onsale = false AND NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlFSO = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE onsale = true AND NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlSAL = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE saletype = 0 AND NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlAUC = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE saletype = 1 AND NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMVI = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.views desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMSO = 'SELECT a.*, a.copies-a.available sold, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY sold desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMEX = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.saleprice desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlLEX = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<9 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.saleprice asc' +
              '  LIMIT $2 OFFSET $3';

    let filters = {'nfs':sqlNFS, 'fso':sqlFSO, 'sal':sqlSAL, 'auc':sqlAUC, 'mvi':sqlMVI, 'mso':sqlMSO, 'mex':sqlMEX, 'lex':sqlLEX};
    if(filter && filters[filter]){ sql = filters[filter]; }

    let pars = [user, limit, page];
    let data = await DS.query(sql, pars);
   
    return data;
}

async function apiLatestArtworks(limit=100, page=0) {
    let sql = 'SELECT a.address, a.created, a.inactive, a.creator, a.owner, a.collection, a.tokenid, a.name, a.symbol, a.description, a.resource, a.metadata, a.thumbnail, a.cover, a.copies, a.available, a.media, a.royalties, a.onsale, a.saletype, a.saleprice, a.reserve, a.inidate, a.enddate, a.unlock, a.tags, a.likes, a.views, a.type, a.category, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, false as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  WHERE NOT a.inactive AND a.category<8 AND NOT u.inactive AND NOT u.redflag' +
              '  ORDER BY a.created desc' +
              '  LIMIT $1 OFFSET $2';
    let pars = [limit, page];
    let data = await DS.query(sql, pars);
   
    return data;
}

async function getArtworksByCategory(category, filter, user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlNFS = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE onsale = false AND a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlFSO = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE onsale = true AND a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlSAL = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE saletype = 0 AND a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlAUC = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE saletype = 1 AND a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMVI = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.views desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMSO = 'SELECT a.*, a.copies-a.available sold, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE a.category=$4 AND NOT a.inactive' +
              '  ORDER BY sold desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlMEX = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.saleprice desc' +
              '  LIMIT $2 OFFSET $3';

    let sqlLEX = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE a.category=$4 AND NOT a.inactive' +
              '  ORDER BY a.saleprice asc' +
              '  LIMIT $2 OFFSET $3';

    let filters = {'nfs':sqlNFS, 'fso':sqlFSO, 'sal':sqlSAL, 'auc':sqlAUC, 'mvi':sqlMVI, 'mso':sqlMSO, 'mex':sqlMEX, 'lex':sqlLEX};
    if(filter && filters[filter]){ sql = filters[filter]; }

    let pars = [user, limit, page, category];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksByPage(user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT a.inactive AND a.category<9' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';

    let offset = page*limit;
    let pars = [user, limit, offset];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksByUser(address, private=false, inactive=false, limit=100, user) {
    let where = '  WHERE a.creator = $1';
    if(!private) { where += ' AND a.category<9'; } 
    if(!inactive){ where += ' AND NOT a.inactive'; }
    let sql = 'SELECT distinct(a.address) as adr, a.*, a.available as qty, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $3' +
              where +
              '  ORDER BY a.created desc' +
              '  LIMIT $2';
    let pars = [address, limit, user];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksBySelf(address, user, limit=100, page=0) {
    let sql = 'SELECT a.*, a.available as qty, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $2' +
              '  WHERE a.creator = $1' +
              '  ORDER BY a.created desc';
              //'  LIMIT $3 OFFSET $4';
    //let pars = [address, user, limit, page*limit];
    let pars = [address, user];
    let data = await DS.query(sql, pars);

    return data;
}

async function getArtworksByOwner(owner, user, limit=100, page=0) {
    let sql = 'SELECT w.tokenid, w.copies, w.available as qty, a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM owners w ' + 
              '  LEFT OUTER JOIN artwork a ON w.address = a.address' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $2' +
              '  WHERE w.ownerid = $1 AND w.available > 0' +
              '  ORDER BY a.created desc';
              //'  LIMIT $3 OFFSET $4';
    //let pars = [owner, user, limit, page*limit];
    let pars = [owner, user];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworkByOwner(address, user) {
    let sql = 'SELECT w.*, w.ownerid as owner, a.address as artwork, a.type, a.creator, a.name, a.description, a.thumbnail, a.cover, a.resource, a.metadata, a.media, a.tags, a.likes, a.views, a.unlock, a.unlockcode, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM owners w ' +
              '  LEFT OUTER JOIN artwork a ON w.collection = a.collection AND w.tokenid = a.tokenid' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON w.ownerid = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $2' +
              '  WHERE w.ownerid = $2 AND w.address = $1 AND NOT a.inactive';
    let pars = [address, user];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getArtworksByType(type, limit=100, user) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $3' +
              '  WHERE a.media = $1 AND NOT a.inactive AND a.category<9' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2';

    let pars = [type, limit, user];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksByTags(tag, limit=100, user) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $3' +
              '  WHERE (LOWER(a.tags) like $1 OR LOWER(u.name) like $1 ) AND a.category<9 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2';
    let tagx = tag.toLowerCase();
    let pars = ['%'+tagx+'%', limit, user];
    let data = await DS.query(sql, pars);

    return data;
}

async function getArtworksByCollection(address, limit=100, user) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $3' +
              '  WHERE a.collection = $1 AND NOT a.inactive AND a.category<9' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2';
    let pars = [address, limit, user];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksGolden(user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE u.golden AND NOT u.inactive AND NOT u.redflag AND a.category<8 AND NOT a.inactive' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';
    let pars = [user, limit, page];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksVerified(user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE u.verified AND NOT u.golden AND NOT u.inactive AND NOT u.redflag AND NOT a.inactive AND a.category<8' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';
    let pars = [user, limit, page];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function getArtworksNotVerified(user, page=0, limit=100) {
    let sql = 'SELECT a.*, c.name as colname, u.name as author, u.golden, u.verified, u.redflag, o.name as ownerx, o.golden as ogolden, o.verified as overified, o.redflag as oredflag, f.favorite as favorite' +
              '  FROM artwork a ' +
              '  LEFT OUTER JOIN collections c ON a.collection = c.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  LEFT OUTER JOIN users o ON a.owner = o.address' +
              '  LEFT OUTER JOIN favorites f ON a.address = f.address AND f.userid = $1' +
              '  WHERE NOT u.golden AND NOT u.verified AND NOT u.inactive AND NOT u.redflag AND NOT a.inactive AND a.category<8' +
              '  ORDER BY a.created desc' +
              '  LIMIT $2 OFFSET $3';
    let pars = [user, limit, page];
    let data = await DS.query(sql, pars);
    
    return data;
}

async function likeArtwork(address, user) { 
    let fav = await getFavorite(address, user);
    //console.warn('Favorite', fav);
    if(fav==null){
        //console.warn('New favorite', address, user);
        let res = await newFavorite(address, user);
        changeFavorite(address, true);
        return res;
    } else if(fav.error){
        console.error('Error in favorite', address, user);
        return {error: 'Error adding favorite'};
    } else {
        //console.warn('Mod favorite', address, user);
        let res = await modFavorite(address, user);
        changeFavorite(address, !fav.favorite);
        return res;
    }
}

async function updatePrice(address, price) { 
    if(!address || price < 0) { 
        console.error('DB error on updating price: invalid input data');
        return { error: 'Invalid input data updating price' };
    }
    let sql  = 'Update artwork Set saleprice = $1 Where address = $2';
    let pars = [price, address];
    let data = await DS.update(sql, pars);
    return data;
}

async function updateCopies(address, qty) { 
    //console.warn('Update copies', address, qty);
    if(!address || qty < 0) { 
        console.error('DB error on updating copies: invalid input data');
        return { error: 'Invalid input data updating copies' };
    }
    let sql    = 'Update artwork Set available = $2 Where address = $1';
    let copies = parseInt(qty) || 0;
    let params = [address, copies];
    let data   = await DS.update(sql, params);
    return data;
}

async function deductCopies(address, qty) { 
    //console.warn('Deduct copies', address, qty);
    if(!address || !qty) { 
        console.error('DB error on deducting copies: invalid input data');
        return { error: 'Invalid input data deducting copies' };
    }
    let sql    = 'Update artwork Set available = available - $2 Where address = $1';
    let copies = parseInt(qty) || 0;
    let params = [address, copies];
    let data   = await DS.update(sql, params);
    return data;
}

async function updateResell(address, ownerid, qty) { 
    //console.warn('Update resell', address, qty);
    //console.warn('For ownerid', ownerid);
    if(!address || !qty) { 
        console.error('DB error on updating resells: invalid input data');
        return { error: 'Invalid input data updating resells' };
    }
    let sql    = 'Update owners Set available = $3 Where address = $1 AND ownerid = $2';
    let copies = parseInt(qty) || 0;
    let params = [address, ownerid, copies];
    let data   = await DS.update(sql, params);
    return data;
}

async function deductResell(address, ownerid, qty) { 
    //console.warn('Deduct resell', address, qty);
    //console.warn('For ownerid', ownerid);
    if(!address || !qty) { 
        console.error('DB error on deducting resells: invalid input data');
        return { error: 'Invalid input data deducting resells' };
    }
    let sql    = 'Update owners Set available = available - $3 Where address = $1 AND ownerid = $2';
    let copies = parseInt(qty) || 0;
    let params = [address, ownerid, copies];
    let data   = await DS.update(sql, params);
    return data;
}


//---- FAVORITES

async function newFavorite(address, user) { 
    let sql  = 'Insert into Favorites(address, userid, favorite) values($1, $2, true) Returning favid'
    let pars = [address, user];
    let data = await DS.insert(sql, pars, 'favid');
    return data;
}

async function modFavorite(address, user) { 
    let sql  = 'Update favorites Set favorite = NOT favorite Where address = $1 AND userid = $2';
    let pars = [address, user];
    let data = await DS.update(sql, pars);
    return data;
}

async function getFavorite(address, user) {
    let sql  = 'SELECT * FROM favorites WHERE address = $1 AND userid = $2';
    let pars = [address, user];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function changeFavorite(address, fav) { 
    let sql  = 'Update artwork Set likes = likes + 1 Where address = $1';
    if(!fav){ sql = 'Update artwork Set likes = likes - 1 Where address = $1'; }
    let pars = [address];
    let data = await DS.update(sql, pars);
    return data;
}


//---- OWNERS

async function newOwner(rec) { 
    let fields = schema.tables.owners.fields;
    let key    = schema.tables.owners.primaryKey;
    let except = [key];
    let parsed = parseInsert('owners', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getOwner(recid) {
    let sql  = 'SELECT * FROM owners WHERE recid = $1';
    let pars = [recid];
    let data = await DS.queryObject(sql, pars);
    
    return data;
}

async function modOwner(rec) { 
    let fields = schema.tables.owners.fields;
    let key    = schema.tables.owners.primaryKey;
    let except = ['recid', 'created'];
    let parsed = parseUpdate('owners', fields, except, key, rec);
    parsed.data.unshift(rec.recid); // Bad hack to add pkey back after being ecluded for update 
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getOwners(start=0, limit=100) {
    let sql  = 'SELECT * FROM owners LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getLatestOwners(limit=100) {
    let sql  = 'SELECT * FROM owners ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getOwnersByUser(address) {
    let sql  = 'SELECT * FROM owners WHERE owner = $1 ORDER BY created DESC LIMIT 100';
    let pars = [address];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getOwnerByArtwork(ownerid, address) {
    let sql = 'Select * From owners WHERE ownerid = $1 AND address = $2 Limit 1';
    let pars = [ownerid, address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getOwnersByArtwork(address) {
    let sql = 'SELECT o.*, u.name, u.golden, u.verified, u.redflag' +
              '  FROM owners o' +
              '  LEFT OUTER JOIN users u ON o.ownerid = u.address' +
              '  WHERE o.address = $1' +
              '  AND   o.available > 0' +
              '  ORDER BY u.name';
    let pars = [address];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getOwnerByToken(ownerid, collection, tokenid) {
    let sql  = 'Select * From owners WHERE ownerid = $1 AND collection = $2 AND tokenid = $3';
    let pars = [ownerid, collection, tokenid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function saveOwnership(rec) { 
    //console.warn('Save ownership', rec);
    // Check ownership does not exist
    let own = await getOwnerByArtwork(rec.ownerid, rec.address);
    //let own = await getOwnerByToken(rec.ownerid, rec.tokenid);
    //console.warn('Ownership in db', own);
    if(own==null){
        //console.warn('Adding ownership', rec.ownerid, rec.address, rec.collection, rec.tokenid, rec.copies);
        rec.available = rec.copies;
        let res = await newOwner(rec);
        //console.warn('New ownership', res);
        //console.warn('Updating copies minus', rec.copies);
        if(rec.updateqty){ deductCopies(rec.address, rec.copies); }
        return {success:'ok', ownerid:rec.ownerid, address:rec.address, recid:res.id};
    } else if(own.error){
        console.error('Error adding ownership', own.error);
        return {error: 'Database error adding ownership'};
    } else {
        console.error('Ownership already exists, updating...');
        let rex = {
            recid     : own.recid,
            copies    : parseInt(own.copies) + parseInt(rec.copies),
            available : parseInt(own.available) + parseInt(rec.copies)
        }
        //console.warn('REX', rex);
        let res = await modOwner(rex);
        //console.warn('Mod ownership', res);
        //console.warn('Updating copies minus', rec.copies);
        if(rec.updateqty){ deductCopies(rec.address, rec.copies); }
        return {success:'ok', ownerid:own.ownerid, address:own.address, recid:own.recid};
    }
}

async function resellOwnership(rec) { 
    //console.warn('Resell ownership', rec);
    // Check ownership does not exist
    let own = await getOwnerByArtwork(rec.ownerid, rec.address);
    //console.warn('Ownership in db', own);
    if(own==null){
        //console.warn('Adding ownership', rec.ownerid, rec.address, rec.collection, rec.tokenid, rec.copies);
        rec.available = rec.copies;
        let res = await newOwner(rec);
        //console.warn('New ownership', res);
        //console.warn('Updating copies minus', rec.copies);
        if(rec.updateqty){ deductResell(rec.address, rec.seller, rec.copies); }
        return {success:'ok', ownerid:rec.ownerid, address:rec.address, recid:res.id};
    } else if(own.error){
        console.error('Error adding ownership', own.error);
        return {error: 'Database error adding ownership'};
    } else {
        //console.warn('Ownership already exists, updating...');
        let rex = {
            recid     : own.recid,
            copies    : parseInt(own.copies) + parseInt(rec.copies),
            available : parseInt(own.available) + parseInt(rec.copies)
        }
        //console.warn('REX', rex);
        let res = await modOwner(rex);
        //console.warn('Mod ownership', res);
        //console.warn('Updating copies minus', rec.copies);
        if(rec.updateqty){ deductResell(rec.address, rec.seller, rec.copies); }
        return {success:'ok', ownerid:own.ownerid, address:own.address, recid:own.recid};
    }
}

async function changeOwner(info) { 
    let address  = info.address;
    let oldOwner = info.seller;
    let newOwner = info.ownerid;
    let sql  = 'Update artwork set owner = $3 where address = $1 AND owner = $2';
    let pars = [address, oldOwner, newOwner];
    let data = await DS.update(sql, pars);
    return data;
}

async function checkOwner(collection, tokenId, owner) { 
    let sql  = 'SELECT * FROM owners WHERE collection = $1 AND tokenid = $2 AND ownerid = $3'
    let pars = [collection, tokenId, owner];
    let res  = await DS.queryObject(sql, pars);
    let data = null;
    if(!res || res.error){
        data = { error: 'Not found' };
    } else {
        data = { status: 'OK' };
    }
    return data;
}

async function removeOwner(address, ownerid) { 
    let sql  = 'Update owners set available = 0, saletype = 2, onsale = false where address = $1 AND ownerid = $2';
    let pars = [address, ownerid];
    let data = await DS.update(sql, pars);
    return data;
}


//---- ORDERS

async function newOrder(rec) { 
    let fields = schema.tables.orders.fields;
    let key    = schema.tables.orders.primaryKey;
    let except = [key];
    let parsed = parseInsert('orders', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getOrder(orderid) {
    let sql  = 'SELECT * FROM orders WHERE orderid = $1';
    let pars = [orderid];
    let data = await DS.queryObject(sql, pars);    
    return data;
}

async function getOrderByAddress(orderid) {
    let sql  = 'SELECT * FROM orders WHERE address = $1';
    let pars = [orderid];
    let data = await DS.queryObject(sql, pars);    
    return data;
}

async function modOrder(rec) { 
    let fields = schema.tables.orders.fields;
    let key    = schema.tables.orders.primaryKey;
    let except = ['created'];
    let parsed = parseUpdate('orders', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getOrders(start=0, limit=100) {
    let sql  = 'SELECT * FROM orders LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestOrders(limit=100) {
    let sql  = 'SELECT * FROM orders ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getOrdersByUser(address) {
    let sql  = 'SELECT * FROM orders WHERE owner = $1 ORDER BY created DESC LIMIT 100';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function getOrderByArtwork(address) {
    let sql  = 'Select * From orders Where artwork = $1 Order by created desc Limit 1'; // Last order
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getOrdersByArtwork(address) {
    let sql  = 'Select * From orders Where artwork = $1 Order by created desc';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function getOpenOrderByArtwork(address) {
    let sql = 'Select * From orders Where artwork = $1 and original = true and status = 1 Order by created desc Limit 1'; // Open order original item
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getOpenOrderByOwner(artwork, ownerid) {
    let sql = 'Select * From orders Where artwork = $1 and owner = $2 and status = 1 Order by created desc Limit 1'; // Open order
    let pars = [artwork, ownerid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getOrderByToken(collection, tokenid) {
    let sql  = 'Select * From orders where artwork = $1 and status = 1'; // Open order
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}


//---- BIDS

async function newBid(rec) { 
    let fields = schema.tables.bids.fields;
    let key    = schema.tables.bids.primaryKey;
    let except = [key];
    let parsed = parseInsert('bids', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getBid(bidid) {
    let sql  = 'SELECT * FROM bids WHERE bidid = $1';
    let pars = [bidid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modBid(rec) { 
    let fields = schema.tables.bids.fields;
    let key    = schema.tables.bids.primaryKey;
    let except = ['created'];
    let parsed = parseUpdate('bids', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getBidsByAddress(address, limit=100, page=0) {
    let sql  = 'SELECT o.created as odate, o.status as ostatus, b.* ' +
               '  FROM orders o' +
               '  LEFT OUTER JOIN bids b ON o.address = b.orderid' +
               '  WHERE o.artwork = $1 AND b.bidid IS NOT NULL' +
               '  ORDER BY o.created desc, b.created desc' +
               '  LIMIT $2 OFFSET $3';
    let pars = [address, limit, page*limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestBids(limit=100) {
    let sql  = 'SELECT * FROM bids ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getBidsByUser(address) {
    let sql  = 'SELECT * FROM bids WHERE owner = $1 ORDER BY created DESC LIMIT 100';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function getBidsByOrder(orderid) {
    let sql = 'SELECT b.*, u.name' +
              '  FROM bids b' +
              '  LEFT OUTER JOIN users u ON b.bidder = u.address' +
              '  WHERE b.orderid = $1 ORDER BY b.created DESC LIMIT 100';
    let pars = [orderid];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLastValidBid(orderid) {
    let sql  = 'SELECT * FROM bids WHERE orderid = $1 AND status=0 ORDER BY created DESC LIMIT 1';
    let pars = [orderid];
    let data = await DS.queryObject(sql, pars);
    return data;
}


//---- TRANSFERS

async function newTransfer(rec) { 
    let fields = schema.tables.transfers.fields;
    let key    = schema.tables.transfers.primaryKey;
    let except = [key];
    let parsed = parseInsert('transfers', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getTransfer(txid) {
    let sql  = 'SELECT * FROM transfers WHERE txid = $1';
    let pars = [txid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modTransfer(rec) { 
    let fields = schema.tables.transfers.fields;
    let key    = schema.tables.transfers.primaryKey;
    let except = ['txid', 'created'];
    let parsed = parseUpdate('transfers', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getTransfers(start=0, limit=100) {
    let sql  = 'SELECT * FROM transfers LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestTransfers(limit=100) {
    let sql  = 'SELECT t.*, a.name, a.thumbnail' +
               '  FROM transfers t' +
               '  LEFT OUTER JOIN artwork a ON t.artwork = a.address' +
               '  ORDER BY t.created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getTransfersByUser(address) {
    let sql  = 'SELECT * FROM transfers WHERE sender = $1 OR receiver = $1 ORDER BY created DESC LIMIT 100';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function getTransfersByToken(tokenid) {
    let sql  = 'SELECT * FROM transfers WHERE tokenid = $1 ORDER BY created DESC LIMIT 100';
    let pars = [tokenid];
    let data = await DS.query(sql, pars);
    return data;
}


//---- REPORTED

async function newReported(rec) { 
    let fields = schema.tables.reported.fields;
    let key    = schema.tables.reported.primaryKey;
    let except = [key, 'created', 'status'];
    let parsed = parseInsert('reported', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getReportedArtworks() {
    let sql = 'SELECT r.*, a.name, a.creator, a.thumbnail, u.name as author' +
              '  FROM reported r ' +
              '  LEFT OUTER JOIN artwork a ON a.address = r.artwork' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  ORDER BY r.created desc' +
              '  LIMIT 100';
    let data = await DS.query(sql);
    return data;
}

async function getReportsByArtwork(address) {
    let sql  = 'SELECT * FROM reported WHERE artwork = $1 ORDER BY created desc';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}


//---- COMMENTS

async function newComment(rec) { 
    let fields = schema.tables.comments.fields;
    let key    = schema.tables.comments.primaryKey;
    let except = [key];
    let parsed = parseInsert('comments', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getComment(comid) {
    let sql  = 'SELECT * FROM comments WHERE comid = $1';
    let pars = [comid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modComment(rec) { 
    let fields = schema.tables.comments.fields;
    let key    = schema.tables.comments.primaryKey;
    let except = ['created'];
    let parsed = parseUpdate('comments', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getComments(start=0, limit=100) {
    let sql  = 'SELECT * FROM comments ORDER BY created desc LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getCommentsByArtwork(address, start=0, limit=100) {
    let sql  = 'SELECT c.*, u.name, u.avatar ' +
               '  FROM comments c' +
               '  LEFT OUTER JOIN users u ON c.userid = u.address' +
               '  WHERE c.artwork=$1 AND c.status < 2' +
               '  ORDER BY c.created' +
               '  LIMIT $2 OFFSET $3';
    let pars = [address, limit, start];
    let data = await DS.query(sql, pars);
    return data;
}

//---- ACTIVITY

async function newActivity(rec) { 
    let fields = schema.tables.activity.fields;
    let key    = schema.tables.activity.primaryKey;
    let except = [key];
    let parsed = parseInsert('activity', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getActivity(actid) {
    let sql  = 'SELECT * FROM activity WHERE actid = $1';
    let pars = [actid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modActivity(rec) { 
    let fields = schema.tables.activity.fields;
    let key    = schema.tables.activity.primaryKey;
    let except = ['created'];
    let parsed = parseUpdate('activity', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getLatestActivity(start=0, limit=100) {
    let sql  = 'SELECT * FROM activity ORDER BY created desc LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getActivityByUser(address, start=0, limit=100) {
    let sql  = 'SELECT * ' +
               '  FROM activity' +
               '  WHERE userid = $1' +
               '  ORDER BY created desc' +
               '  LIMIT $2 OFFSET $3';
    let pars = [address, limit, start];
    let data = await DS.query(sql, pars);
    return data;
}

async function readActivity(userid) {
    let sql1 = 'UPDATE activity SET status=1 WHERE userid=$1 AND status=0';
    let sql2 = 'UPDATE users SET badge=0 WHERE address=$1';
    let pars = [userid];
    let data = await DS.update(sql1, pars);
        data = await DS.update(sql2, pars);
    return data;
}


//---- PROPOSALS

async function newProposal(rec) { 
    let fields = schema.tables.governance.fields;
    let key    = schema.tables.governance.primaryKey;
    let except = [key];
    let parsed = parseInsert('governance', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getProposal(address) {
    let sql  = 'SELECT g.*, u.name FROM governance g' +
               '  LEFT OUTER JOIN users u ON g.author = u.address' +
               '  WHERE g.address = $1';
    let pars = [address];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function modProposal(rec) { 
    let fields = schema.tables.governance.fields;
    let key    = schema.tables.governance.primaryKey;
    let except = ['created'];
    let parsed = parseUpdate('governance', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.update(sql, params);
    return data;
}

async function getLatestProposals(start=0, limit=100) {
    let sql  = 'SELECT g.*, u.name FROM governance g' +
               '  LEFT OUTER JOIN users u ON g.author = u.address' +
               '  ORDER BY g.created desc LIMIT $2 OFFSET $1';
    let pars = [start, limit];
    let data = await DS.query(sql, pars);
    return data;
}

async function getProposalsByStatus(status, start=0, limit=100) {
    let sql  = 'SELECT g.*, u.name FROM governance g' +
               '  LEFT OUTER JOIN users u ON g.author = u.address' +
               '  WHERE g.status = $1' +
               '  ORDER BY g.created desc' +
               '  LIMIT $2 OFFSET $3';
    let pars = [status, limit, start];
    let data = await DS.query(sql, pars);
    return data;
}

//---- VOTES

async function newVote(rec) { 
    let fields = schema.tables.gvotes.fields;
    let key    = schema.tables.gvotes.primaryKey;
    let except = [key];
    let parsed = parseInsert('gvotes', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function checkVote(govid, user) {
    let sql  = 'SELECT voteid as value FROM gvotes WHERE govid = $1 AND voter = $2';
    let pars = [govid, user];
    let data = await DS.queryValue(sql, pars);
    return data;
}

async function getLatestVotes(govid, start=0, limit=100) {
    let sql  = 'SELECT v.*, u.name FROM gvotes v' +
               '  LEFT OUTER JOIN users u ON v.voter = u.address' +
               '  WHERE v.govid = $1' +
               '  ORDER BY v.created desc LIMIT $2 OFFSET $3';
    let pars = [govid, limit, start];
    let data = await DS.query(sql, pars);
    return data;
}

async function tallyVotes(govid) {
    let sql  = 'SELECT count(option) as votes, sum(stakes) as stakes, sum(balance) as balance, option FROM gvotes' +
               '  WHERE govid = $1' +
               '  GROUP BY option' +
               '  ORDER BY option';
    let pars = [govid];
    let data = await DS.query(sql, pars);
    return data;
}


//---- VARIOUS

async function getGalleryArtists() {
    //let sql  = 'SELECT * FROM galleries WHERE inidate <= now() AND enddate > now()';
    //let sql  = "SELECT * FROM galleries WHERE inidate <= now() at time zone 'utc' AND enddate > now() at time zone 'utc'";
    let sql  = "SELECT * FROM galleries WHERE inidate <= timezone('UTC', now()) AND enddate > timezone('UTC', now())";
    let data = await DS.query(sql);
    return data;
}

async function getGalleries() {
    let data = {};
    let gallery = await getGalleryArtists();
    //console.warn('Galleries', gallery)
    if(!gallery || gallery.length<1){ return {error: 'No galleries open'}; }
    for (var i = 0; i < gallery.length; i++) {
        let info   = gallery[i];
        let hall   = gallery[i].hall;
        let artist = gallery[i].artist;
        //console.warn('Gallery', info, hall, artist)
        let user   = await getUser(artist);
        let arts   = await getArtworksByUser(artist, false, false, 100, artist);
        data[hall] = {
            info: info, 
            artist: user,
            artworks: arts
        }
    }
    return data;
}

async function newReservation(rec) { 
    let fields = schema.tables.galleries.fields;
    let key    = schema.tables.galleries.primaryKey;
    let except = [key];
    let parsed = parseInsert('galleries', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getStats() {
    let data = {artists:0, artworks:0, sold:0, total:0, users7:0, items7:0};
    let sql1 = 'SELECT count(1) as count FROM users';
    let sql2 = 'SELECT count(1) as count FROM artwork';
    //let sql3 = 'SELECT count(1) as count FROM owners';
    let sql3 = 'SELECT sum(copies-available) as count FROM artwork';
    //let sql4 = 'SELECT sum(amount*sellprice) as total FROM orders'; // On sale all copies
    //let sql4 = 'SELECT sum((copies-available)*saleprice) as total FROM artwork'; // Total Sold
    let sql4 = 'SELECT sum(value) as total FROM transfers WHERE orderid is not null'; // Total Sold
    let sql5 = "SELECT count(1) as count FROM public.users where (created + interval '7 days') > (localtimestamp at time zone 'UTC')";
    let sql6 = "SELECT count(1) as count FROM public.artwork where (created + interval '7 days') > (localtimestamp at time zone 'UTC')";
    //let sql7 = 'SELECT count(1) as num, created::date as date FROM public.users group by created::date ORDER BY date';  users registered per day

    var dbc, res;

    try {
        dbc = await dbp.connect();
        res1 = await dbc.query(sql1);
        if(res1.rows.length>0) { data.artists = res1.rows[0].count; }
        res2 = await dbc.query(sql2);
        if(res2.rows.length>0) { data.artworks = res2.rows[0].count; }
        res3 = await dbc.query(sql3);
        if(res3.rows.length>0) { data.sold = res3.rows[0].count; }
        res4 = await dbc.query(sql4);
        if(res4.rows.length>0) { data.total = res4.rows[0].total; }
        res5 = await dbc.query(sql5);
        if(res5.rows.length>0) { data.users7 = res5.rows[0].count; }
        res6 = await dbc.query(sql6);
        if(res6.rows.length>0) { data.items7 = res6.rows[0].count; }
    } catch(ex) {
        console.error('DB error getting stats:', ex.message);
        data = { error: ex.message };
    } finally {
        if (dbc) { dbc.release(); }
    }
    //console.warn('Data', data);
    return data;
}

async function countOpenTrades() {
//    let sql = 'Select count(1) as value FROM orders WHERE NOT original AND status = 1';
    let sql = 'SELECT count(1) as value' +
              '  FROM orders o' +
              '  LEFT OUTER JOIN artwork a ON o.artwork = a.address' +
              '  LEFT OUTER JOIN users s ON o.seller = s.address' +
              '  WHERE NOT o.original AND o.status = 1 AND a.category < 9 AND NOT s.inactive AND NOT s.redflag AND NOT a.inactive';
    let val = await DS.queryValue(sql);
    return val;
}

async function getOpenTrades(limit=100, page=0) {
    let sql = 'Select o.artwork, o.original, o.orderid, o.seller, o.amount, o.sellprice, a.artid, a.address, a.creator, a.created, a.name, a.onsale, a.media, a.thumbnail, a.saletype, a.saleprice, a.copies, a.available, a.inidate, a.enddate, a.category, s.name as sellername, s.golden as sgolden, s.verified as sverified, s.inactive as sinactive, s.redflag as sredflag, u.name as author, u.golden as agolden, u.verified as averified, u.inactive as ainactive, u.redflag as aredflag' +
              '  FROM orders o' +
              '  LEFT OUTER JOIN artwork a ON o.artwork = a.address' +
              '  LEFT OUTER JOIN users s ON o.seller = s.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE NOT o.original AND o.status = 1 AND a.category < 9 AND NOT s.inactive AND NOT s.redflag AND NOT u.inactive AND NOT u.redflag AND NOT a.inactive' +
              '  ORDER BY o.created DESC' +
              '  LIMIT $1 OFFSET $2';
    let offset = page*limit;
    if(offset<0){ offset = 0; }
    let pars   = [limit, offset];
    let data   = await DS.query(sql, pars);
    //for(i in data) console.warn(i, data[i].artwork);
    return data;
}

async function getOpenTradesByArtwork(artwork) {
    let sql = 'Select o.artwork, o.original, o.orderid, o.seller, o.amount, o.sellprice, a.artid, a.address, a.creator, a.created, a.name, a.onsale, a.media, a.thumbnail, a.saletype, a.saleprice, a.copies, a.available, a.inidate, a.enddate, s.name as sellername, s.golden as sgolden, s.verified as sverified, s.inactive as sinactive, s.redflag as sredflag, u.name as author, u.golden as agolden, u.verified as averified, u.inactive as ainactive, u.redflag as aredflag' +
              '  FROM orders o' +
              '  LEFT OUTER JOIN artwork a ON o.artwork = a.address' +
              '  LEFT OUTER JOIN users s ON o.seller = s.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE o.artwork = $1 AND NOT o.original AND o.status = 1 AND NOT s.inactive AND NOT s.redflag AND NOT u.inactive AND NOT u.redflag AND NOT a.inactive' +
              '  ORDER BY o.sellprice, o.created DESC';
    let pars   = [artwork];
    let data   = await DS.query(sql, pars);
    //for(i in data) console.warn(i, data[i].artwork);
    return data;
}

async function getOpenTradesByCollection(colid, limit=100, page=0) {
    let sql = 'Select o.artwork, o.original, o.orderid, o.seller, o.amount, o.sellprice, a.artid, a.address, a.creator, a.created, a.name, a.onsale, a.media, a.thumbnail, a.saletype, a.saleprice, a.copies, a.available, a.inidate, a.enddate, s.name as sellername, s.golden as sgolden, s.verified as sverified, s.inactive as sinactive, s.redflag as sredflag, u.name as author, u.golden as agolden, u.verified as averified, u.inactive as ainactive, u.redflag as aredflag' +
              '  FROM orders o' +
              '  LEFT OUTER JOIN artwork a ON o.artwork = a.address' +
              '  LEFT OUTER JOIN users s ON o.seller = s.address' +
              '  LEFT OUTER JOIN users u ON a.creator = u.address' +
              '  WHERE o.collection = $1 AND o.status = 1 AND NOT s.inactive AND NOT s.redflag AND NOT u.inactive AND NOT u.redflag AND NOT a.inactive' +
              '  ORDER BY a.name, o.sellprice, o.created DESC' +
              '  LIMIT $2 OFFSET $3';
    let offset = page*limit;
    if(offset<0){ offset = 0; }
    let pars   = [colid, limit, offset];
    let data   = await DS.query(sql, pars);
    //console.warn('Colx', colid);
    //for(i in data) console.warn(i, data[i].artwork);
    return data;
}



//---- ORDERBOOK

async function newMarketOffer(rec) { 
    let fields = schema.tables.orderbook.fields;
    let key    = schema.tables.orderbook.primaryKey;
    let except = [key];
    let parsed = parseInsert('orderbook', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getMarketOffer(offerId) {
    let sql  = 'SELECT * FROM orderbook WHERE orderid = $1';
    let pars = [offerId];
    let data = await DS.queryObject(sql, pars);    
    return data;
}

async function cancelMarketOffer(offerId) {
    let sql  = 'UPDATE orderbook SET status = 9 WHERE orderid = $1';
    let pars = [offerId];
    let data = await DS.update(sql, pars);    
    return data;
}

async function getBidOffers(price) {
    let sql  = 'SELECT * FROM orderbook WHERE ordertype = 1 AND status = 0 AND price >= $1 ORDER BY price desc, created';
    let pars = [price];
    let data = await DS.query(sql, pars);
    return data;
}

async function getAskOffers(price) {
    let sql  = 'SELECT * FROM orderbook WHERE ordertype = 0 AND status = 0 AND price <= $1 ORDER BY price, created ';
    let pars = [price];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getOpenOffersByUser(userid) {
    let sql  = 'SELECT * FROM orderbook WHERE userid = $1 AND status = 0 ORDER BY created desc';
    let pars = [userid];
    let data = await DS.query(sql, pars);
    return data;
}


async function getOrderBook(market) {
    //let sql0  = 'SELECT created, price, amount, total FROM orderbook WHERE market = $1 AND ordertype = 0 AND status = 0 GROUP BY price ORDER BY price asc, created asc'; // sell
    let sql0  = 'SELECT price, sum(amount) as amount, sum(total) as total FROM orderbook WHERE market = $1 AND ordertype = 0 AND status = 0 GROUP BY price ORDER BY price asc  LIMIT 10'; // sell
    let sql1  = 'SELECT price, sum(amount) as amount, sum(total) as total FROM orderbook WHERE market = $1 AND ordertype = 1 AND status = 0 GROUP BY price ORDER BY price desc LIMIT 10'; // buy
    let pars  = [market];
    let data0 = await DS.query(sql0, pars);
    let data1 = await DS.query(sql1, pars);
    return {asks:data0, bids:data1};
}

async function filledOffer(orderId) { 
    let sql  = 'Update orderbook Set status = 2 Where orderid=$1';
    let pars = [orderId];
    let data = await DS.update(sql, pars);
    return data;
}

async function partialOffer(rec, fill, rest) {
    //console.warn('db.partial', rec.orderid, rec.ordertype, fill, rest);

    let ok1, ok2, ok3;
    // original -> 1.partial 
    ok1 = await DS.update('Update orderbook Set status = 1 Where orderid = $1', [rec.orderid]);
    //console.warn('Partial #1', ok1);

    // new offer -> 2.filled with fill
    rec.amount = fill;
    rec.total  = fill*rec.price;
    rec.status = 2;
    rec.txid   = null;
    ok2 = await newMarketOffer(rec);
    //console.warn('Partial #2', ok2);

    // new offer -> 0.open with rest
    rec.amount = rest;
    rec.total  = rest*rec.price;
    rec.status = 0;
    rec.txid   = null;
    ok3 = await newMarketOffer(rec);
    //console.warn('Partial #3', ok3);

    return {ok1,ok2,ok3};
}


//---- TRADES

async function newTrade(rec) { 
    let fields = schema.tables.trades.fields;
    let key    = schema.tables.trades.primaryKey;
    let except = [key];
    let parsed = parseInsert('trades', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getTrade(tradeId) {
    let sql  = 'SELECT * FROM trades WHERE tradeid = $1';
    let pars = [tradeId];
    let data = await DS.queryObject(sql, pars);    
    return data;
}

async function getLatestTrades(limit=100) {
    let sql  = 'SELECT * FROM trades ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getTradeHistory(limit=20) {
    let sql  = 'SELECT * FROM trades WHERE status = 2 ORDER BY created desc LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getTradeHistoryByUser(userid, limit=10) {
    let sql  = 'SELECT * FROM trades WHERE userid = $1 AND status > 0 AND maker = true ORDER BY created desc LIMIT $2';
    let pars = [userid, limit];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getPendingTrades() {
    let sql  = 'SELECT * FROM trades WHERE status = 0 ORDER BY created';
    let data = await DS.query(sql);
    return data;
}

async function payTrade(tradeId, txid) { 
    let sql  = 'Update trades Set status = 2, txid = $2 Where tradeid=$1';
    let pars = [tradeId, txid];
    let data = await DS.update(sql, pars);
    return data;
}

async function failTrade(tradeId) { 
    let sql  = 'Update trades Set status = 1 Where tradeid=$1';
    let pars = [tradeId];
    let data = await DS.update(sql, pars);
    return data;
}



//---- VINCIS

async function newAccount(rec) { 
    let fields = schema.tables.accounts.fields;
    let key    = schema.tables.accounts.primaryKey;
    let except = [key];
    let parsed = parseInsert('accounts', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getAccount(address, guild) {
    let sql  = 'SELECT * FROM accounts WHERE address = $1 AND guild = $2';
    let pars = [address, guild];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function newVincisPayment(rec) { 
    let fields = schema.tables.vincis.fields;
    let key    = schema.tables.vincis.primaryKey;
    let except = [key];
    let parsed = parseInsert('vincis', fields, except, key, rec);
    let sql    = parsed.sql;
    let params = parsed.data;
    let data   = await DS.insert(sql, params, key);
    return data;
}

async function getAccountsByGuild(guild) {
    let sql  = 'SELECT * FROM accounts WHERE guild = $1 AND inactive = false';
    let pars = [guild];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getAccountBalance(adr, guild) {
    let sql  = 'SELECT total as value FROM accounts WHERE address = $1 AND guild = $2 LIMIT 1';
    let pars = [adr, guild];
    let data = await DS.queryValue(sql, pars);
    //console.warn(data);
    let bal  = parseFloat(data) || 0.0;
    return bal;
}

async function getVincisByAccount(adr, guild) {
    let sql  = 'SELECT sum(total) as value FROM vincis WHERE address = $1 AND guild = $2';
    let pars = [adr, guild];
    let data = await DS.queryValue(sql, pars);
    //console.warn(data);
    let bal  = parseFloat(data) || 0.0;
    return bal;
}

async function getVincisByAddress(adr) {
    let sql  = 'SELECT sum(total) as value FROM vincis WHERE address = $1 AND status < 4';
    let pars = [adr];
    let data = await DS.queryValue(sql, pars);
    //console.warn(data);
    let bal  = parseFloat(data) || 0.0;
    return bal;
}

async function getVincisByGuild(guild) {
    let sql  = 'SELECT sum(total) as value FROM vincis WHERE guild = $1';
    let pars = [guild];
    let data = await DS.queryValue(sql, pars);
    //console.warn(data);
    let tot  = parseFloat(data) || 0.0;
    return tot;
}

async function setVincisPending(limit=10) { 
    let sql  = 'UPDATE vincis SET status = 1 WHERE vid IN (SELECT vid FROM vincis WHERE status = 0 ORDER BY vid LIMIT $1)';
    let pars = [limit];
    let data = await DS.update(sql, pars);
    return data;
}

async function getVincisPending(limit=10) {
    let sql  = 'SELECT address, total FROM vincis WHERE status = 1 ORDER BY vid LIMIT $1';
    let pars = [limit];
    let data = await DS.query(sql, pars);
    return data;
}

// Unlock VNL to VINCI by date
async function getVincisToUnlock(address) {
    let udate = (new Date()).toJSON().substr(0,10);
    console.warn('Unlock date', udate);
    let sql   = 'SELECT sum(total) as value FROM vincis WHERE address = $1 AND status = 2 AND unlock::date < $2';
    let pars  = [address, udate];
    let data  = await DS.queryValue(sql, pars);
    return data;
}

// In process
async function getVincisUnlocking(address) {
    let sql   = 'SELECT sum(total) as value FROM vincis WHERE address = $1 AND status = 3';
    let pars  = [address];
    let data  = await DS.queryValue(sql, pars);
    return data;
}

// Set in process
async function setVincisToUnlocking(address) {
    let udate = (new Date()).toJSON().substr(0,10);
    let sql   = 'UPDATE vincis SET status=3 WHERE address = $1 AND status = 2 AND unlock::date < $2';
    let pars  = [address, udate];
    let data  = await DS.update(sql, pars);
    return data;
}

async function setVincisToUnlocked(address) {
    let sql   = 'UPDATE vincis SET status=4 WHERE address = $1 AND status = 3';
    let pars  = [address];
    let data  = await DS.update(sql, pars);
    return data;
}

async function getVincisLocked(address) {
    let sql  = 'SELECT created, address, total, unlock, status FROM vincis WHERE address = $1 ORDER BY created';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function setVincisPaid(limit=10) { 
    let sql  = 'UPDATE vincis SET status = 2 WHERE vid IN (SELECT vid FROM vincis WHERE status = 1 ORDER BY vid LIMIT $1)';
    let pars = [limit];
    let data = await DS.update(sql, pars);
    return data;
}

async function updateAccountBalance(balance, adr, guild) { 
    let sql  = 'UPDATE accounts SET total = $1 WHERE address = $2 AND guild = $3';
    let pars = [balance, adr, guild];
    let data = await DS.update(sql, pars);
    return data;
}

async function incrementAccountBalance(balance, adr, guild) { 
    let sql  = 'UPDATE accounts SET total = total + $1 WHERE address = $2 AND guild = $3';
    let pars = [balance, adr, guild];
    let data = await DS.update(sql, pars);
    return data;
}

async function getArtistsSellers(dini, dend) {
    let sql  = 'SELECT sum(value) as total, sender as address FROM transfers WHERE created BETWEEN $1 AND $2 GROUP BY sender';
    let pars = [dini, dend];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getLatestSellers(dini, dend, limit=20) {
    let sql = 'SELECT count(t.sender) as qty, t.sender as address, u.created, u.avatar, u.name, u.verified, u.golden' +
              '  FROM transfers t' +
              '  LEFT OUTER JOIN users u ON t.sender = u.address' +
              //'  WHERE t.created BETWEEN $1 AND $2 AND u.golden AND NOT u.redflag' +
              '  WHERE NOT (u.redflag OR u.inactive)' +
              '  GROUP BY t.sender, u.created, u.avatar, u.name, u.verified, u.golden' +
              '  ORDER BY qty desc' +
              '  LIMIT $1';
    //let pars = [dini, dend, limit];
    let pars = [limit];
    let data = await DS.query(sql, pars);    
    return data;
}

async function getTotalTransfers(dini, dend) {
    let sql  = 'SELECT sum(value) as value FROM transfers WHERE created BETWEEN $1 AND $2';
    let pars = [dini, dend];
    let data = await DS.queryValue(sql, pars);
    return data;
}

async function getArtistsBuyers(dini, dend) {
    let sql  = 'SELECT sum(value) as total, receiver as address FROM transfers WHERE created BETWEEN $1 AND $2 GROUP BY receiver';
    let pars = [dini, dend];
    let data = await DS.query(sql, pars);    
    return data;
}


//---- USER STATS


async function getUserStats(address) {
    let sql1  = 'SELECT count(1) as value FROM artwork WHERE creator = $1';
    let sql2  = 'SELECT count(value) as qty, sum(value) as total FROM transfers WHERE sender = $1 AND orderid IS NOT NULL';
    let sql3  = 'SELECT count(value) as qty, sum(value) as total FROM transfers WHERE receiver = $1 AND orderid IS NOT NULL';
    let sql4  = 'SELECT created, value FROM transfers WHERE sender = $1 AND orderid IS NOT NULL';
    let sql5  = 'SELECT created, value FROM transfers WHERE receiver = $1 AND orderid IS NOT NULL';
    let sql6  = 'SELECT count(1) as value FROM collections WHERE owner = $1 AND NOT inactive';
    let pars  = [address];
    let data1 = await DS.queryValue(sql1, pars);
    let data2 = await DS.queryObject(sql2, pars);
    let data3 = await DS.queryObject(sql3, pars);
    let data4 = await DS.queryObject(sql4, pars);
    let data5 = await DS.queryObject(sql5, pars);
    let data6 = await DS.queryValue(sql6, pars);
    let info = {
        minted : parseInt(data1)|| 0,
        earnqty: data2?.qty     || 0,
        earntot: data2?.total   || 0,
        earndat: data4?.created || '',
        earnlst: data4?.value   || 0,
        expnqty: data3?.qty     || 0,
        expntot: data3?.total   || 0,
        expndat: data5?.created || '',
        expnlst: data5?.value   || 0,
        collect: parseInt(data6)|| 0
    }
    return info;
}

async function statsMintedByUser(address) {
    let sql  = 'SELECT count(1) as value FROM artwork WHERE creator = $1';
    let pars = [address];
    let data = await DS.queryValue(sql, pars);
    return data;
}

async function statsCollectionsByUser(address) {
    let sql  = 'SELECT count(1) as value FROM collections WHERE owner = $1';
    let pars = [address];
    let data = await DS.queryValue(sql, pars);
    return data;
}

async function statsSoldByUser(address) {
    let sql  = 'SELECT count(value) as qty, sum(value) as total FROM transfers WHERE sender = $1 AND orderid IS NOT NULL';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function statsBoughtByUser(address) {
    let sql  = 'SELECT count(value) as qty, sum(value) as value FROM transfers WHERE receiver = $1 AND orderid IS NOT NULL';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function lastSoldByUser(address) {
    let sql  = 'SELECT created, value FROM transfers WHERE sender = $1 AND orderid IS NOT NULL';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function lastBoughtByUser(address) {
    let sql  = 'SELECT created, value FROM transfers WHERE receiver = $1 AND orderid IS NOT NULL';
    let pars = [address];
    let data = await DS.query(sql, pars);
    return data;
}

async function getErrors(limit=100, offset=0) {
    let sql  = 'SELECT * FROM errors Order by created desc Limit $1 Offset $2';
    let pars = [limit, offset];
    let data = await DS.query(sql, pars);
    return data;
}

async function saveError(rec) { 
    let sql  = 'Insert into errors("call", "column", "line", "message", "method", "name", "origin", "stack") values($1, $2, $3, $4, $5, $6, $7, $8) Returning errid'
    let pars = [rec.call, rec.column, rec.line, rec.message, rec.method, rec.name, rec.origin, rec.stack];
    let data = await DS.insert(sql, pars, 'errid');
    return data;
}



//---- EXPORTS

module.exports = {
    getTime,
    newUser,
    getUser,
    modUser,
    getLatestUsers,
    getLatestVerified,
    getUsersActive,
    getUsersListed,
    getUserByLowerName,
    getGoldenUsers,
    getGoldenArtists,
    getVerifiedArtists,
    setArtistVerified,
    setArtistUnverified,
    setArtistRedflag,
    setArtistUnflag,
    setArtistInactive,
    updateSocialBadge,
    updateGoldenBadge,

    newCollection,
    getCollection,
    modCollection,
    saveCollection,
    getCollections,
    getLatestCollections,
    getCollectionsByUser,
    getCollectionsByOwner,
    getCollectionsHot,
    getCollectionsNew,
    getDavinciCollections,

    newArtwork,
    getArtwork,
    modArtwork,
    viewArtwork,
    likeArtwork,
    saveArtwork,
    checkArtwork,
    getArtworks,
    getLatestArtworks,
    apiLatestArtworks,
    getArtworkCount,
    getArtworkByOwner,
    getArtworksByUser,
    getArtworksBySelf,
    getArtworksByOwner,
    getArtworksByType,
    getArtworksByTags,
    getArtworksByPage,
    getArtworksByCollection,
    getArtworksByCategory,
    getArtworksGolden,
    getArtworksVerified,
    getArtworksNotVerified,
    setArtworkInactive,
    updatePrice,
    updateCopies,
    updateResell,
    changeCategory,

    newOwner,
    getOwner,
    modOwner,
    getOwners,
    getLatestOwners,
    getOwnersByUser,
    getOwnerByToken,
    getOwnerByArtwork,
    getOwnersByArtwork,
    saveOwnership,
    checkOwner,
    changeOwner,
    removeOwner,
    resellOwnership,

    newOrder,
    getOrder,
    modOrder,
    getOrders,
    getLatestOrders,
    getOrdersByUser,
    getOrderByToken,
    getOrderByArtwork,
    getOrdersByArtwork,
    getOrderByAddress,
    getOpenOrderByArtwork,
    getOpenOrderByOwner,
    getOpenTrades,
    getOpenTradesByArtwork,
    getOpenTradesByCollection,
    countOpenTrades,

    newBid,
    getBid,
    modBid,
    getLatestBids,
    getBidsByUser,
    getBidsByOrder,
    getBidsByAddress,
    getLastValidBid,

    newTransfer,
    getTransfer,
    modTransfer,
    getTransfers,
    getLatestTransfers,
    getTransfersByUser,
    getTransfersByToken,

    newFavorite,
    modFavorite,
    getFavorite,

    newReported,
    getReportedArtworks,
    getReportsByArtwork,

    newComment,
    getComment,
    modComment,
    getComments,
    getCommentsByArtwork,

    newActivity,
    getActivity,
    modActivity,
    getLatestActivity,
    getActivityByUser,
    readActivity,

    newProposal,
    getProposal,
    modProposal,
    getLatestProposals,
    getProposalsByStatus,

    newVote,
    checkVote,
    getLatestVotes,
    tallyVotes,

    getOrderBook,
    newMarketOffer,
    getMarketOffer,
    cancelMarketOffer,
    getAskOffers,
    getBidOffers,
    getOpenOffersByUser,
    filledOffer,
    partialOffer,

    newTrade,
    getTrade,
    getLatestTrades,
    getTradeHistory,
    getTradeHistoryByUser,
    getPendingTrades,
    payTrade,
    failTrade,

    newVincisPayment,
    newAccount,
    getAccount,
    getAccountsByGuild,
    getAccountBalance,
    getVincisByAccount,
    getVincisByAddress,
    getVincisByGuild,
    getVincisPending,
    setVincisPending,
    setVincisPaid,
    getVincisLocked,
    getVincisToUnlock,
    getVincisUnlocking,
    setVincisToUnlocking,
    setVincisToUnlocked,
    updateAccountBalance,
    incrementAccountBalance,
    getTotalTransfers,
    getArtistsSellers,
    getArtistsBuyers,
    getLatestSellers,

    getStats,
    getUserStats,
    getGalleries,
    newReservation,
    getSettings,
    getConfig,
    setConfig,
    getErrors,
    saveError
}


// END