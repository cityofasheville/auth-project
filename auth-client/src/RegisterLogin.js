import React from 'react';
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import queryString from 'query-string';


const REGISTER_CODE = gql`
  mutation registerCode($code: String!) {
    registerCode(code: $code) {
      loggedIn
      message
      reason
    }
  }
`;

class RegisterLogin extends React.Component {

  componentDidMount() {
    console.log('Component mounted - code is ' + this.props.code);
    this.props.registerCode({ variables: { code: this.props.code } } );
  }
  render() {
    return this.props.children;
  }
}

class Xyz extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      message: 'No message',
    };
  }
  
  render() {
    const queryParams = queryString.parse(this.props.location.search);
    console.log(`Code is ${queryParams.code}`);
    return (
      <Mutation mutation={REGISTER_CODE}
                onCompleted = {(data) => {
                  console.log('We are done with the mutation');
                  console.log(JSON.stringify(data.registerCode));
                  this.setState({ isLoggedIn: data.registerCode.loggedIn, message: data.registerCode.message })
                }}
      >
      {
        (registerCode, { data, error }) => {
          return (
          <div>
            <h2>XYZ!</h2>
            <RegisterLogin registerCode = {registerCode} code = {queryParams.code}>
              <div>
                <p>Message:  {this.state.message}.</p>
                <br/>
                <p>You are {this.state.isLoggedIn ? '' : 'NOT'} logged in.</p>
              </div>
            </RegisterLogin>
          </div>
          )
        }
      }
      </Mutation>
    );
  }
};

export default Xyz;

