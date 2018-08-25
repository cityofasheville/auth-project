const cache = require('../cache/cache');
const axios = require('axios');

const getPublicKeys = function () {
  const keysUrl = `https://cognito-idp.${process.env.region}.amazonaws.com/${process.env.userpoolId}/.well-known/jwks.json`;
  const publicKeys = cache.get('public_keys');
  if (publicKeys) {
    return Promise.resolve(publicKeys);
  } else {
    return axios.get(keysUrl)
    .then(response => {
      if (response.status == 200) {
        const keys = response.data['keys'];
        cache.store('public_keys', keys, 24);
        return Promise.resolve(keys);
      }
      throw new Error('Unable to retrieve Cognito public keys for authentication');  
    });
  }
}

module.exports = getPublicKeys;