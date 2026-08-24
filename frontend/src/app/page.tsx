import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PlatformRoles } from "@/components/landing/PlatformRoles";
import { StatsBar } from "@/components/landing/StatsBar";
import { AboutSection } from "@/components/landing/AboutSection";
import { ContactSection } from "@/components/landing/ContactSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturesSection />
        <PlatformRoles />
        <StatsBar />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}