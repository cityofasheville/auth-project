const registerCode = require('./registerCode');
const logout = require('./logout');

const resolvers = {
  Mutation: {
    registerCode,
    logout,
  },
};

module.exports = resolvers;
