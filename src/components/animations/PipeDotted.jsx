import React from "react";
import styled from "styled-components";

const PipeDotted = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;
  height: 100vh; /* 👈 make sure it fills the screen */
  overflow: hidden;
  background: #000;

  .container {
    width: 100%;
    height: 100%;
    position: relative;
    background-color: #000000;
    border-radius: 0.5em;
    overflow: hidden;
    box-shadow: 0 0.3em 0.6em rgba(0, 0, 0, 0.2);
  }

  .container::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
          135deg,
          transparent 0%,
          transparent 47%,
          #161616 47%,
          #2c2c2c 53%,
          transparent 53%,
          transparent 100%
        )
        0 0 / 2em 2em,
      linear-gradient(
          45deg,
          #434343 0%,
          #0a0a0a 47%,
          transparent 47%,
          transparent 53%,
          #434343 53%,
          #0a0a0a 100%
        )
        0 0 / 2em 2em,
      linear-gradient(
          -45deg,
          #434343 0%,
          #434343 47%,
          transparent 47%,
          transparent 53%,
          #434343 53%,
          #434343 100%
        )
        0 0 / 2em 2em,
      linear-gradient(
          45deg,
          transparent 0%,
          transparent 47%,
          #000000 47%,
          #434343 53%,
          transparent 53%,
          transparent 100%
        )
        1em 1em / 2em 2em;
    opacity: 0.5;
    animation: PipeDottedFloat 20s linear infinite; /* 👈 animation attached */
  }

  .container::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
          circle at 25% 25%,
          rgba(255, 255, 255, 0.11) 0.5em,
          transparent 0.5em
        )
        0 0 / 4em 4em,
      radial-gradient(
          circle at 75% 75%,
          rgba(255, 255, 255, 0.1) 0.3em,
          transparent 0.3em
        )
        0 0 / 4em 4em,
      radial-gradient(
          circle at 75% 25%,
          rgba(13, 35, 69, 0.1) 0.4em,
          transparent 0.4em
        )
        2em 0 / 4em 4em,
      radial-gradient(
          circle at 25% 75%,
          rgba(0, 0, 0, 0.15) 0.2em,
          transparent 0.2em
        )
        2em 2em / 4em 4em;
  }

  @keyframes PipeDottedFloat {
    0% {
      background-position: 0 0, 0 0, 0 0, 1em 1em;
    }
    100% {
      background-position: 2em 2em, 2em 2em, 2em 2em, 3em 3em;
    }
  }
`;

export default PipeDotted;
