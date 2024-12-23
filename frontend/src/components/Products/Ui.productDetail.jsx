export function ProductDetailsRows({ label, value }) {
  return (
    <tr>
      <td className="p-2 font-semibold border border-darkBlue">{label}: </td>
      <td className="p-2 border border-darkBlue">{value}</td>
    </tr>
  );
}
