const mongoose = require('mongoose');
const fs = require('fs');

const dns = require('dns');
const hostToIpMap = {
    '_mongodb._tcp.cluster0.yg0v7az.mongodb.net': '159.41.227.3',
    'ac-be6qcjz-shard-00-00.yg0v7az.mongodb.net': '159.41.227.3',
    'ac-be6qcjz-shard-00-01.yg0v7az.mongodb.net': '159.41.199.185',
    'ac-be6qcjz-shard-00-02.yg0v7az.mongodb.net': '159.41.227.8',
    'cluster0.yg0v7az.mongodb.net': '159.41.227.3'
};

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
    if (hostToIpMap[hostname]) {
        if (typeof options === 'function') {
            callback = options;
            options = { family: 4, all: false };
        }
        if (options && options.all) {
            return callback(null, [{ address: hostToIpMap[hostname], family: 4 }]);
        }
        return callback(null, hostToIpMap[hostname], 4);
    }
    return originalLookup(hostname, options, callback);
};

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
} catch (e) { }

const User = require('./src/models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ isGuest: false }, 'email password');
        console.log('--- ALL NON-GUEST USERS ---');
        console.log(users.length === 0 ? 'NO REGISTERED USERS FOUND!' : users);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
