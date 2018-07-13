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
const ExchangeRates = () => (
  <Query
    query={gql`
      {
        books {
          author
          title
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      return data.books.map(({ author, title }) => (
        <div key={author}>
          <p>{`${author}: ${title}`}</p>
        </div>
      ));
    }}
  </Query>
);

const App = () => (
  <ApolloProvider client={client}>
    <div>
      <h2>My first Apollo app</h2>
      <ExchangeRates/>
    </div>
  </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
