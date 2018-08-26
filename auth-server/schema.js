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

const schemas = [
  baseSchema,
  require('./api').schema,
  require('coa-web-login').graphql.schema
];

module.exports = schemas.reduce((accum, cur) => accum.concat(cur), '');
