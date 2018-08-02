import React from 'react';
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

const LOGOUT_CODE = gql`
  mutation logout {
    logout {
      loggedIn
      message
      reason
    }
  }
`;

class Logout extends React.Component {

  componentDidMount() {
    console.log('Component mounted - code is ' + this.props.code);
    this.props.logout();
  }
  render() {
    return this.props.children;
  }
}

class RegisterLogout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      message: 'No message',
    };
  }
  
  render() {
    return (
      <Mutation mutation={LOGOUT_CODE}
        onCompleted = {(data) => {
          this.setState({ isLoggedIn: data.logout.loggedIn, message: data.logout.message });
        }}
      >
      {
        (logout, { data, error }) => {
          return (
          <div>
            <h2>XYZ!</h2>
            <Logout logout = {logout} >
              <div>
                <p>Message:  {this.state.message}.</p>
                <br/>
                <p>You are {this.state.isLoggedIn ? '' : 'NOT'} logged in.</p>
              </div>
            </Logout>
          </div>
          )
        }
      }
      </Mutation>
    );
  }
};

export default RegisterLogout;

