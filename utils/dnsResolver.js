const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

class DNSResolver {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.fallbackServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222']; // Google, Cloudflare, OpenDNS
  }

  async resolveHostname(hostname, retries = 3) {
    const cacheKey = hostname;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Using cached DNS resolution for ${hostname}: ${cached.address}`);
      return cached.address;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Resolving DNS for ${hostname} (attempt ${attempt}/${retries})...`);
        
        // Try different DNS servers if needed
        const result = await dnsLookup(hostname, { 
          family: 4, // Force IPv4
          all: false // Get first result
        });
        
        const address = result.address;
        
        this.cache.set(cacheKey, {
          address,
          timestamp: Date.now()
        });
        
        console.log(`✅ DNS resolved ${hostname} -> ${address}`);
        return address;
        
      } catch (error) {
        console.error(`❌ DNS resolution attempt ${attempt} failed for ${hostname}:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async preResolveMongoDBHosts() {
    const hosts = [
      'cluster0.yg0v7az.mongodb.net',
      'ac-be6qcjz-shard-00-00.yg0v7az.mongodb.net',
      'ac-be6qcjz-shard-00-01.yg0v7az.mongodb.net',
      'ac-be6qcjz-shard-00-02.yg0v7az.mongodb.net'
    ];

    console.log('🔍 Pre-resolving MongoDB hostnames...');
    
    const results = [];
    for (const host of hosts) {
      try {
        const address = await this.resolveHostname(host);
        results.push({ host, address, success: true });
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between resolutions
      } catch (error) {
        console.warn(`⚠️  Failed to pre-resolve ${host}:`, error.message);
        results.push({ host, address: null, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ DNS pre-resolution completed: ${successCount}/${hosts.length} successful`);
    
    return results;
  }

  async testDNSResolution() {
    console.log('🧪 Testing DNS resolution...');
    
    const testHosts = [
      'google.com',
      'github.com',
      'cluster0.yg0v7az.mongodb.net'
    ];
    
    for (const host of testHosts) {
      try {
        const address = await this.resolveHostname(host);
        console.log(`✅ ${host} -> ${address}`);
      } catch (error) {
        console.log(`❌ ${host} -> Failed: ${error.message}`);
      }
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️  DNS cache cleared');
  }
}

module.exports = new DNSResolver();
