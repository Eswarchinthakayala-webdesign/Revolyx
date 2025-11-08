import React from 'react';
import styled from 'styled-components';

const VioletLight = () => {
  return (
    <StyledWrapper>
      <div className="background" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100vh;
    background: white;
    background: radial-gradient(125% 125% at 50% 10%, #fff 40%, #63e 100%);
    z-index: 100;
  }`;

export default VioletLight;
