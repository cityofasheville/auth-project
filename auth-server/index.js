const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const parseurl = require('parseurl');
const cors = require('cors');
const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
  },
];

const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  # This "Book" type can be used in other type declarations.
  type Book {
    title: String
    author: String
    cookie: String
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    "This is documentation"
    books: [Book]
  }
`;

const resolvers = {
  Query: {
    books: (parent, args, context) => books.map(itm => {
      return {
        title: itm.title,
        author: itm.author,
        cookie: context.session.id,
      }
    }),
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
  cookie: { 
    httpOnly: true,
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));
app.use(cors(corsOptions));

app.use(function (req, res, next) {
  if (!req.session.views) {
    req.session.views = {};
  }
  const pathname = parseurl(req).pathname;
  req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;
  console.log(`View count is ${JSON.stringify(req.session.views)} for ${req.session.id}`);
  next();
});
// app.use(function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
//   next();
// });
server.applyMiddleware({ app, cors: corsOptions });

app.listen({ port: 4000 }, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
