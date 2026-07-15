export const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--background)">
      <img
        src="/assets/loading_spinner.png"
        alt="Loading..."
        className="w-16 h-16 animate-spin"
      />
    </div>
  );
};
