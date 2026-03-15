const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Inject the DNS bypass logic
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

// Load environment variables manually
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
        }
    });
} catch (error) {
    console.error('Error loading .env file:', error.message);
}

const User = require('./src/models/User');

async function testLogin(email, password) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connected');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`❌ User with email ${email} NOT FOUND in database.`);

            // List all users to see what emails exist
            const allUsers = await User.find({}, 'email isGuest').limit(5);
            console.log('Some existing users in DB:', allUsers);

            process.exit(1);
        }

        console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
        console.log(`Hashed password in DB: ${user.password}`);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Password DOES NOT match!');

            // Check if maybe it was hashed twice or saved plain text
            if (user.password === password) {
                console.log('⚠️ Warning: Password seems to be stored as plain text!');
            }
        } else {
            console.log('✅ Password matches!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Read email and password from process args
const email = process.argv[2] || 'pasindumanodya360@gmail.com';
const password = process.argv[3] || 'Password123'; // Guessing the password or just testing

testLogin(email, password);
