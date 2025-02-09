
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full py-4 px-6 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/lovable-uploads/5b6ee081-dfcb-4a52-9769-6dff8e394dd6.png" alt="Logo" className="h-10" />
          <span className="text-2xl font-bold text-primary">shh.ai</span>
        </div>
        <nav className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-primary"
            onClick={() => navigate("/")}
          >
            الرئيسية
          </Button>
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-primary"
            onClick={() => navigate("/about")}
          >
            عن الخدمة
          </Button>
          {user ? (
            <>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-primary"
                onClick={() => navigate("/dashboard")}
              >
                وصفاتي
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-primary"
                onClick={handleSignOut}
              >
                تسجيل خروج
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/auth")}
            >
              تسجيل دخول
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
