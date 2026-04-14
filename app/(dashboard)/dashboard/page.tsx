export default function DashboardPage() {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa dan laporan</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="w-full" style={{ aspectRatio: "16/9.95" }}>
          <iframe
            title="GPA Report"
            width="100%"
            height="100%"
            src="https://app.powerbi.com/view?r=eyJrIjoiNjExOWRiODEtYTA2ZS00NGYyLTlkOTYtMDlkZGY4Yzg2MDQ3IiwidCI6ImY2ZDA1NWNmLTFjZDgtNDcyNy1hOGFjLTExNmUyMzllZmJiMCIsImMiOjEwfQ%3D%3D"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
