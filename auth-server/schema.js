const baseSchema = `
  # the schema allows the following query:
  type Query {
    version: String
  }

  type Dummy {
    message: String
  }
  type Mutation {
    test: Dummy
  }
`;

const apiSchema = require('./api').schema;
const loginSchema = require('coa-web-login').graphql.schema;

module.exports = baseSchema.concat(apiSchema.concat(loginSchema));
