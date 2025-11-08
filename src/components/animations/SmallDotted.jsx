import React from 'react';
import styled from 'styled-components';

const SmallDotted = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    background-color: transparent;
    background-image: radial-gradient(#000000 1px, #e5e5f7 1px);
    background-size: 30px 30px;
    width: 100%;
    height: 100vh;
  }`;

export default SmallDotted;
