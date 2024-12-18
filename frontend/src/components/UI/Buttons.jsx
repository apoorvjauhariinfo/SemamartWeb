export function ActionBtn({ onClick = null, children }) {
  return (
    <button
      onClick={onClick}
      className="w-[150px] bg-accentYellow h-[50px] flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-all duration-200 ease-out"
    >
      <span className="text-slate-800 font-semibold flex items-center">
        {children}
      </span>
    </button>
  );
}

export function SecondryBtn({ onClick = null, children }) {
  return (
    <button
      onClick={onClick}
      className="w-[150px] border-darkBlue border-2 h-[50px] my-3 flex items-center justify-center rounded cursor-pointer"
    >
      <span className="text-darkBlue font-semibold flex items-center">
        {children}
      </span>
    </button>
  );
}
