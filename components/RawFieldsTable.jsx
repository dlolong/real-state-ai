export default function RawFieldsTable({ rawData }) {
  const entries = Object.entries(rawData || {});

  if (!entries.length) {
    return (
      <div className="text-gray-400 text-sm">
        No raw county fields available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-950 text-gray-400">
          <tr>
            <th className="text-left px-4 py-3">Field Name</th>
            <th className="text-left px-4 py-3">Value</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800">
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="px-4 py-3 font-mono text-blue-300 break-all">
                {key}
              </td>
              <td className="px-4 py-3 text-gray-300 break-all">
                {value === null || value === undefined
                  ? "—"
                  : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}