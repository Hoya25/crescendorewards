import { useLocation, Link } from "react-router-dom";
import nctrIconDark from '@/assets/nctr-grey.png';
import nctrIconLight from '@/assets/nctr-yellow.png';
import { useEffect } from "react";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO title="Page Not Found" noIndex />
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          {/* NCTR Icon + 404 */}
          <div className="mb-8">
            <img src={nctrIconDark} alt="NCTR" className="block dark:hidden w-16 h-16 mx-auto mb-4" />
            <img src={nctrIconLight} alt="NCTR" className="hidden dark:block w-16 h-16 mx-auto mb-4" />
            <div className="text-8xl font-bold text-primary/20 mb-2">404</div>
          </div>

          <h1 className="mb-4 text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="mb-8 text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Return to Crescendo
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/rewards">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Rewards
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link to="/help" className="text-primary hover:underline inline-flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Visit our FAQ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;