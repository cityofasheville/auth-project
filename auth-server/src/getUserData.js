const cache = require('../common/cache/cache');

module.exports = function (context) {
  let userdata = null;
  if (context && context.req && context.req.session && context.req.session.id) {
    userdata = cache.get(context.req.session.id);
  }
  return Promise.resolve(userdata);
}
