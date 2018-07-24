const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const parseurl = require('parseurl');
const cors = require('cors');
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
    message: String
    reason: String
  }

  type Mutation {
    registerCode (code: String!): LoginResult
  }
`;

const registerCode = function (parent, args, context) {
  console.log('I am here');
  console.log(args.code);
  return { message: 'Hi there', reason: 'No reason' };
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
  store: new redisStore({
    host: 'redis-test-4.zwdfeb.0001.use1.cache.amazonaws.com',
    port: 6379,
  }),
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
