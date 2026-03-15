const dns = require('dns');

// Map of hostnames to resolved IP addresses (from 8.8.8.8)
const hostToIpMap = {
  '_mongodb._tcp.cluster0.yg0v7az.mongodb.net': '159.41.227.3',
  'ac-be6qcjz-shard-00-00.yg0v7az.mongodb.net': '159.41.227.3',
  'ac-be6qcjz-shard-00-01.yg0v7az.mongodb.net': '159.41.199.185',
  'ac-be6qcjz-shard-00-02.yg0v7az.mongodb.net': '159.41.227.8',
  'cluster0.yg0v7az.mongodb.net': '159.41.227.3'
};

const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (hostToIpMap[hostname]) {
    console.log(`[DNS PATCH] Intercepted lookup for ${hostname} -> ${hostToIpMap[hostname]}`);
    
    // Handle different call signatures
    if (typeof options === 'function') {
      callback = options;
      options = { family: 4, all: false };
    }
    
    // Handle options.all = true which returns an array
    if (options && options.all) {
      return callback(null, [{ address: hostToIpMap[hostname], family: 4 }]);
    }
    
    return callback(null, hostToIpMap[hostname], 4);
  }
  return originalLookup(hostname, options, callback);
};

const mongoose = require('mongoose');
mongoose.set('debug', true);

const uri = "mongodb://pasindu:12345@ac-be6qcjz-shard-00-00.yg0v7az.mongodb.net:27017,ac-be6qcjz-shard-00-01.yg0v7az.mongodb.net:27017,ac-be6qcjz-shard-00-02.yg0v7az.mongodb.net:27017/quizzly?ssl=true&authSource=admin&replicaSet=atlas-pdmcc1-shard-0&retryWrites=true&w=majority";

console.log("Connecting with dns.lookup patch...");

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log("✅ SUCCESSFUL CONNECTION BY PATCHING DNS.LOOKUP!");
  process.exit(0);
})
.catch(err => {
  console.error("❌ Mongoose Error Details:");
  console.error(err);
  process.exit(1);
});
