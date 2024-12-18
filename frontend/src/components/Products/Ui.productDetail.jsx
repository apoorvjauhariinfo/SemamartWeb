export function ProductDetailsRows({ label, value }) {
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      {value}
    </p>
  );
}
