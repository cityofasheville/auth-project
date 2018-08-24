const sampleData = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
    secret: 'Hagrid'
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
    secret: 'raptor'
  },
];

const resolvers = {
  Query: {
    books: (parent, args, context) => sampleData.map(itm => {
      return {
        title: itm.title,
        author: itm.author,
        secret: itm.secret,
      }
    }),
  },
};
module.exports = resolvers;
