import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import './index.css';
// import registerServiceWorker from './registerServiceWorker';
import gql from "graphql-tag";
import ApolloClient from "apollo-client";
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider, Query } from "react-apollo";
import { createHttpLink} from "apollo-link-http";
import Xyz from './RegisterLogin';

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
          secret
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;
      return <div>
        <h2>List of Books</h2>
        {data.books.map(({ author, title, secret }) => (
          <div key={author}>
            <p><b>{`${author}:`}</b> {`${title}`}</p>
            <p>The secret is {secret}</p>
          </div>
        ))}
      </div>
    }}
  </Query>
);
//     pollInterval={7000}

const BasicExample = () => (
  <Router>
    <div>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>

      <hr />

      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/xyz" component={Xyz} />
    </div>
  </Router>
);



const Home = () => (
  <div>
    <h2>Home</h2>
    <BookList/>

  </div>
);

const About = () => (
  <div>
    <h2>About</h2>
  </div>
);

const App = () => (
  <ApolloProvider client={client}>
    <div style={{marginLeft:15 + 'px'}}>
      <BasicExample/>
      <a href='https://coa-web-2.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=2uu574tlad2ajk5hmj94fnjeva&redirect_uri=http://localhost:3000/xyz'>Login</a>
    </div>
  </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();
