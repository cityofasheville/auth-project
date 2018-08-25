const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session)
const parseurl = require('parseurl');
const cors = require('cors');
const apiSchema = require('./api/api_schema');

require('dotenv').config();
const cache = require('./common/cache/cache');
const checkLogin = require('./common/auth/check_login');
const GRAPHQL_PORT = process.env.PORT || 4000;

// TODO:
//  7. Make sure we have all error checking and logging
//  8. Break out and libraryize

// NOTE: To add Google authentication to a project:
//        https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html


const server = new ApolloServer({ 
  typeDefs: require('./schema'),
  resolvers: require('./resolvers'),
  context: ({ req }) => ({
    session: req.session,
    req: req,
  }),
});

const app = express();
app.use(session({
  name: process.env.sessionName,
  secret: process.env.sessionSecret, 
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: { 
    httpOnly: true,
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * process.env.maxSessionDays,
  },
}));

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(function (req, res, next) { // Check logged in status
  checkLogin(req);
  next(); //
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

app.listen({ port: GRAPHQL_PORT }, () => {
  console.log(`Server ready at http://localhost:${GRAPHQL_PORT}${server.graphqlPath}`);
});
