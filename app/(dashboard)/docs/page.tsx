import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ApiDocsPanel } from "@/components/dashboard/ApiDocsPanel"

const RESPONSE_FIELDS = [
  { field: "type",            type: "string",   desc: '"transaction" atau "stock_assignment"' },
  { field: "id",              type: "string",   desc: "ID unik record" },
  { field: "deviceNumber",    type: "string",   desc: "Nomor device / unit" },
  { field: "serialNumber",    type: "string?",  desc: "Serial number unit" },
  { field: "quotation",       type: "string?",  desc: "Nomor quotation" },
  { field: "soNumber",        type: "string?",  desc: "Sales Order number" },
  { field: "poNumber",        type: "string?",  desc: "Purchase Order number" },
  { field: "partNumber",      type: "string?",  desc: "Part number supplier" },
  { field: "axPartNumber",    type: "string?",  desc: "AX Part number (internal Wisel)" },
  { field: "partName",        type: "string?",  desc: "Nama part / komponen" },
  { field: "qty",             type: "number?",  desc: "Jumlah unit" },
  { field: "invoiceDate",     type: "string?",  desc: "Tanggal invoice (ISO 8601)" },
  { field: "unitPrice",       type: "number?",  desc: "Harga satuan (Rp)" },
  { field: "totalPrice",      type: "number?",  desc: "Total harga (Rp). Untuk stock_assignment: unitPrice × qty" },
  { field: "category",        type: "string?",  desc: 'Kategori item, biasanya "R"' },
  { field: "notes",           type: "string?",  desc: '"Consumable", "Accident", "Modification/improvement", "Other"' },
  { field: "packingSlipDate", type: "string?",  desc: "Tanggal repair / pasang (ISO 8601)" },
]

export default async function DocsPage() {
  const session = await auth()
  const headersList = await headers()
  const host = headersList.get("host") ?? "your-domain.com"
  const proto = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${proto}://${host}`
  const isAdmin = session?.user.role !== "customer"

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">API Documentation</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
        <p className="mt-3 text-sm text-gray-500">
          Endpoint API untuk integrasi data transaksi ke aplikasi internal customer.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── Kolom kiri: dokumentasi ── */}
        <div className="flex flex-col gap-5">

          {/* Authentication */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Authentication</h2>
            <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Setiap request harus menyertakan API Key di header{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code>.{" "}
              {isAdmin
                ? "Generate key melalui menu API Keys di dashboard."
                : "Hubungi administrator untuk mendapatkan API Key."}
            </p>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2 font-mono">Header</p>
              <code className="text-sm font-mono text-green-400">Authorization: Bearer wsl_xxxxxxxx...</code>
            </div>
          </section>

          {/* Endpoint */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Endpoint</h2>
            <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-lg">GET</span>
              <code className="text-sm font-mono text-gray-700">/api/customer/items</code>
            </div>
            <p className="text-sm text-gray-600">
              Mengembalikan semua item (transaksi langsung + assigned stock) milik customer pemilik API Key,
              diurutkan dari <code className="bg-gray-100 px-1 rounded text-xs font-mono">invoiceDate</code> terbaru.
            </p>
          </section>

          {/* Response Fields */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Response Fields</h2>
            <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Field</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {RESPONSE_FIELDS.map((f) => (
                    <tr key={f.field}>
                      <td className="py-2.5 pr-4">
                        <code className="text-xs font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{f.field}</code>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs font-mono text-blue-600">{f.type}</span>
                      </td>
                      <td className="py-2.5 text-xs text-gray-600">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              <code className="bg-gray-100 px-1 rounded font-mono">?</code> berarti nilai bisa <code className="bg-gray-100 px-1 rounded font-mono">null</code>
            </p>
          </section>

          {/* Error Responses */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Error Responses</h2>
            <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />
            <div className="flex items-start gap-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-0.5 rounded shrink-0">401</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Unauthorized</p>
                <p className="text-xs text-gray-500 mt-0.5">API Key tidak disertakan, format salah, atau key tidak aktif.</p>
                <code className="text-xs font-mono text-gray-600 mt-1 block">{'{ "error": "Unauthorized" }'}</code>
              </div>
            </div>
          </section>
        </div>

        {/* ── Kolom kanan: code examples + try it out (sticky) ── */}
        <div className="xl:sticky xl:top-6 xl:self-start flex flex-col gap-5">
          <ApiDocsPanel baseUrl={baseUrl} />
        </div>

      </div>
    </>
  )
}
