
import { Loader2 } from "lucide-react";

export interface GalleryHeaderProps {
  settlementCount: number;
  isLoading: boolean;
}

const GalleryHeader = ({ settlementCount, isLoading }: GalleryHeaderProps) => {
  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <h1 className="text-4xl font-bold font-display mb-4">
          Personal Injury Settlement Database
        </h1>
        <div className="flex items-center text-primary-200">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading settlements...</span>
            </div>
          ) : (
            <p>
              Showing <span className="font-semibold">{settlementCount}</span>{" "}
              {settlementCount === 1 ? "settlement" : "settlements"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryHeader;
