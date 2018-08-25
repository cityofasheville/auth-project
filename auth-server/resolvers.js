const { merge } = require('lodash');
const { version } = require('./package.json');
const resolverMap = {
  Query: {
    version(obj, args, context) {
      return version;
    },
  },
  Mutation: {
    test(obj, args, context) {
      return 'You have successfully called the test mutation';
    },
  }
};

const apiResolvers = require('./api').resolvers;
const loginResolvers = require('coa-web-login').graphql.resolvers;

module.exports = merge(
  resolverMap,
  apiResolvers,
  loginResolvers
);
