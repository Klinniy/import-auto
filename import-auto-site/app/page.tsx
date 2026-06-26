import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Markets from "@/components/Markets";
import About from "@/components/About";
import CatalogPreview from "@/components/CatalogPreview";
import CalcBlock from "@/components/CalcBlock";
import Contacts from "@/components/Contacts";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Markets />
        <About />
        <CatalogPreview />
        <CalcBlock />
        <Contacts />
      </main>
    </>
  );
}
