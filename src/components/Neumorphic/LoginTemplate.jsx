import React from 'react';
import styled from 'styled-components';

const LoginTemplate = () => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="login-box">
          <form className="form">
            <div className="logo" />
            <span className="header">Welcome Back!</span>
            <input type="email" placeholder="Email" className="input" />
            <input type="password" placeholder="Password" className="input" />
            <button type="submit" className="button sign-in">Sign In</button>
            <button className="button google-sign-in">
              <svg className="icon" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000">
                <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                <g id="SVGRepo_iconCarrier">
                  <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                  <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                  <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                  <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
                </g>
              </svg>
              <span className="span two"> Sign in with Google </span>
            </button>
            <p className="footer">
              Don't have an account?
              <a href className="link">Sign up, it's free!</a>
              <br />
              <a href className="link">Forgot password?</a>
            </p>
          </form>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    --form-width: 315px;
    --aspect-ratio: 1.33;
    --login-box-color: #272727;
    --input-color: #3a3a3a;
    --button-color: #373737;
    --footer-color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background: var(--login-box-color);
    border-radius: 24px;
    width: calc(var(--form-width) + 1px);
    height: calc(var(--form-width) * var(--aspect-ratio) + 1px);
    z-index: 8;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.2),
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 8px rgba(255, 255, 255, 0.1),
      0 0 16px rgba(255, 255, 255, 0.08);
  }

  .container::before {
    content: "";
    position: absolute;
    inset: -50px;
    z-index: -2;
    background: conic-gradient(
      from 45deg,
      transparent 75%,
      #fff,
      transparent 100%
    );
    animation: spin 4s ease-in-out infinite;
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }

  .login-box {
    background: var(--login-box-color);
    border-radius: 24px;
    padding: 28px;
    width: var(--form-width);
    height: calc(var(--form-width) * var(--aspect-ratio));
    position: absolute;
    z-index: 10;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow:
      inset 0 40px 60px -8px rgba(255, 255, 255, 0.12),
      inset 4px 0 12px -6px rgba(255, 255, 255, 0.12),
      inset 0 0 12px -4px rgba(255, 255, 255, 0.12);
  }

  .form {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 10px;
  }

  .logo {
    width: 65px;
    height: 65px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2),
      rgba(0, 0, 0, 0.2)
    );
    box-shadow:
      8px 8px 16px rgba(0, 0, 0, 0.2),
      -8px -8px 16px rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    border: 2px solid #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .logo::before {
    content: "";
    position: absolute;
    bottom: 10px;
    width: 50%;
    height: 20%;
    border-top-left-radius: 40px;
    border-top-right-radius: 40px;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 20px;
    border: 2.5px solid #fff;
  }

  .logo::after {
    content: "";
    position: absolute;
    top: 10px;
    width: 30%;
    height: 30%;
    border-radius: 50%;
    border: 2.5px solid #fff;
  }

  .user {
    position: absolute;
    height: 50px;
    color: #fff;
  }

  .header {
    width: 100%;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    padding: 6px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .input {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 12px;
    background: var(--input-color);
    color: white;
    outline: none;
    font-size: 14px;
  }

  .input:focus {
    border: 1px solid #fff;
  }

  .button {
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: grid;
    place-content: center;
    gap: 10px;
    background: var(--button-color);
    color: white;
    transition: 0.3s;
    box-shadow:
      inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6),
      inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8);
  }
  .sign-in {
    margin-top: 5px;
  }

  .google-sign-in {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .button:hover {
    background: rgba(255, 255, 255, 0.25);
    box-shadow:
      inset 0px 3px 6px rgba(255, 255, 255, 0.6),
      inset 0px -3px 6px rgba(0, 0, 0, 0.8),
      0px 0px 8px rgba(255, 255, 255, 0.05);
  }

  .icon {
    height: 16px;
  }

  .footer {
    width: 100%;
    text-align: left;
    color: var(--footer-color);
    font-size: 12px;
  }

  .footer .link {
    position: relative;
    color: var(--footer-color);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .footer .link::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 0;
    border-radius: 6px;
    height: 1px;
    background: currentColor;
    transition: width 0.3s ease;
  }

  .footer .link:hover {
    color: #fff;
  }

  .footer .link:hover::after {
    width: 100%;
  }`;

export default LoginTemplate;
