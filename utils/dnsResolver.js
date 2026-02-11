import dns from "node:dns/promises";

class DNSResolver {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.fallbackServers = ["8.8.8.8", "1.1.1.1", "208.67.222.222"]; // Google, Cloudflare, OpenDNS
    dns.setServers(this.fallbackServers);
  }

  async resolveA(hostname, retries = 3) {
    const cacheKey = `A:${hostname}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Using cached A record for ${hostname}: ${cached.address}`);
      return cached.address;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Resolving A record for ${hostname} (attempt ${attempt}/${retries})...`);
        const addresses = await dns.resolve4(hostname);
        const address = addresses[0];
        this.cache.set(cacheKey, { address, timestamp: Date.now() });
        console.log(`✅ Resolved A record ${hostname} -> ${address}`);
        return address;
      } catch (err) {
        console.warn(`❌ A record attempt ${attempt} failed for ${hostname}: ${err.message}`);
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  async resolveSRV(hostname, retries = 3) {
    const cacheKey = `SRV:${hostname}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Using cached SRV for ${hostname}`);
      return cached.records;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Resolving SRV for ${hostname} (attempt ${attempt}/${retries})...`);
        const records = await dns.resolveSrv(hostname);
        this.cache.set(cacheKey, { records, timestamp: Date.now() });
        console.log(`✅ SRV resolved ${hostname}:`, records);
        return records;
      } catch (err) {
        console.warn(`❌ SRV attempt ${attempt} failed for ${hostname}: ${err.message}`);
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  async preResolveMongoHosts() {
    const hosts = [
      "_mongodb._tcp.cluster0.yg0v7az.mongodb.net", // SRV record
      "ac-be6qcjz-shard-00-00.yg0v7az.mongodb.net",
      "ac-be6qcjz-shard-00-01.yg0v7az.mongodb.net",
      "ac-be6qcjz-shard-00-02.yg0v7az.mongodb.net",
    ];

    console.log("🔍 Pre-resolving MongoDB hostnames...");

    const results = [];
    for (const host of hosts) {
      try {
        if (host.startsWith("_mongodb")) {
          const srvRecords = await this.resolveSRV(host);
          results.push({ host, success: true, records: srvRecords });
        } else {
          const address = await this.resolveA(host);
          results.push({ host, success: true, address });
        }
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.warn(`⚠️ Failed to resolve ${host}: ${err.message}`);
        results.push({ host, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ DNS pre-resolution completed: ${successCount}/${hosts.length} successful`);
    return results;
  }

  async testCommonHosts() {
    console.log("🧪 Testing DNS resolution for common hosts...");
    const hosts = ["google.com", "github.com", "cluster0.yg0v7az.mongodb.net"];
    for (const host of hosts) {
      try {
        const address = await this.resolveA(host);
        console.log(`✅ ${host} -> ${address}`);
      } catch (err) {
        console.warn(`❌ ${host} -> Failed: ${err.message}`);
      }
    }
  }

  clearCache() {
    this.cache.clear();
    console.log("🗑️ DNS cache cleared");
  }
}

export default new DNSResolver();
