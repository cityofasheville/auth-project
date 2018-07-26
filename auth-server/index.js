const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const parseurl = require('parseurl');
const cors = require('cors');
const axios = require('axios');
const jose = require('node-jose');
const qs = require('qs');
// TODO:
//  1. Store the information in session
//  2. Get information showing up in client
//  3. Make use of the refresh token
//  4. Add Google (and ideally get more info?)
//  5. Do the logout workflow
//  6. Make sure we have all error checking and logging
//  7. Break out and libraryize

const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
    secret: 'Hagrid'
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
    secret: 'raptor'
  },
];

const typeDefs = gql`
  type Book {
    title: String
    author: String
    secret: String
  }

  type Query {
    "This is documentation"
    books: [Book]
  }

  type LoginResult {
    loggedIn: Boolean
    message: String
    reason: String
  }

  type Mutation {
    registerCode (code: String!): LoginResult
  }
`;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

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
    client_secret: 'pssq8927rtjl5q6la7pdu578qg0uatppmdblmamog6pb7rd0gq5',
    code: args.code,
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
  axios({
    method: 'post',
    url: cognitoUrls[0],
    data: qs.stringify(data),
    headers,
  })
  .then((response) => {
    console.log('Back with a response');

    token = response.data.id_token;
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
        console.log(`Check the kid ${keys[i].kid}`);
        if (kid == keys[i].kid) {
            keyIndex = i;
            break;
        }
      }
      if (keyIndex == -1) {
        throw new Error('Public key not found in jwks.json');
      }
      // construct the public key
      jose.JWK.asKey(keys[keyIndex])
      .then(result => {
        console.log('Now verify sig');
        // verify the signature
        jose.JWS.createVerify(result).verify(token)
        .then(vresult => {
          // now we can use the claims
          const claims = JSON.parse(vresult.payload.toString('ascii'));
          console.log(claims);
          console.log(`Payload type is ${typeof claims}`);
          // additionally we can verify the token expiration
          console.log(`Claims.exp = ${claims.exp}`);
          current_ts = Math.floor(new Date() / 1000);
          console.log(`Current_ts = ${current_ts}`);
          if (current_ts > claims.exp) {
            console.log('Token is expired!');
            throw new Error('Expired token');
          }
          // and The Audience (use claims.client_id if verifying an access token)
          if (claims.aud != appClientId) {
            throw new Error('Token was not issued for this audience');
          }
          console.log('GOT THE CLAIMS: ' + JSON.stringify(claims));
        })
        .catch(function() {
          console.log('Signature verification failed');
          throw new Error('Signature verification failed');
        });
      })
      return { loggedIn: true, message: 'Hi there', reason: 'No reason' };
    }
    console.log('I should not be here');
    throw new Error('Bad response getting Cognito keys');
  })
  .catch(error => {
    console.log('Back with an error');
    console.log(error);
  });
};

const resolvers = {
  Query: {
    books: (parent, args, context) => books.map(itm => {
      console.log('In books');
      return {
        title: itm.title,
        author: itm.author,
        secret: itm.secret,
      }
    }),
  },
  Mutation: {
    registerCode,
  },
};

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

const server = new ApolloServer({ 
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    session: req.session,
  }),
});

const app = express();
app.use(session({
  name: 'ejid',
  secret: 'my little secret',
  resave: false,
  saveUninitialized: true,
  // store: new redisStore({
  //   host: 'redis-test-4.zwdfeb.0001.use1.cache.amazonaws.com',
  //   port: 6379,
  // }),
  cookie: { 
    httpOnly: true,
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));
app.use(cors(corsOptions));

app.use(function (req, res, next) {
  // console.log(`HI: ${req.url}`);
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.views) {
    req.session.views = {};
  }
  const pathname = parseurl(req).pathname;
  req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;
  // console.log(`View count is ${JSON.stringify(req.session.views)} for ${req.session.id}`);
  next();
});
// app.use(function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
//   next();
// });

// app.get('/abcd', function(req, res) {
//   console.log(`In abcd: ${req.url}`);
//   // res.send(req.url);
//   res.redirect('/graphql');
// });
server.applyMiddleware({ app, cors: corsOptions });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
