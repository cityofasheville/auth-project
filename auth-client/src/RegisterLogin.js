import React from 'react';
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import queryString from 'query-string';


const REGISTER_CODE = gql`
  mutation registerCode($code: String!) {
    registerCode(code: $code) {
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
    //return null;
    return this.props.children;
  }
}

const Xyz = (props) => {
  const queryParams = queryString.parse(props.location.search);
  console.log(`Code is ${queryParams.code}`);
  let value = 'not set';
  return (
    <Mutation mutation={REGISTER_CODE}
              onCompleted = {(data) => {
                console.log(data);
                value = data.message;
              }}
    >
    {
      (registerCode, { data, error }) => {
        const retval = (data && data.message) || 'NONE';
        return (
        <div>
          <h2>XYZ!</h2>
          <p> Data is {retval}. </p>
          <RegisterLogin value = {retval} registerCode = {registerCode} code = {queryParams.code}>
            <div><p>Here we are {value}.</p></div>
          </RegisterLogin>
        </div>
        )
      }
    }
    </Mutation>
  );
};

export default Xyz;

