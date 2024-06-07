.success-message-container {
    position: fixed;
    bottom: -100px; /* Start below the viewport */
    left: 50%;
    transform: translateX(-50%);
    background-color: #34d399; /* Tailwind's green-500 */
    color: #fff;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1000;
    animation: slideInUp 0.5s forwards, slideOutDown 0.5s forwards;
    animation-delay: 0s, 5s; /* Slide in immediately, slide out after 5 seconds */
  }
  
  .success-message-container.show {
    bottom: 1rem; /* Move into the viewport */
    animation: slideInUp 0.5s forwards;
  }
  
  .success-message-container.hide {
    animation: slideOutDown 0.5s forwards;
  }
  
  .success-message-container .close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: 1rem;
  }