const jose = require('node-jose');
const cache = require('./cache');

const decodeToken = function(kid, appClientId, token, type = 'authorization_code') {
  const publicKeys = cache.get('public_keys');
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
  .then(result => {
    // Verify the signature
    return jose.JWS.createVerify(result).verify(token)
    .then(vresult => {
      // Now we can use the claims
      const claims = JSON.parse(vresult.payload.toString('ascii'));

      // Verify the token expiration
      current_ts = Math.floor(new Date() / 1000);
      if (current_ts > claims.exp) {
        console.log('Token is expired!');
        return Promise.resolve({ status: 'expired', claims });
      }

      if (type == 'test') return Promise.resolve({ status: 'expired', claims });

      // Verify audience (use claims.client_id if verifying an access token)
      if (type === 'authorization_code' && claims.aud != appClientId) {
        throw new Error('Token was not issued for this audience');
      }
      console.log(claims);
      if (type === 'refresh_token' && claims.client_id != appClientId) {
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
