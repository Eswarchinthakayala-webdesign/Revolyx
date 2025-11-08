import React from 'react';
import styled from 'styled-components';

const NoteBook = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(#3f87a6 10%, #ebf8e1a2 10%),
      linear-gradient(to right, #ebf8e100 10%, #c73030 10% 10.2%, #ebf8e100 10.5%);
    background-size: 100% 25px, 100% 100%;
    background-repeat: repeat, no-repeat;
    /* Add your background NoteBook here */
  }`;

export default NoteBook;
