module.exports = {
  checkLogin: require('./check_login'),
  decodeToken: require('./decode_token'),
  getPublicKeys: require('./get_public_keys'),
  registerCode: require('./register_code'),
  graphql: {
    schema: require('./auth_schema'),
    resolvers: require('./auth_resolvers'),
  }
};

