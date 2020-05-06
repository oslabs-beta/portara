import React, { useState, ChangeEvent } from 'react';
import { useMutation, useQuery} from '@apollo/react-hooks'
import { getAllQuery, addTestMutation } from './queries'


// interface ResponseDisplay {
//   name: string;
//   message: string;
// }


const Test: React.FC = (): JSX.Element => {
  const [addTest, { data }] = useMutation(addTestMutation)
  const [inputValue, setInputValue] = useState(0);
  const [response, setResponse] = useState(['test'])
  

  return (
    <div className ="testContainer">
      <form 
        className ="formContainer" 
        id="testForm"
        onSubmit={(e) =>{
          e.preventDefault()
          document.getElementById('resultsList')!.innerHTML = ''
          for (let i = 0; i < inputValue; i++) {
            addTest() 
            .then(res => {
            //  setResponse(responses => responses.concat(res.data))
              const resp = document.createElement('LI');
              resp.innerText = `Request ${i+1}: ${res.data.hello}`
              resp.id = i.toString()
              document.getElementById("resultsList")?.appendChild(resp)
            })
            .catch(err => {
              const resp = document.createElement('LI');
              resp.innerText = err;
              resp.id = i.toString()
              document.getElementById("resultsList")?.appendChild(resp)
            })
          }
        }}
      >
        {/* <div className="inputContainer" id="endpointInput">
          <label>Endpoint: </label>
          <input type="text" placeholder="localhost:4000/graphql"></input>
        </div> */}
        <div className="inputContainer" id="requestInput">
          <label>Requests: </label>
          <input 
            type="number" 
            placeholder="ex. 50"  
            step="1"
            min="0"
            onChange={(e:ChangeEvent<HTMLInputElement>) => {
              setInputValue(Number(e.currentTarget.value));
            }}
          />
        </div>
        <button type='submit'>TEST</button>
      </form>
      <ul id="resultsList">
      </ul>
    </div>
  )
};

export default Test
