const axios = require('axios');
const jose = require('node-jose');
const qs = require('qs');

const decodeToken = function(token) {
  
}

const registerCode = function (parent, args, context) {
  console.log('In registerCode resolver');
  console.log(args.code);
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const region = 'us-east-1';
  const userpoolId = 'us-east-1_hBNUnqaVB';
  const appClientId = '2uu574tlad2ajk5hmj94fnjeva';
  const keysUrl = `https://cognito-idp.${region}.amazonaws.com/${userpoolId}/.well-known/jwks.json`;

  const data = {
    grant_type: 'authorization_code',
    scope: 'email openid profile',
    client_id: appClientId,
    code: args.code,
    redirect_uri: 'http://localhost:3000/xyz',
  };

  // for refresh see https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
  const refreshData = {
    grant_type: 'refresh_token',
    scope: 'email openid profile',
    client_id: appClientId,
    refresh_token: context.session.refresh_token,
    redirect_uri: 'http://localhost:3000/xyz',
  };

  const cognitoUrls = [
    'https://coa-web-2.auth.us-east-1.amazoncognito.com/oauth2/token/'
  ];
  // https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.js

  let sections = null;
  let header = null;
  let kid = null;
  let token = null;

  return axios({
    method: 'post',
    url: cognitoUrls[0],
    data: qs.stringify(data),
    headers,
  })
  .then((response) => {
    token = response.data.id_token;
    context.session.id_token = token;
    context.session.access_token = response.data.access_token;
    context.session.refresh_token = response.data.refresh_token;
    sections = token.split('.');
    // get the kid from the headers prior to verification
    header = JSON.parse(jose.util.base64url.decode(sections[0]));
    kid = header.kid;
    return axios.get(keysUrl); // should cache this.
  })
  .then(response => {
    console.log(response.status);
    if (response.status == 200) {
      const keys = response.data['keys'];
      // search for the kid in the downloaded public keys
      let keyIndex = -1;
      for (let i=0; i < keys.length; i++) {
        if (kid == keys[i].kid) {
            keyIndex = i;
            break;
        }
      }
      if (keyIndex == -1) {
        throw new Error('Public key not found in jwks.json');
      }
      // construct the public key
      return jose.JWK.asKey(keys[keyIndex])
      .then(result => {
        console.log('Now verify sig');
        // verify the signature
        return jose.JWS.createVerify(result).verify(token)
        .then(vresult => {
          // now we can use the claims
          const claims = JSON.parse(vresult.payload.toString('ascii'));
          //console.log(claims);
          //console.log(`Payload type is ${typeof claims}`);
          // additionally we can verify the token expiration
          //console.log(`Claims.exp = ${claims.exp}`);
          current_ts = Math.floor(new Date() / 1000);
          //console.log(`Current_ts = ${current_ts}`);
          if (current_ts > claims.exp) {
            console.log('Token is expired!');
            throw new Error('Expired token');
          }
          // and The Audience (use claims.client_id if verifying an access token)
          if (claims.aud != appClientId) {
            throw new Error('Token was not issued for this audience');
          }
          // console.log('GOT THE CLAIMS: ' + JSON.stringify(claims));
          if (context.session) {
            context.session.email = claims.email;
            console.log(`Setting email to ${context.session.email}`);
          }
          // console.log(`SESSION: ${JSON.stringify(context.session)}`);
          return Promise.resolve({
            loggedIn: true, 
            message: 'Hi there', 
            reason: 'No reason'
          });
        })
        .catch(function() {
          console.log('Signature verification failed');
          throw new Error('Signature verification failed');
        });
      });
    }
    console.log('I should not be here');
    throw new Error('Bad response getting Cognito keys');
  })
  .catch(error => {
    console.log('Back with an error');
    console.log(error);
  });
};

module.exports = registerCode;
