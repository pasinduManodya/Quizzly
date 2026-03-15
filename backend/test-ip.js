const mongoose = require('mongoose');

const uri = "mongodb://pasindu:12345@159.41.227.3:27017,159.41.199.185:27017,159.41.227.8:27017/quizzly?ssl=true&authSource=admin&replicaSet=atlas-pdmcc1-shard-0&retryWrites=true&w=majority";

console.log("Connecting via IP...");

mongoose.set('strictQuery', false);
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  tlsAllowInvalidCertificates: true, // Bypass cert domain mismatch since we're using raw IPs
})
.then(() => {
  console.log("✅ SUCCESSFUL CONNECTION BY IP!");
  process.exit(0);
})
.catch(err => {
  console.error("❌ FAILED:", err);
  process.exit(1);
});
