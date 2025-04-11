export function VitalPlusLogo() {
    return (
      <div className="flex items-center space-x-2">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h2l2 5 4-10 2 5h4"
          />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span className="text-2xl font-bold text-gray-800">Vital<span className="text-green-600">+</span></span>
      </div>
    );
  }
  