import { Button } from "@/components/ui/button";

export const Hero = () => {
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
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              ابدأ الآن مجاناً
            </Button>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0">
            <img
              src="/lovable-uploads/3f9def01-0f14-414b-b058-4ae06becfa1c.png"
              alt="Medical Consultation"
              className="w-full max-w-lg mx-auto rounded-lg shadow-xl animate-float"
            />
          </div>
        </div>
      </div>
    </div>
  );
};