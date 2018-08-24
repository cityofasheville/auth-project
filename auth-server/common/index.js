const authResolvers = require('./auth').resolvers;

module.exports = {
  schema: [
    require('./auth').schema,
  ],
  resolvers: authResolvers,
};

