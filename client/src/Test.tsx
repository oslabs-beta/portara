import React, { useState, ChangeEvent } from 'react';
import { useMutation, useQuery} from '@apollo/react-hooks'
import { getAllQuery, addTestMutation } from './queries'

const Test: React.FC = (): JSX.Element => {
  const [addTest, { data }] = useMutation(addTestMutation)
  const [inputValue, setInputValue] = useState(0);
  const [response, setResponse] = useState(['test'])
  

  return (
    <div className ="testContainer">
      <form 
        className ="formContainer" 
        id="testForm"
        onSubmit={async (e) =>{
          e.preventDefault()
          document.getElementById('resultsList')!.innerHTML = ''
          for (let i = 0; i < inputValue; i++) {          
            await addTest() 
            .then(res => {            
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
