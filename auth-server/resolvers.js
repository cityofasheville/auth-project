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
const commonResolvers = require('./common').resolvers;
module.exports = merge(
  resolverMap,
  apiResolvers,
  commonResolvers
);
