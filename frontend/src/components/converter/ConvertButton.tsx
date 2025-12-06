interface ConvertButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

export default function ConvertButton({
  disabled = false,
  isLoading = false,
  onClick,
}: ConvertButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
        disabled || isLoading
          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isLoading ? 'Converting...' : 'Convert'}
    </button>
  );
}

