import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import registerServiceWorker from './registerServiceWorker';
import gql from "graphql-tag";
import ApolloClient from "apollo-boost";
import { ApolloProvider, Query } from "react-apollo";
import { createHttpLink} from "apollo-link-http"

const link = createHttpLink({
  uri: '/graphql',
  credentials: 'include',
  fetchOptions: { method: 'GET' },
});
const client = new ApolloClient({
  // uri: "https://w5xlvm3vzz.lp.gql.zone/graphql"
  uri: "http://localhost:4000/graphql",
  link,
});
console.log('HI');
const BookList = () => (
  <Query
    query={gql`
      {
        books {
          author
          title
          cookie
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;
      return <div>
        <p><b>Cookie:</b> {data.books[0].cookie}</p>
        <h2>List of Books</h2>
        {data.books.map(({ author, title, cookie }) => (
          <div key={author}>
            <p><b>{`${author}:`}</b> {`${title}`}</p>
          </div>
        ))}
      </div>
    }}
  </Query>
);

const App = () => (
  <ApolloProvider client={client}>
    <div style={{marginLeft:15 + 'px'}}>
      <h2>Apollo app</h2>
      <BookList/>
    </div>
  </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
