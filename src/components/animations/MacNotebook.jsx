import React from 'react';
import styled from 'styled-components';

const MacNotebook = () => {
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
    --s: 100px; /* control the size */

    --_g: #0000 90deg, #366 0;
    background: conic-gradient(from 90deg at 2px 2px, var(--_g)),
      conic-gradient(from 90deg at 1px 1px, var(--_g));
    background-size: var(--s) var(--s), calc(var(--s) / 5) calc(var(--s) / 5);
  }`;

export default MacNotebook;
