const jose = require('node-jose');
const cache = require('./cache');
const getPublicKeys = require('./getPublicKeys');

const decodeToken = function(kid, appClientId, token, type = 'authorization_code') {
  let shortExpire = 0;
  // const publicKeys = cache.get('public_keys');
  return getPublicKeys()
  .then(publicKeys => {
  // Search for the kid in the downloaded public keys
    let keyIndex = -1;
    for (let i=0; i < publicKeys.length; i++) {
      if (kid == publicKeys[i].kid) {
          keyIndex = i;
          break;
      }
    }
    if (keyIndex == -1) {
      throw new Error('Public key not found in jwks.json');
    }
    // Construct the public key
    return jose.JWK.asKey(publicKeys[keyIndex])
  })
  .then(result => {
    // Verify the signature
    return jose.JWS.createVerify(result).verify(token)
    .then(vresult => {
      // Now we can use the claims
      const claims = JSON.parse(vresult.payload.toString('ascii'));

      // Verify the token expiration
      if (type == 'test') {
        shortExpire = 3570;
      }
      current_ts = shortExpire + Math.floor(new Date() / 1000);
      console.log(`TS = ${current_ts}, exp = ${claims.exp}`);
      if (current_ts > claims.exp) {
        console.log('Token is expired!');
        return Promise.resolve({ status: 'expired', claims });
      }

      // Verify audience (use claims.client_id if verifying an access token)
      if (claims.aud != appClientId) {
        throw new Error('Token was not issued for this audience');
      }
      return Promise.resolve({ status: 'ok', claims });
    })
    .catch(function(error) {
      console.log('Signature verification failed');
      throw new Error('Signature verification failed ' + error);
    });
  });
}

module.exports = decodeToken;
