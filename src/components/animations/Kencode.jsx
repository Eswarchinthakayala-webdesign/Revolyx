import React from "react";
import styled from "styled-components";

const Kencode = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;
  height: 100vh; /* ✅ ensures visible area */
  overflow: hidden;
  background: #000; /* ✅ contrast base so white gradient is visible */

  .container {
    width: 100%;
    height: 100%;
    position: relative;
    background: 
      linear-gradient(to bottom, #ffffff 0%, #ffffff 40%, rgba(255, 255, 255, 0) 100%),
      linear-gradient(to right, #0ed2da, #5f29c7);
    overflow: hidden;
  }

  .container::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(90deg, #ccc 1px, transparent 1px);
    background-size: 50px 100%;
    pointer-events: none;

    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 70%);
    -webkit-mask-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 1) 0%,
      rgba(0, 0, 0, 0) 70%
    );
  }
`;

export default Kencode;
