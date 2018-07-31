const axios = require('axios');
const jose = require('node-jose');
const decodeToken = require('./decodeToken');
const qs = require('qs');
const cache = require('./cache');

const registerCode = function (parent, args, context) {
  console.log('In registerCode resolver');
  console.log(args.code);
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // const region = 'us-east-1';
  // const userpoolId = 'us-east-1_hBNUnqaVB';
  // const appClientId = '2uu574tlad2ajk5hmj94fnjeva';
  const keysUrl = `https://cognito-idp.${process.env.region}.amazonaws.com/${process.env.userpoolId}/.well-known/jwks.json`;

  const data = {
    grant_type: 'authorization_code',
    scope: 'email openid profile',
    client_id: process.env.appClientId,
    code: args.code,
    redirect_uri: 'http://localhost:3000/xyz',
  };

  let sections = null;
  let header = null;
  let kid = null;
  let token = null;

  // Code adapted from https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.js

  return axios({
    method: 'post',
    url: process.env.cognitoOauthUrl,
    data: qs.stringify(data),
    headers,
  })
  .then((response) => {
    console.log(`KEYS: ${Object.keys(response.data)}`);
    token = response.data.id_token;
    console.log('We have the context of ' + context.req.session.id);
    console.log(`Expires in ${response.data.expires_in}`);
    cache.store(context.req.session.id, {
      id_token: token,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
    });
    cache.store('id_token', token);
    cache.store('access_token', response.data.access_token);
    cache.store('refresh_token', response.data.refresh_token);
    sections = token.split('.');
    // get the kid from the headers prior to verification
    header = JSON.parse(jose.util.base64url.decode(sections[0]));
    kid = header.kid;
    return axios.get(keysUrl); // should cache this.
  })
  .then(response => {
    if (response.status == 200) {
      console.log(`KEYS: ${Object.keys(response.data)}`);
      const keys = response.data['keys'];
      cache.store('public_keys', keys);
      return decodeToken(kid, process.env.appClientId, token)
      .then(result => {
        if (result.status !== 'ok') throw new Error(`Error decoding token: ${result.status}`);
        const claims = result.claims;
        console.log('GOT THE CLAIMS: ' + JSON.stringify(claims));
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
      }); // NEWNEWNEWNEW
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
