const authResolvers = require('./auth').graphql.resolvers;

module.exports = {
  schema: [
    require('./auth').graphql.schema,
  ],
  resolvers: authResolvers,
};

