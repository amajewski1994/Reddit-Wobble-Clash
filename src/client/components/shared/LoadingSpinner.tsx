import { useEffect, useState } from 'react';

const FADE_DURATION_MS = 300;

interface LoadingSpinnerProps {
  visible?: boolean;
}

export const LoadingSpinner = ({ visible = true }: LoadingSpinnerProps) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isVisible, setIsVisible] = useState(visible);
  const [lastVisible, setLastVisible] = useState(visible);

  // Adjusting state during render (rather than in an effect) for the
  // "becoming visible" case avoids an extra commit — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) {
      setShouldRender(true);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }

  // Delay the actual unmount until the opacity transition finishes.
  useEffect(() => {
    if (visible) return;
    const timeoutId = setTimeout(() => setShouldRender(false), FADE_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-(--background) bg-cover bg-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url("/assets/images/splash%20-%20background.png")',
      }}
    >
      <img
        src="/assets/images/loading_spinner.png"
        alt="Loading..."
        className="w-40 h-40 animate-spin"
      />
    </div>
  );
};
