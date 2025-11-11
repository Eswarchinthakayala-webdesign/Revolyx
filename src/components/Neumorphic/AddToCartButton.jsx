import React from 'react';
import styled from 'styled-components';

const AddToCartButton = () => {
  return (
    <StyledWrapper>
      <button className="button">
        <div className="wrap">
          <div className="state state--default">
            <div className="icon-cart">
              <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <circle r={1} cy={21} cx={8} />
                <circle r={1} cy={21} cx={19} />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <div className="icon">
              <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </div>
            <p>
              <span style={{'--i': 0}}>A</span>
              <span style={{'--i': 1}}>d</span>
              <span style={{'--i': 2}}>d</span>
              <span style={{'--i': 3}}>t</span>
              <span style={{'--i': 4}}>o</span>
              <span style={{'--i': 5}}>c</span>
              <span style={{'--i': 6}}>a</span>
              <span style={{'--i': 7}}>r</span>
              <span style={{'--i': 8}}>t</span>
            </p>
          </div>
          <div className="state state--added">
            <div className="icon">
              <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p>
              <span style={{'--i': 5}}>A</span>
              <span style={{'--i': 6}}>d</span>
              <span style={{'--i': 7}}>d</span>
              <span style={{'--i': 8}}>e</span>
              <span style={{'--i': 9}}>d</span>
            </p>
          </div>
        </div>
        <div className="bg" />
        <div className="bg-spin" />
        <div className="bg-gradient" />
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .wrap {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .button {
    --primary: #fff;
    --neutral-1: #e6e6e6;
    --neutral-2: #6e6e6e;
    --radius: 10px;

    cursor: pointer;
    border-radius: var(--radius);
    color: #4a4a4a;
    border: none;
    box-shadow:
      0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2),
      0 10px 20px rgba(0, 0, 0, 0.2),
      0 4px 5px 0px rgba(0, 0, 0, 0.05);

    position: relative;
    transition: all 0.3s ease;
    min-width: 200px;
    height: 70px;
    font-style: normal;
    font-size: 19px;
    font-weight: 500;
  }
  .button::after {
    content: "";
    inset: -7px;
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.4),
      inset 0 -2px 2px rgba(255, 255, 255, 0.4);
    border-radius: 15px;
    transition: all 0.5s ease 0.2s;
    z-index: 0;
  }
  .button:hover:after {
    inset: -9px;
  }
  .button::before {
    content: "";
    inset: 11px;
    position: absolute;
    background: linear-gradient(to top, var(--neutral-1), var(--neutral-2));
    opacity: 0.7;
    border-radius: 30px;
    filter: blur(0.5px);
    backdrop-filter: blur(6px);
    transition: all 0.3s ease;
    z-index: 2;
  }
  .button:hover {
    transform: scale(1.02);
    box-shadow:
      0 0 1px 2px rgba(255, 255, 255, 0.3),
      0 15px 30px rgba(0, 0, 0, 0.3),
      0 10px 3px -3px rgba(0, 0, 0, 0.04);
  }
  .button:active {
    transform: scale(1);
    box-shadow:
      0 0 1px 2px rgba(255, 255, 255, 0.3),
      0 10px 3px -3px rgba(0, 0, 0, 0.2);
  }
  .bg {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
    background:
      linear-gradient(var(--neutral-1), var(--neutral-2)) padding-box,
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.45))
        border-box;
    z-index: 1;
    transition: all 0.4s ease;
  }
  .button:hover .bg {
    transform: scale(1.04, 1.1);
    box-shadow: inset 0 0 8px 3px rgba(0, 0, 0, 0.5);
  }
  .bg-spin {
    position: absolute;
    border-radius: inherit;
    overflow: hidden;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.4s ease;
    inset: -5px;
  }
  .bg-spin::before {
    content: "";
    position: absolute;
    inset: -100%;
    filter: blur(20px);
    background: conic-gradient(
      transparent 30%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent 100%
    );
    animation: spin 2s linear infinite;
    animation-play-state: paused;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .button:hover .bg-spin {
    opacity: 1;
  }
  .button:hover .bg-spin::before {
    animation-play-state: running;
  }

  .bg-gradient {
    position: absolute;
    overflow: hidden;
    border-radius: 13px;
    inset: -7px;
    z-index: 0;
    opacity: 0.3;
    transition: all 0.5s linear;
    filter: blur(10px);
  }
  .button:hover .bg-gradient {
    opacity: 1;
  }
  .bg-gradient::before {
    content: "";
    position: absolute;
    inset: -4px;
    margin: auto;
    aspect-ratio: 1;
    background-image: linear-gradient(
      90deg,
      #0d3fe4,
      #ff52e2,
      #fd4845,
      #f7d35b,
      #50f77d,
      #25e1e4
    );
    animation: spin 2s linear infinite;
  }

  .state p {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .state .icon,
  .state .icon-cart {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  /* Cart */
  .state .icon-cart {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    transform: translate(-80px, 9px);
  }
  .button:focus .state .icon-cart {
    animation: cart 2s linear;
  }
  .button:focus .state .icon-cart svg path {
    animation: cartPath 2s linear;
  }
  .state .icon-cart svg {
    height: 30px;
    width: auto;
  }

  @keyframes cart {
    0% {
      transform: translate(-80px, 9px);
    }
    18% {
      transform: translate(-20px, 9px);
    }
    25% {
      transform: translate(0, 9px) rotate(4deg);
    }
    31% {
      transform: translate(10px, 9px) rotate(-25deg);
    }
    45% {
      transform: translate(30px, 9px) rotate(0deg);
    }
    60% {
      transform: translate(60px, 9px) rotate(0deg);
    }
    100% {
      transform: translate(240px, 9px) rotate(-40deg);
    }
  }

  @keyframes cartPath {
    0%,
    45% {
      fill: transparent;
    }
    55%,
    100% {
      fill: currentColor;
    }
  }

  /* Trace */
  .state--default .icon-cart:before,
  .state--default .icon-cart:after {
    content: "";
    position: absolute;
    height: 2px;
    top: 8px;
    right: 30px;
    opacity: 0.5;
    color: rgba(128, 255, 162, 0.8);
    background: linear-gradient(to right, transparent, currentColor);
    transform-origin: right;
  }
  .state--default .icon-cart:after {
    top: 15px;
    right: 28px;
    opacity: 0.3;
  }
  .button:focus .state--default .icon-cart:before,
  .button:focus .state--default .icon-cart:after {
    animation: trace 2s linear forwards;
  }
  .button:focus .state--default .icon-cart:after {
    color: rgba(255, 255, 255, 0.4);
  }

  @keyframes trace {
    0% {
      transform: rotate(0deg);
      width: 20px;
      opacity: 0.8;
      filter: blur(3px);
    }
    10% {
      transform: rotate(0deg);
      width: 20px;
    }
    25% {
      transform: rotate(-4deg);
      width: 30px;
      filter: blur(0);
      opacity: 0.2;
    }
    31% {
      transform: rotate(25deg);
      width: 5px;
      opacity: 0.2;
      filter: blur(2px);
    }
    45% {
      transform: rotate(0deg);
      width: 40px;
      filter: blur(0);
    }
    60% {
      transform: rotate(0deg);
      width: 50px;
      filter: blur(0);
    }
    100% {
      transform: rotate(40deg);
      width: 100px;
      filter: blur(3px);
    }
  }

  /* Plus */
  .state--default .icon svg {
    animation: plus 0.6s ease forwards;
  }
  .state--default .icon svg path {
    transform-origin: center;
  }
  .button:hover .icon svg path {
    stroke-width: 4px;
  }

  @keyframes plus {
    0% {
      transform: translateX(-60px) translateY(30px) rotate(-100deg) scale(2);
      opacity: 0;
      filter: blur(3px);
      color: lightgreen;
    }
    100% {
      transform: translateX(0) translateY(0) rotate(0);
      opacity: 1;
      filter: blur(0);
    }
  }

  .button:hover .state--default .icon svg path,
  .button:focus .state--default .icon svg path {
    animation: rotatePlus 0.6s cubic-bezier(0.5, 1, 0.3, 1.6) forwards;
  }

  .button:hover .state--default .icon svg {
    animation: scalePlus 0.6s cubic-bezier(0.5, 1, 0.3, 1.6) forwards;
  }
  .button:focus .state--default .icon svg {
    animation: movePlus 2s linear forwards;
  }

  @keyframes rotatePlus {
    30% {
      stroke: white;
    }
    100% {
      transform: rotate(90deg);
    }
  }

  @keyframes scalePlus {
    30% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes movePlus {
    10%,
    18% {
      transform: translate(0px, 0px);
      stroke: white;
    }
    25% {
      transform: translate(5px, 0px) rotate(-80deg);
      stroke: #00ff00;
      filter: blur(0);
    }
    40% {
      transform: translate(32px, -15px) rotate(-200deg);
      filter: blur(2px);
    }
    55% {
      transform: translate(55px, 10px) rotate(-360deg);
    }
    60%,
    100% {
      transform: translate(80px, 10px) rotate(-360deg) scale(0);
    }
  }

  /* Letters */
  .state p span {
    display: block;
    opacity: 0;
    animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
  }
  .button:hover p span {
    opacity: 1;
    animation: wave 0.5s ease forwards calc(var(--i) * 0.03s);
  }
  .button:focus p span {
    opacity: 1;
    animation: disappear 0.6s ease forwards calc(0.5s + var(--i) * 0.1s);
  }

  @keyframes wave {
    30% {
      opacity: 1;
      transform: translateY(4px) translateX(0) rotate(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-3px) translateX(0) rotate(0);
      color: var(--primary);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  @keyframes slideDown {
    0% {
      opacity: 0;
      transform: translateY(20px) translateX(0px);
      color: var(--primary);
      filter: blur(5px);
    }
    20% {
      opacity: 1;
      transform: translateY(-4px) translateX(-2px) rotate(-10deg);
      filter: blur(0);
    }
    50% {
      opacity: 1;
      transform: translateY(3px) translateX(3px) rotate(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  @keyframes disappear {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: translateX(5px) translateY(-20px);
      color: var(--primary);
      filter: blur(5px);
    }
  }

  .button svg path {
    transition: all 0.5s ease;
  }

  .state {
    padding-left: 29px;
    display: flex;
    position: relative;
  }
  .state--default span:nth-child(3),
  .state--default span:nth-child(5) {
    margin-right: 5px;
  }
  .state--added {
    display: none;
    color: white;
  }
  .state--added .icon svg {
    stroke-dasharray: 24 24;
    stroke-dashoffset: -24;
  }
  .button:focus .state--default {
    position: absolute;
  }
  .button:focus .state--added {
    display: flex;
    --primary: lightgreen;
  }
  .button:focus .state--added span {
    opacity: 0;
    animation: slideDown 1.2s ease forwards calc(1s + var(--i) * 0.1s);
  }
  .button:focus .state--added .icon svg {
    animation: check 1s cubic-bezier(0.5, -0.15, 0.3, 1.4) forwards 1s;
  }

  @keyframes check {
    0% {
      stroke-dashoffset: -24;
      transform: scale(4);
      filter: blur(3px);
    }
    50% {
      stroke-dashoffset: -7;
    }
    100% {
      transform: scale(1);
      stroke-dashoffset: 0;
    }
  }`;

export default AddToCartButton;
