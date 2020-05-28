import React, { useState, ChangeEvent } from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { HELLO_MUTATION, BYE_MUTATION } from './queries';

const Test: React.FC = (): JSX.Element => {
  const [helloMutation] = useMutation(HELLO_MUTATION);
  const [byeMutation] = useMutation(BYE_MUTATION);
  const [inputValue, setInputValue] = useState(0);
  const [response, setResponse] = useState(['test']);

  return (
    <div className='testContainer'>
      <ul style={{ display: 'flex' }}>
        <form
          className='formContainer'
          id='testForm'
          onSubmit={async (e: any) => {
            e.preventDefault();
            document.getElementById('resultsList')!.innerHTML = '';
            for (let i = 0; i < inputValue; i++) {
              const time = Date.now();
              await helloMutation()
                .then((res) => {
                  const resp = document.createElement('LI');
                  resp.innerText = `${i + 1} ${time} ${res.data.hello}`;
                  resp.id = i.toString();
                  document.getElementById('resultsList')?.appendChild(resp);
                })
                .catch((err) => {
                  const resp = document.createElement('LI');
                  resp.innerText = `${i + 1} ${time} ${err}`;
                  resp.id = i.toString();
                  document.getElementById('resultsList')?.appendChild(resp);
                });
            }
          }}
        >
          <div className='inputContainer' id='requestInput'>
            <label>Requests: </label>
            <input
              type='number'
              placeholder='ex. 50'
              step='1'
              min='0'
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setInputValue(Number(e.currentTarget.value));
              }}
            />
          </div>
          <button className='hello' type='submit'>
            Throttle
          </button>
        </form>

        <button
          style={{ marginTop: '20px', marginBottom: '20px' }}
          className='bye'
          onClick={async () => {
            const time = Date.now();
            await byeMutation()
              .then((res) => {
                const resp = document.createElement('LI');
                resp.innerText = `${time} ${res.data.bye}`;
                document.getElementById('resultsList')?.appendChild(resp);
              })
              .catch((err) => {
                const resp = document.createElement('LI');
                resp.innerText = `${time} ${err}`;
                document.getElementById('resultsList')?.appendChild(resp);
              });
          }}
        >
          Single
        </button>
      </ul>
      <ul id='resultsList'></ul>
    </div>
  );
};

export default Test;
