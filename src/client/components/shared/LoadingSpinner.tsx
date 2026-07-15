export const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--background)">
      <img
        src="/assets/loading_spinner.png"
        alt="Loading..."
        className="w-20 h-20 animate-spin"
      />
    </div>
  );
};
