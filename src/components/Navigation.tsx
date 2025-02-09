
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Home, FileText, User, LogOut, LogIn } from "lucide-react";

export const Navigation = () => {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed bottom-0 right-0 w-full bg-white border-t border-gray-200 p-4 md:right-4 md:top-1/2 md:-translate-y-1/2 md:w-16 md:h-auto md:border md:rounded-lg md:shadow-lg">
      <div className="flex justify-around md:flex-col md:space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className={`${location.pathname === "/" ? "text-primary" : "text-gray-500"}`}
          onClick={() => navigate("/")}
        >
          <Home className="h-5 w-5" />
        </Button>

        {user && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`${location.pathname === "/dashboard" ? "text-primary" : "text-gray-500"}`}
              onClick={() => navigate("/dashboard")}
            >
              <FileText className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}

        {!user && (
          <Button
            variant="ghost"
            size="icon"
            className={`${location.pathname === "/auth" ? "text-primary" : "text-gray-500"}`}
            onClick={() => navigate("/auth")}
          >
            <LogIn className="h-5 w-5" />
          </Button>
        )}
      </div>
    </nav>
  );
};
