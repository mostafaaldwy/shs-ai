import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
      uploadSection.classList.add('animate-glow');
      // Remove animation class after animation completes
      setTimeout(() => {
        uploadSection.classList.remove('animate-glow');
      }, 2000);
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-primary/10 to-background py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 space-y-6 text-right">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              فهم وصفتك الطبية
              <br />
              <span className="text-primary">بسهولة وذكاء</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              نستخدم الذكاء الاصطناعي لمساعدتك في فهم وصفتك الطبية وتعليمات استخدام الدواء بشكل واضح وسهل
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={scrollToUpload}
            >
              ابدأ الآن مجاناً
            </Button>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0 flex gap-4">
            <img
              src="/lovable-uploads/bea31716-bc30-4bea-b4b5-48805058755d.png"
              alt="Doctors"
              className="w-full h-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};