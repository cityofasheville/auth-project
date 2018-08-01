const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const parseurl = require('parseurl');
const cors = require('cors');
const registerCode = require('./src/registerCode');
const axios = require('axios');
const jose = require('node-jose');
const qs = require('qs');

require('dotenv').config();
const cache = require('./src/cache');
const decodeToken = require('./src/decodeToken');
// TODO:
//  XXX 1. Store the information in session
//  XXX 2. Get information showing up in client
//  XXX 3. Make use of the refresh token
//  XXX 4. Add Google (and ideally get more info?)
//  5. Add better caching
//  6. Do the logout workflow
//  7. Make sure we have all error checking and logging
//  8. Break out and libraryize

// NOTE: To add Google authentication to a project:
//        https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html

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
    req: req,
  }),
});

const app = express();
app.use(session({
  name: 'ejid',
  secret: 'my little secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true,
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));
app.use(cors(corsOptions));

getUserData = require('./src/getUserData');
app.use(function (req, res, next) { // Check logged in status
  if (req.session) req.session.loggedIn =false;

  const c = cache.get(req.session.id);
  if (c) {
    // get the kid from the headers prior to verification
    let header = JSON.parse(jose.util.base64url.decode(c.id_token.split('.')[0]));
    kid = header.kid;

    decodeToken(kid, process.env.appClientId, c.id_token, 'test')
    .then(result => {
      if (result.status == 'expired') {
        // Do stuff
        console.log('Result is expired');
        // for refresh see https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
        const refreshData = {
          grant_type: 'refresh_token',
          scope: 'email openid profile',
          client_id: process.env.appClientId,
          refresh_token: c.refresh_token,
          redirect_uri: '',
        };
        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };      
        return axios({
          method: 'post',
          url: process.env.cognitoOauthUrl,
          data: qs.stringify(refreshData),
          headers,
        })
        .then((response) => {
          if (response.status == 200) {
            // get the kid from the headers prior to verification
            const sections = response.data.id_token.split('.');
            header = JSON.parse(jose.util.base64url.decode(sections[0]));
            kid = header.kid;
            decodeToken(kid, process.env.appClientId, response.data.id_token, 'refresh_token')
            .then(result => {
              if (result.status !== 'ok') throw new Error(`Error decoding token: ${result.status}`);
              const claims = result.claims;
              req.session.loggedIn =true;

              cache.store(req.session.id, 
                Object.assign(c, {
                  id_token: response.data.id_token,
                  access_token: response.data.access_token,
                  // refresh_token: response.data.refresh_token,
                }));
              next();
            });
          }      
        });
      } else if (result.status == 'ok') {
        req.session.loggedIn =true;
        console.log('result is ok!');
        next();
      } else {
        console.log('WTF!');
      }
    })
  }
  console.log('And that is all folks');
  next();
});

app.use(function (req, res, next) {
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.views) {
    req.session.views = {};
  }
  const pathname = parseurl(req).pathname;
  console.log(`The email here is ${req.session.email}`);
  req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;
  console.log(`View count is ${JSON.stringify(req.session.views)} for ${req.session.id}`);
  next();
});

server.applyMiddleware({ app, cors: corsOptions });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
