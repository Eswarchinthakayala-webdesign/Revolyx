import React from 'react';
import styled from 'styled-components';

const Bluetooth = () => {
  return (
    <StyledWrapper>
      <div>
        <label className="wrap" htmlFor="button">
          <input type="checkbox" aria-label="Bluetooth" id="button" />
          <button className="button">
            <div className="corner" />
            <div className="inner">
              <svg width={390} height={430} viewBox="0 0 390 430" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g className="symbol" filter="url(#inset-shadow)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M202.884 13.3026C196.814 7.84601 188.099 6.46854 180.642 9.78694C173.182 13.1055 168.377 20.4983 168.377 28.6551V164.683L78.6175 75.0327C70.5431 66.9664 57.4523 66.9664 49.3779 75.0327C41.3037 83.0988 41.3037 96.1768 49.3779 104.243L159.813 214.548L49.3787 324.853C41.3045 332.919 41.3045 345.997 49.3787 354.063C57.453 362.129 70.5439 362.129 78.6182 354.063L168.377 264.413V400.441C168.377 408.598 173.182 415.99 180.642 419.309C188.099 422.629 196.814 421.251 202.884 415.794L306.262 322.847C310.618 318.931 313.105 313.35 313.105 307.495C313.105 301.639 310.618 296.06 306.262 292.142L219.958 214.548L306.262 136.954C310.618 133.037 313.105 127.457 313.105 121.602C313.105 115.746 310.618 110.166 306.262 106.249L202.884 13.3026ZM261.524 307.495L209.728 260.926V354.063L261.524 307.495ZM261.524 121.602L209.728 168.171V75.0327L261.524 121.602Z" />
                  <circle cx={343} cy={215} r={30} />
                  <circle cx={46} cy={215} r={30} />
                </g>
                <g className="symbol-path symbol-path-glow">
                  <circle cx={343} cy={215} r={30} />
                  <circle cx={46} cy={215} r={30} />
                  <path d="M188.5 213.5L189.5 29L291.5 122C200.028 205.699 151.078 251.942 64 340" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M188.5 215.5L189.5 400L291.5 307C200.028 223.301 151.078 177.058 64 89" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <g className="symbol-path">
                  <circle cx={343} cy={215} r={10} />
                  <circle cx={46} cy={215} r={10} />
                  <path d="M188.5 213.5L189.5 29L291.5 122C200.028 205.699 151.078 251.942 64 340" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M188.5 215.5L189.5 400L291.5 307C200.028 223.301 151.078 177.058 64 89" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <defs>
                    <filter id="inset-shadow">
                      <feOffset dx={0} dy={0} />
                      <feGaussianBlur stdDeviation={10} result="offset-blur" />
                      <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                      <feFlood floodColor="black" floodOpacity={1} result="color" />
                      <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                      <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                      <feDropShadow dx={5} dy={5} stdDeviation={0} floodOpacity="0.2" floodColor="white" />
                    </filter>
                  </defs>
                </defs>
              </svg>
            </div>
          </button>
          <div className="led" />
          <div className="bg">
            <div className="shine-1" />
            <div className="shine-2" />
          </div>
          <div className="bg-glow" />
        </label>
        <div className="noise">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="noise-pattern" patternUnits="userSpaceOnUse" width={500} height={500}>
                <filter id="noise" x={0} y={0}>
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} stitchTiles="stitch" />
                  <feBlend mode="screen" />
                </filter>
                <rect width={500} height={500} filter="url(#noise)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#noise-pattern)" />
          </svg>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .wrap {
    --radius: 30px;
    --bg: #000000;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    pointer-events: none;
  }

  .wrap::before {
    content: "";
    position: absolute;
    width: 350px;
    height: 300px;
    border-radius: 50px;
    background-color: rgba(255, 255, 255, 0.05);
    filter: blur(60px);
    transform: skewY(-20deg);
  }

  .wrap::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
    filter: blur(30px);
  }

  .wrap input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    inset: 0;
    z-index: 999;
    cursor: pointer;
    pointer-events: all;
    user-select: none;
  }

  .button {
    position: relative;
    overflow: hidden;
    width: 154px;
    height: 150px;
    background-color: var(--bg);
    z-index: 2;
    border: transparent;
    border-radius: var(--radius);
    box-shadow:
      inset 0 1px 1px rgb(255 255 255 / 40%),
      inset 0 -6px 1px -4px #ff7300,
      inset 0 -15px 6px -8px #ff6600;
    transition: all 0.3s ease;
  }
  .button::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: calc(var(--radius) * 0.8);
    border-top: 50px solid #414244;
    border-left: 40px solid #2b2b2c;
    border-right: 40px solid #2b2b2c;
    border-bottom: 50px solid #15161a;
    filter: blur(6px);
    transition: all 0.5s ease;
  }

  .button::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    top: 101%;
    height: 50px;
    width: 120px;
    border-radius: 50px 50px 0 0;
    background: #ff7300;
    filter: contrast(10) blur(7px);
    transition: all 0.3s ease;
    opacity: 1;
  }

  .button .corner {
    transition: all 0.4s ease;
    opacity: 0.1;
  }
  .button .corner::before,
  .button .corner::after {
    content: "";
    position: absolute;
    top: 0;
    border-top: 55px solid white;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    filter: blur(6px);
  }
  .button .corner::before {
    left: 8px;
    transform: rotate(-40deg);
  }
  .button .corner::after {
    right: 8px;
    transform: rotate(40deg);
  }

  .wrap input:hover + .button .corner {
    opacity: 0.15;
  }

  .button .inner {
    z-index: 9;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    inset: 22px 20px;
    border-radius: calc(var(--radius) * 0.85);
    background: linear-gradient(180deg, #232324 5%, #46484b 100%);
    transition: all 0.3s ease;
    box-shadow:
      inset 0 -5px 15px -1px rgba(0, 0, 0, 0.3),
      inset 0 -4px 3px -3px black,
      inset 0 -10px 20px -8px rgb(255 255 255 / 40%),
      inset 0 1px 0 1px rgb(255 255 255 / 20%);
  }
  .button .inner svg {
    display: block;
    overflow: visible;
    height: 45%;
  }
  .button .inner svg .symbol {
    fill: #212123;
  }
  .button .inner svg .symbol-path {
    filter: brightness(1.1) contrast(1.1);
  }
  .button .inner svg .symbol-path path {
    stroke-dasharray: 650;
    stroke-dashoffset: -650;
    stroke-width: 5;
    stroke: #ff7a3c;
    animation: symbolPath 2s ease-in-out;
  }
  .button .inner svg .symbol-path-glow path {
    stroke-dasharray: 650;
    stroke-dashoffset: -650;
    stroke-width: 30;
    stroke: #ce7c02;
    filter: blur(30px);
    animation: symbolPath 2s ease-in-out;
  }
  .button .inner svg .symbol-path circle {
    fill: #ff593c;
    opacity: 0;
    animation: symbolCircle 2s ease-in-out;
  }
  .button .inner svg .symbol-path-glow circle {
    fill: #ce7c02;
    filter: blur(30px);
    opacity: 0;
    animation: symbolCircle 2s ease-in-out;
  }

  .bg {
    background-color: black;
    position: absolute;
    inset: -7px;
    border-radius: calc(var(--radius) * 1.25);
    box-shadow: 0 20px 10px -10px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    overflow: hidden;
    z-index: 1;
  }
  .bg::before {
    content: "";
    position: absolute;
    border-radius: inherit;
    box-shadow:
      inset 0 -2px 0px -1px rgb(120 176 255 / 32%),
      inset 0 0 5px 1px black,
      inset 0 0 0 1px black;
    inset: 0;
    z-index: 1;
  }

  .bg .shine-1,
  .bg .shine-2::before {
    content: "";
    position: absolute;
    z-index: 0;
    transition: all 0.3s ease;
    background: rgb(255, 115, 0);
    width: 10px;
    height: 10px;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    border-radius: 50%;
    filter: blur(2px);
    transform: translateY(0) scale(0);
    animation: bg 2.4s linear 0.3s;
  }
  .bg .shine-2::before {
    animation: bg 2.4s linear infinite;
  }
  .bg .shine-2 {
    transition: all 0.5s linear;
    opacity: 0;
  }

  .led {
    position: absolute;
    z-index: 10;
    top: 100%;
    border-radius: 50%;
    width: 6px;
    height: 6px;
    margin-top: 22px;
    transition: all 0.3s ease;
    background-color: #f35f3a;
    box-shadow:
      0 -10px 35px 17px #ff5100,
      inset 0 1px 2px 0px rgba(255, 255, 255, 0.6),
      0 0 0px 3px rgb(0 0 0 / 60%),
      0 0 2px 4px rgba(152, 81, 0, 0.8);
  }

  .noise {
    position: absolute;
    top: -20px;
    bottom: -20px;
    left: 0;
    right: 0;
    opacity: 0.08;
    mask-image: linear-gradient(
      transparent 5%,
      white 30%,
      white 70%,
      transparent 95%
    );
    filter: grayscale(1);
  }

  /** STATES */

  .wrap input:checked + .button .inner svg .symbol-path path {
    stroke: #00ccff; /* Bright cyan */
    stroke-width: 6; /* Slightly thicker for emphasis */
    filter: drop-shadow(0 0 5px #00ccff); /* Add a glow */
  }

  .wrap input:checked + .button .inner svg .symbol-path-glow path {
    stroke: #0077cc; /* Deeper blue for contrast */
    stroke-width: 35; /* Thicker glow */
    filter: blur(35px) drop-shadow(0 0 10px #0077cc); /* Stronger glow */
  }

  .wrap input:checked + .button .inner svg .symbol-path circle {
    fill: #00ccff;
    filter: drop-shadow(0 0 5px #00ccff);
  }

  .wrap input:checked + .button .inner svg .symbol-path-glow circle {
    fill: #0077cc;
    filter: blur(35px) drop-shadow(0 0 10px #0077cc);
  }
  .wrap input:active + .button ~ .bg .shine-1 {
    animation: none;
  }
  .wrap input:checked + .button .inner svg .symbol-path path,
  .wrap input:checked + .button .inner svg .symbol-path-glow path {
    animation: symbolPath2 2s ease-in-out reverse;
  }
  .wrap input:checked + .button .inner svg .symbol-path path {
    stroke: #b48518;
  }
  .wrap input:checked + .button .inner svg .symbol-path-glow path {
    stroke: #714b00;
  }
  .wrap input:checked + .button .inner svg .symbol-path circle {
    fill: #b48518;
  }
  .wrap input:checked + .button .inner svg .symbol-path-glow circle {
    fill: #714b00;
  }
  .wrap input:hover + .button {
    transform: scale(1.02);
  }
  .wrap input:active + .button {
    transform: scale(0.97);
    filter: contrast(1.07);
    background-color: transparent;
  }
  .wrap input:active + .button::before {
    box-shadow: 0 -10px 10px 10px black;
  }
  .wrap input:active + .button .inner {
    background: linear-gradient(180deg, #232324 5%, #3b3d40 100%);
    box-shadow:
      inset 0 -5px 15px -1px rgba(0, 0, 0, 0.3),
      inset 0 -4px 3px -3px black,
      inset 0 -10px 20px -8px rgb(255 255 255 / 20%),
      inset 0 1px 0 1px rgb(255 255 255 / 10%);
    transform: scale(0.95);
  }
  .wrap input:checked + .button ~ .bg .shine-1 {
    background-color: rgba(255, 187, 0, 0.7);
  }
  .wrap input:not(:checked):hover + .button ~ .bg .shine-2 {
    opacity: 1;
  }
  .wrap input:active + .button .corner,
  .wrap input:active + .button ~ .bg-glow,
  .wrap input:not(:checked):active + .button ~ .bg .shine-2 {
    opacity: 0;
  }

  .wrap input:not(:checked):hover + .button ~ .bg .shine-2::before {
    background: rgba(0, 204, 255, 0.9); /* Brighter shine */
    filter: blur(3px);
    animation: bgHover 2s infinite linear; /* Continuous shine */
  }

  @keyframes bgHover {
    0% {
      transform: translateY(0) scale(0);
    }
    50% {
      transform: translateY(-150px) scale(20);
    }
    100% {
      transform: translateY(-300px) scale(15);
    }
  }

  .bg-glow {
    transition: all 0.5s linear;
  }
  .bg-glow::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 30px;
    background: linear-gradient(to bottom, #984fff 0%, black 100%);
    filter: blur(12px);
    opacity: 0;
    animation: bgGlow 3s linear backwards;
  }

  @keyframes bgGlow {
    0% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    80%,
    100% {
      opacity: 0;
    }
  }

  .wrap input:checked + .button ~ .bg-glow::before {
    background: linear-gradient(to bottom, #00ccff 0%, rgba(0, 0, 0, 0.7) 100%);
    filter: blur(20px); /* Softer, wider glow */
    opacity: 0.8; /* More visible */
    animation: bgGlowPulse 2s infinite alternate; /* Pulsing glow */
  }

  @keyframes bgGlowPulse {
    0% {
      opacity: 0.6;
      filter: blur(20px);
    }
    100% {
      opacity: 0.9;
      filter: blur(25px);
    }
  }
  @keyframes bgGlow2 {
    0% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    70%,
    100% {
      opacity: 0;
    }
  }

  .wrap input:checked + .button ~ .led {
    background-color: #00ccff; /* Brighter cyan for "on" state */
    box-shadow:
      0 -10px 35px 17px #00ccff,
      /* Stronger glow */ inset 0 1px 2px 0px rgba(255, 255, 255, 0.8),
      0 0 0px 3px rgba(0, 204, 255, 0.6),
      0 0 2px 4px rgba(0, 153, 255, 0.9);
    animation: ledPulse 1.5s infinite alternate; /* Pulsing effect */
  }

  @keyframes ledPulse {
    0% {
      box-shadow:
        0 -10px 35px 17px #00ccff,
        inset 0 1px 2px 0px rgba(255, 255, 255, 0.8),
        0 0 0px 3px rgba(0, 204, 255, 0.6),
        0 0 2px 4px rgba(0, 153, 255, 0.9);
    }
    100% {
      box-shadow:
        0 -10px 50px 25px #00ccff,
        inset 0 1px 2px 0px rgba(255, 255, 255, 1),
        0 0 0px 4px rgba(0, 204, 255, 0.8),
        0 0 3px 6px rgba(0, 153, 255, 1);
    }
  }

  @keyframes ledTurnOff {
    30%,
    60% {
      background-color: #ffdf4e;
      box-shadow:
        0 -10px 35px 17px rgba(255, 200, 0, 0.6),
        inset 0 1px 2px 0px white,
        0 0 0px 3px rgb(0 0 0 / 60%),
        0 0 2px 4px rgba(152, 119, 0, 0.3);
    }
    60.1%,
    65% {
      background-color: black;
      box-shadow:
        0 -10px 35px 17px transparent,
        inset 0 1px 2px 0px transparent,
        0 0 0px 3px rgb(0 0 0 / 10%),
        0 0 2px 4px transparent;
    }
    65.1%,
    70% {
      background-color: #ffdf4e;
      box-shadow:
        0 -10px 35px 17px rgba(255, 200, 0, 0.6),
        inset 0 1px 2px 0px white,
        0 0 0px 3px rgb(0 0 0 / 60%),
        0 0 2px 4px rgba(152, 119, 0, 0.3);
    }
    70.1%,
    100% {
      background-color: black;
      box-shadow:
        0 -10px 35px 17px transparent,
        inset 0 1px 2px 0px transparent,
        0 0 0px 3px rgb(0 0 0 / 10%),
        0 0 2px 4px transparent;
    }
  }

  .wrap input:checked + .button {
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.6),
      inset 0 -6px 1px -4px #00ccff,
      /* Bright cyan inset */ inset 0 -15px 6px -8px #0077cc,
      0 0 15px 5px rgba(0, 204, 255, 0.5); /* Outer glow */
    background-color: #2c3238; /* Keep base color */
    animation: reflexLedTurnOff 3s linear forwards;
  }

  @keyframes reflexLedTurnOff {
    30%,
    60% {
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -6px 1px -4px #9b8100,
        inset 0 -15px 6px -8px #373326;
    }
    60.1%,
    65% {
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -6px 1px -4px rgba(255, 255, 255, 0.1),
        inset 0 -15px 6px -8px rgba(255, 255, 255, 0.1);
    }
    65.1%,
    70% {
      box-shadow:
        inset 0 1px 1px rgb(255 255 255 / 40%),
        inset 0 -6px 1px -4px #9b8100,
        inset 0 -15px 6px -8px #373326;
    }
    70.1%,
    100% {
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -6px 1px -4px rgba(255, 255, 255, 0.1),
        inset 0 -15px 6px -8px rgba(255, 255, 255, 0.1);
    }
  }

  .wrap input:checked + .button::after {
    animation: reflexLedBlurTurnOff 3s linear forwards;
  }

  @keyframes reflexLedBlurTurnOff {
    30%,
    60% {
      background: #ffc400;
    }
    60.1%,
    65% {
      background: transparent;
    }
    65.1%,
    70% {
      background: #ffc400;
    }
    70.1%,
    100% {
      background: transparent;
    }
  }

  .wrap input:checked + .button ~ .bg::before {
    animation: bgBeforeTurnOff 3s linear forwards;
  }

  @keyframes bgBeforeTurnOff {
    30%,
    60% {
      box-shadow:
        inset 0 -2px 0px -1px rgba(255, 230, 120, 0.3),
        inset 0 0 5px 1px black,
        inset 0 0 0 1px black;
    }
    60.1%,
    65% {
      box-shadow:
        inset 0 -2px 0px -1px rgba(160, 160, 160, 0.3),
        inset 0 0 5px 1px black,
        inset 0 0 0 1px black;
    }
    65.1%,
    70% {
      box-shadow:
        inset 0 -2px 0px -1px rgba(255, 230, 120, 0.3),
        inset 0 0 5px 1px black,
        inset 0 0 0 1px black;
    }
    70.1%,
    100% {
      box-shadow:
        inset 0 -2px 0px -1px rgba(160, 160, 160, 0.3),
        inset 0 0 5px 1px black,
        inset 0 0 0 1px black;
    }
  }

  @keyframes bg {
    0% {
      transform: translateY(0) scale(0);
    }
    12% {
      transform: translateY(0) scale(25);
    }
    60%,
    100% {
      transform: translateY(-280px) scale(20, 18);
    }
  }

  @keyframes symbolPath {
    0% {
      stroke-dashoffset: -650;
    }
    50% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 650;
    }
  }

  @keyframes symbolPath2 {
    0% {
      stroke-dashoffset: -650;
    }
    50% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 650;
    }
  }

  @keyframes symbolCircle {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }`;

export default Bluetooth;
