import {
    NavItem,
    HeroTab,
    Category,
    Stat,
    Resource,
} from "@/types";

export const NAV_ITEMS: NavItem[] = [
    {
        label: "Merek",
        sub: ["Kubota", "Yanmar", "Mitsubishi", "Honda Power", "Merek Lainnya"],
    },
    {
        label: "Produk",
        sub: [
            "Alat Pertanian Baru",
            "Alat Pertanian Bekas",
            "Alat Perkebunan",
            "Mesin Konstruksi",
            "Irigasi & Pompa",
            "Aksesori & Attachment",
        ],
    },
    {
        label: "Suku Cadang",
        sub: [
            "Beli Suku Cadang",
            "Quick Order",
            "Katalog Suku Cadang",
            "Pelumas & Fluida",
            "Penawaran Spesial",
        ],
    },
    {
        label: "Servis & Dukungan",
        sub: [
            "Jadwalkan Servis",
            "Paket Perawatan",
            "Dukungan Teknis",
            "Pertanian Presisi",
            "Perbaikan Mandiri",
        ],
    },
];

export const HERO_TABS: HeroTab[] = [
    { label: "Produk Baru", icon: "✨", href: "/produk/baru" },
    { label: "Produk Bekas", icon: "🔧", href: "/produk/bekas" },
    { label: "Beli Sparepart", icon: "⚙️", href: "/sparepart" },
    { label: "Sewa Alat", icon: "📋", href: "/sewa" },
    { label: "Karir di Wisel", icon: "💼", href: "/karir" },
];

export const CATEGORIES: Category[] = [
    {
        label: "Alat Pertanian",
        desc: "Traktor, cultivator, transplanter",
        icon: "🌾",
        from: "#16a34a",
        to: "#14532d",
    },
    {
        label: "Perkebunan & Sawit",
        desc: "Mesin panen, sprayer, pemupuk",
        icon: "🌴",
        from: "#15803d",
        to: "#064e3b",
    },
    {
        label: "Irigasi & Pompa",
        desc: "Pompa air, selang, sprinkler",
        icon: "💧",
        from: "#0284c7",
        to: "#0c4a6e",
    },
    {
        label: "Mesin Konstruksi",
        desc: "Mini excavator, loader, compactor",
        icon: "🏗️",
        from: "#ca8a04",
        to: "#713f12",
    },
    {
        label: "Teknologi Presisi",
        desc: "GPS pertanian, drone, sensor lahan",
        icon: "📡",
        from: "#7c3aed",
        to: "#3b0764",
    },
    {
        label: "Mesin Rumput & Taman",
        desc: "Mesin potong rumput, blower",
        icon: "🌿",
        from: "#65a30d",
        to: "#365314",
    },
];

export const STATS: Stat[] = [
    { value: "120+", label: "Cabang" },
    { value: "27", label: "Provinsi" },
    { value: "15+", label: "Tahun Pengalaman" },
    { value: "50K+", label: "Pelanggan Puas" },
];

export const RESOURCES: Resource[] = [
    {
        tag: "Pertanian",
        type: "Blog",
        icon: "📰",
        title: "Tips Memilih Traktor",
        desc: "Panduan lengkap...",
        cta: "Baca Selengkapnya",
        accent: "bg-green-50 border-green-200",
        tagColor: "bg-green-100 text-green-700",
    },
    {
        tag: "Teknologi Alat",
        type: "Video",
        icon: "▶️",
        title: "Review Kubota L4018: Traktor 40 HP Terbaik 2025",
        desc: "Uji langsung di lapangan bersama petani Jawa Tengah — lihat performa, konsumsi BBM, dan kemudahan servisnya.",
        cta: "Tonton Sekarang",
        accent: "bg-yellow-50 border-yellow-200",
        tagColor: "bg-yellow-100 text-yellow-700",
    },
    {
        tag: "Perkebunan",
        type: "Podcast",
        icon: "🎙️",
        title: "Modernisasi Panen Sawit dengan Mesin: Dari Manual ke Mekanis",
        desc: "Diskusi mendalam bersama praktisi perkebunan tentang transisi teknologi mesin panen sawit di Sumatera.",
        cta: "Dengarkan",
        accent: "bg-blue-50 border-blue-200",
        tagColor: "bg-blue-100 text-blue-700",
    },
];

export const BRANDS: string[] = ["Kubota", "Yanmar", "Mitsubishi", "Honda", "Claas", "STIHL"];