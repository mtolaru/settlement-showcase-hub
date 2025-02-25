
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const GalleryHeader = () => {
  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-display mb-4">Settlement Leaderboard</h1>
            <p className="text-primary-200 max-w-2xl">
              Browse through top-ranked settlements by case type and location. Find industry-leading
              results and benchmark your success.
            </p>
          </div>
          <Link to="/submit">
            <Button 
              className="bg-accent-500 hover:bg-accent-600 text-white"
            >
              Submit Your Settlement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GalleryHeader;
