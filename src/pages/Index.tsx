
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UploadSection } from "@/components/UploadSection";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-cairo" dir="rtl">
      <Header />
      <Hero />
      <UploadSection />
      <Navigation />
    </div>
  );
};

export default Index;
