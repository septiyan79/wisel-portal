  import { JSX } from "react";

  import Topbar from "@/components/landing/topbar";
  import Header from "@/components/landing/header";
  import Hero from "@/components/landing/hero";
  import Categories from "@/components/landing/categories";
  import Banner from "@/components/landing/banner";
  import Careers from "@/components/landing/careers";
  import StoreLocation from "@/components/landing/storeLocation";
  import Resources from "@/components/landing/resources";
  import Newsletter from "@/components/landing/newsletter";
  import Footer from "@/components/landing/footer";

  // ─── COMPONENT ───────────────────────────────────────────────────────────────

  export default function WiselHome(): JSX.Element {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-[Plus_Jakarta_Sans,Segoe_UI,sans-serif]">
        {/* ── TOP BAR ── */}
        <Topbar />

        {/* ── HEADER ── */}
        <Header />

        {/* ── HERO ── */}
        <Hero />

        {/* ── CATEGORIES ── */}
        <Categories />
        
        {/* ── WISEL ACCOUNT BANNER ── */}
        <Banner />

        {/* ── CAREERS ── */}
        <Careers />

        {/* ── RESOURCES ── */}
        <Resources />

        {/* ── FIND YOUR STORE ── */}
        <StoreLocation />
        
        {/* ── NEWSLETTER ── */}
        <Newsletter />

        {/* ── FOOTER ── */}
        <Footer />
      </div>
    );
  }