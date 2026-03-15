const dns = require('dns');

// Override DNS resolution to use Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const uri = "mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/quizzly?retryWrites=true&w=majority&authSource=admin";

console.log("Connecting with patched DNS...");

mongoose.set('strictQuery', false);
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log("✅ SUCCESSFUL CONNECTION BY PATCHING DNS!");
  process.exit(0);
})
.catch(err => {
  console.error("❌ FAILED:", err.name, err.message);
  process.exit(1);
});
