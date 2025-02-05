import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UploadSection } from "@/components/UploadSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-cairo" dir="rtl">
      <Header />
      <Hero />
      <UploadSection />
    </div>
  );
};

export default Index;