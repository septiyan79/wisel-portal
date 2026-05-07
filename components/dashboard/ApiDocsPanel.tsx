"use client"

import { useState } from "react"
import { Copy, Check, Play, Loader2 } from "lucide-react"

const TABS = ["cURL", "JavaScript", "Python", "PHP"] as const
type Tab = typeof TABS[number]

function getCode(tab: Tab, baseUrl: string): string {
  const url = `${baseUrl}/api/customer/items`
  const key = "wsl_your_api_key_here"
  switch (tab) {
    case "cURL":
      return `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${key}"`
    case "JavaScript":
      return `const response = await fetch("${url}", {\n  headers: {\n    "Authorization": "Bearer ${key}",\n  },\n})\n\nconst data = await response.json()\nconsole.log(data)`
    case "Python":
      return `import requests\n\nresponse = requests.get(\n    "${url}",\n    headers={"Authorization": "Bearer ${key}"},\n)\n\ndata = response.json()\nprint(data)`
    case "PHP":
      return `$ch = curl_init();\ncurl_setopt($ch, CURLOPT_URL, "${url}");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Authorization: Bearer ${key}",\n]);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n\n$response = curl_exec($ch);\n$data = json_decode($response, true);\ncurl_close($ch);`
  }
}

export function ApiDocsPanel({ baseUrl }: { baseUrl: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("cURL")
  const [copied, setCopied] = useState(false)

  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ status: number; body: string } | null>(null)

  function copyCode() {
    navigator.clipboard.writeText(getCode(activeTab, baseUrl))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function execute() {
    if (!apiKey.trim()) return
    setLoading(true)
    setResult(null)
    const start = Date.now()
    try {
      const res = await fetch("/api/customer/items", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      const body = await res.json()
      setResult({
        status: res.status,
        body: JSON.stringify(body, null, 2),
      })
    } catch {
      setResult({ status: 0, body: "Network error — pastikan server berjalan." })
    } finally {
      setLoading(false)
      void start
    }
  }

  const statusColor =
    result?.status === 200
      ? "text-green-600 bg-green-50 border-green-200"
      : result?.status === 401
      ? "text-red-600 bg-red-50 border-red-200"
      : "text-gray-600 bg-gray-50 border-gray-200"

  return (
    <>
      {/* Code Examples */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-1">Code Examples</h2>
        <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />

        {/* Tabs */}
        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div className="relative bg-gray-900 rounded-xl p-4">
          <button
            onClick={copyCode}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <pre className="text-xs font-mono text-gray-200 leading-relaxed whitespace-pre-wrap pr-6">
            {getCode(activeTab, baseUrl)}
          </pre>
        </div>
      </section>

      {/* Try it out */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-1">Try it out</h2>
        <div className="mt-1 h-0.5 w-6 bg-[#FFDE00] mb-4" />

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="wsl_xxxxxxxxxxxxxxxx..."
              className="w-full px-4 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            onClick={execute}
            disabled={loading || !apiKey.trim()}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-white bg-[#367C2B] hover:bg-[#2d6423] rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Executing..." : "Execute"}
          </button>

          {result && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${statusColor}`}>
                <span>HTTP {result.status === 0 ? "—" : result.status}</span>
                <span>{result.status === 200 ? "OK" : result.status === 401 ? "Unauthorized" : ""}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 max-h-72 overflow-y-auto">
                <pre className="text-xs font-mono text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {result.body}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
