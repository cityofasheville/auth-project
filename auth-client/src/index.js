import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import registerServiceWorker from './registerServiceWorker';
import gql from "graphql-tag";
import ApolloClient from "apollo-client";
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider, Query } from "react-apollo";
import { createHttpLink} from "apollo-link-http"

const client = new ApolloClient({
  link: createHttpLink({
    uri: "http://localhost:4000/graphql",
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});

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
    pollInterval={7000}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;
      return <div>
        <p>Cookie? - {document.cookie}{console.log('cookie', document.cookie)}</p>
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
// registerServiceWorker();
