// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetricsPanel({ problemMetrics, validationReport }) {
  return (
    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md shadow-sm mb-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Problem Metrics</h2>
        <ul className="text-sm text-gray-700">
          {problemMetrics?.map((m, i) => (
            <li key={i}>
              <strong>{m.name.replace(/_/g, ' ')}:</strong> {m.value}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Validation Report</h2>
        <ul className="text-sm text-red-700">
          <li>Missed appointments: 0</li>
          <li>Duplicate appointments: 0</li>
          <li>Invalid time windows: 0</li>
          {/* Replace with real data later */}
        </ul>
      </div>
    </div>
  );
}
