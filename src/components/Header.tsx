import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="w-full py-4 px-6 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/lovable-uploads/3f9def01-0f14-414b-b058-4ae06becfa1c.png" alt="Logo" className="h-10" />
          <span className="text-2xl font-bold text-primary">shh.ai</span>
        </div>
        <nav className="flex items-center space-x-6">
          <Button variant="ghost" className="text-gray-600 hover:text-primary">
            الرئيسية
          </Button>
          <Button variant="ghost" className="text-gray-600 hover:text-primary">
            عن الخدمة
          </Button>
          <Button variant="ghost" className="text-gray-600 hover:text-primary">
            تواصل معنا
          </Button>
          <Button variant="default" className="bg-primary hover:bg-primary/90">
            ابدأ الآن
          </Button>
        </nav>
      </div>
    </header>
  );
};