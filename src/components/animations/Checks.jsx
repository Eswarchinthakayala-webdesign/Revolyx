import React from 'react';
import styled, { keyframes } from 'styled-components';

const moveGlow = keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    filter: brightness(1);
  }
  50% {
    transform: translate(-10px, -10px) scale(1.05);
    filter: brightness(1.3);
  }
  100% {
    transform: translate(0, 0) scale(1);
    filter: brightness(1);
  }
`;

const Checks = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;

  .container {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #000000 0%, #333333 100%);
    position: relative;
    overflow: hidden;
    animation: ${moveGlow} 8s ease-in-out infinite alternate;

    box-shadow:
      100px 200px 1px rgba(255, 255, 255, 0.8),
      300px 150px 2px rgba(255, 255, 255, 0.6),
      500px 300px 1px rgba(255, 255, 255, 0.9),
      700px 100px 3px rgba(255, 255, 255, 0.7),
      200px 400px 2px rgba(255, 255, 255, 0.8),
      400px 600px 1px rgba(255, 255, 255, 0.6),
      600px 500px 3px rgba(255, 255, 255, 0.9),
      800px 300px 2px rgba(255, 255, 255, 0.7);
  }

  .container::before,
  .container::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    animation: ${moveGlow} 10s ease-in-out infinite alternate;
  }

  .container::before {
    background: radial-gradient(
        circle at 20% 30%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      ),
      repeating-conic-gradient(
        from 0deg at 50% 50%,
        rgba(255, 255, 255, 0.05) 0deg,
        rgba(255, 255, 255, 0.05) 10deg,
        transparent 10deg,
        transparent 30deg
      );
  }

  .container::after {
    background: radial-gradient(
        circle at 80% 70%,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 40%
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 50px,
        rgba(255, 255, 255, 0.03) 50px,
        rgba(255, 255, 255, 0.03) 52px,
        transparent 52px,
        transparent 60px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 50px,
        rgba(255, 255, 255, 0.03) 50px,
        rgba(255, 255, 255, 0.03) 52px,
        transparent 52px,
        transparent 60px
      );
  }
`;

export default Checks;
