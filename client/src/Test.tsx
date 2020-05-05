import React from 'react';
import { useMutation, useQuery} from '@apollo/react-hooks'
import { getAllQuery, addTestMutation } from './queries'

const Test: React.FC = (): JSX.Element => {
  const [addTest] = useMutation(addTestMutation)

  return (
    <div className ="testContainer">
      <form 
        className ="formContainer" 
        id="testForm"
        onSubmit={() =>{
          for (let i = 0; i < 50; i++) {
            addTest()
          }
        }}
      >
        {/* <div className="inputContainer" id="endpointInput">
          <label>Endpoint: </label>
          <input type="text" value="localhost:4000/graphql"></input>
        </div>
        <div className="inputContainer" id="requestInput">
          <label>Requests: </label>
          <input type="number" placeholder="ex. 50"  step="10"></input>
        </div> */}
        <button type='submit'>TEST</button>
      </form>
    </div>
  )
}

export default Test