import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { KomoditasStrip } from "@/components/landing/KomoditasStrip";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PlatformRoles } from "@/components/landing/PlatformRoles";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { AboutSection } from "@/components/landing/AboutSection";
import { InstallSection } from "@/components/landing/InstallSection"; // <-- Import InstallSection
import { ContactSection } from "@/components/landing/ContactSection";
import { SectionDivider } from "@/components/landing/SectionDivider";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        {/* Deretan komoditas memisahkan hero dari isi, sekaligus
            memperlihatkan cakupan bahan baku yang ditangani */}
        <KomoditasStrip />

        <FeaturesSection />

        <SectionDivider dari="#FFFFFF" ke="#FBF9F3" />
        <HowItWorks />

        <SectionDivider dari="#FBF9F3" ke="#FFFFFF" balik />
        <PlatformRoles />

        <BenefitsSection />
        <StatsBar />

        <AboutSection />

        {/* Transisi lengkung dari About (Putih) ke Install & Kontak (Krem) */}
        <SectionDivider dari="#FFFFFF" ke="#FBF9F3" />

        <InstallSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}