import React from 'react';
import styled from 'styled-components';

const InputField = () => {
  return (
    <StyledWrapper>
      <input type="text" autoComplete="off" name="text" className="input placeholder:text-black/60" placeholder="Username" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .input {
    border: none;
    outline: none;
    border-radius: 15px;
    padding: 1em;
    background-color: #ccc;
    box-shadow: inset 2px 5px 10px rgba(0,0,0,0.3);
    transition: 300ms ease-in-out;
   
  }
    

  .input:focus {
    color:black;
    background-color: white;
    transform: scale(1.05);
    box-shadow: 13px 13px 100px #969696,
               -13px -13px 100px #ffffff;
  }`;

export default InputField;
