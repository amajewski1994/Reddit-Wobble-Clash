import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div
      className="flex relative flex-col justify-center items-center min-h-screen gap-8 bg-cover bg-center"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.85) 100%), url("/assets/splash%20-%20background.png")',
      }}
    >
      <img
        className="object-contain w-2/3 max-w-105 mx-auto"
        src="/assets/logo.png"
        alt="Wobble Clash"
      />
      <button
        className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white w-auto h-16 rounded-full cursor-pointer transition-colors px-10 text-2xl font-bold uppercase tracking-wide hover:bg-[#c23300] dark:hover:bg-orange-700"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Start
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
