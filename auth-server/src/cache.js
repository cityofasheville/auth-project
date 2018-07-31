const redis = require('redis');
const useRedis = false;

class CacheClient {
  constructor() {
    this.cache = {};
  }

  store(key, value) {
    this[key] = value;
  }

  get(key) {
    return this[key];
  }
}

module.exports = new CacheClient();
