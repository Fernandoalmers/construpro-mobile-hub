
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-construPro-blue">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
        <p className="text-gray-500 mb-6">
          A página que você está procurando não existe ou foi removida.
          <br />
          <span className="text-sm mt-2 block">Rota tentada: {location.pathname}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate("/")} 
            className="bg-construPro-blue hover:bg-construPro-blue/90"
          >
            Voltar para Home
          </Button>
          <Button
            onClick={() => navigate("/vendor")}
            variant="outline"
            className="border-construPro-blue text-construPro-blue"
          >
            Área do Lojista
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
