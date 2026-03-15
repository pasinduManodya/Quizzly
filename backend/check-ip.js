const os = require('os');
const http = require('http');

console.log("Checking local network interfaces for IPv6...");
const interfaces = os.networkInterfaces();
let hasIPv6 = false;

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv6' && !iface.internal) {
      console.log(`Found IPv6 on interface ${name}: ${iface.address}`);
      hasIPv6 = true;
    }
  }
}

console.log("IPv6 detected locally:", hasIPv6);

console.log("\nChecking public IP address...");
http.get('http://api64.ipify.org', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Public IP address:", data);
    console.log("Is IPv6?", data.includes(':'));
  });
}).on('error', err => {
  console.error("Error fetching public IP:", err.message);
});
