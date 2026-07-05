import { generateText, tool, stepCountIs } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { queryTransactions, getSummaryStats, getStockInfo, searchParts } from '@/lib/chat-tools'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! })

  const { role, customerAccount, customerName } = session.user
  const scopedAccount = role !== 'admin' ? customerAccount : null

  const systemPrompt =
    role === 'admin'
      ? `Kamu adalah AI asisten admin portal Wisel, platform manajemen transaksi parts dan fleet John Deere.
Kamu memiliki akses ke semua data customer, transaksi, unit, dan stock.
Gunakan tools yang tersedia untuk menjawab pertanyaan dengan data real-time.
Berikan analisis bisnis, insight operasional, dan deteksi anomali dalam Bahasa Indonesia.
Saat menampilkan angka harga, gunakan format Rupiah (Rp) dengan pemisah ribuan.
Tanggal ditampilkan dalam format DD/MM/YYYY.
Selalu berikan jawaban teks yang informatif setelah menggunakan tool.`
      : `Kamu adalah AI asisten untuk ${customerName} di portal Wisel, platform manajemen transaksi parts dan fleet John Deere.
Bantu user melihat data transaksi, stock, dan unit mereka.
Gunakan tools yang tersedia untuk query data real-time. Data yang ditampilkan hanya milik ${customerName}.
Jika diminta insight, analisis data dan berikan ringkasan yang mudah dipahami dalam Bahasa Indonesia.
Saat menampilkan angka harga, gunakan format Rupiah (Rp) dengan pemisah ribuan.
Tanggal ditampilkan dalam format DD/MM/YYYY.
Kamu juga bisa menjawab pertanyaan umum tentang cara penggunaan portal (tambah transaksi manual, lihat detail, filter data, dll).
Selalu berikan jawaban teks yang informatif setelah menggunakan tool.`

  const toolDefs = {
    query_transactions: tool({
      description:
        'Query daftar transaksi dari database berdasarkan filter tanggal, part number, nama part, atau unit.',
      inputSchema: z.object({
        dateFrom: z.string().optional().describe('Tanggal mulai format YYYY-MM-DD'),
        dateTo: z.string().optional().describe('Tanggal akhir format YYYY-MM-DD'),
        partNumber: z.string().optional().describe('Filter by part number (partial match)'),
        partName: z.string().optional().describe('Filter by nama part (partial match)'),
        deviceNumber: z.string().optional().describe('Filter by device/unit number'),
        limit: z.number().optional().describe('Jumlah data maksimal, default 20, max 50'),
      }),
      execute: async (params) => queryTransactions({ ...params, customerAccount: scopedAccount }),
    }),

    get_summary_stats: tool({
      description:
        'Dapatkan statistik ringkasan transaksi: total spending, total qty, dan top items berdasarkan grouping.',
      inputSchema: z.object({
        dateFrom: z.string().optional().describe('Tanggal mulai format YYYY-MM-DD'),
        dateTo: z.string().optional().describe('Tanggal akhir format YYYY-MM-DD'),
        groupBy: z
          .enum(['part', 'unit', 'month'])
          .optional()
          .describe('Kelompokkan hasil by: part | unit | month'),
      }),
      execute: async (params) => getSummaryStats({ ...params, customerAccount: scopedAccount }),
    }),

    get_stock_info: tool({
      description:
        'Dapatkan informasi stock assignment — part yang sudah dialokasikan ke unit tertentu.',
      inputSchema: z.object({
        deviceNumber: z.string().optional().describe('Filter by device/unit number'),
        partNumber: z.string().optional().describe('Filter by part number'),
      }),
      execute: async (params) => getStockInfo({ ...params, customerAccount: scopedAccount }),
    }),

    search_parts: tool({
      description: 'Cari part berdasarkan part number atau nama part dari history transaksi.',
      inputSchema: z.object({
        query: z.string().describe('Kata kunci pencarian part number atau nama part'),
      }),
      execute: async ({ query }) => searchParts({ query, customerAccount: scopedAccount }),
    }),
  }

  const result = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(5),
    tools: toolDefs,
  })

  const text = result.text.trim()

  return Response.json({
    text: text || 'Maaf, saya tidak dapat menghasilkan respons. Silakan coba lagi.',
  })
}
