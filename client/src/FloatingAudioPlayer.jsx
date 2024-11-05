import React from 'react';

const FloatingAudioPlayer = ({ audioSrc }) => {
  return (
      <div className=" absolute top-2 right-20 z-100 flex items-center justify-center w-10 h-10 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity">
        <audio controls className="hidden">
          <source src={audioSrc} type="audio/mpeg" />
        </audio>
        <button 
          onClick={() => document.querySelector('audio').play()} 
          className="w-full h-full flex items-center justify-center text-black-500  bg-white dark:bg-gray-800  rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-700 transition duration-200"
          title="Play"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.364 3.636A1 1 0 017 14.415V9.585a1 1 0 011.388-.917l6.364 3.636a1 1 0 010 1.732z" />
          </svg>
        </button>
      </div>
  );
};

export default FloatingAudioPlayer;
