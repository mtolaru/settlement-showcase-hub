
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";
import { supabase } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";
import { useToast } from "@/components/ui/use-toast";

const Leaderboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Get initial filters from URL params
  const initialFilters = {
    amount: searchParams.get("amount") || "all",
    caseType: searchParams.get("case_type") || "all",
    location: searchParams.get("location") || "all",
    sort: searchParams.get("sort") || "highest"
  };
  
  const [filters, setFilters] = useState(initialFilters);

  // Fetch settlements from Supabase
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('payment_completed', true); // Only show paid/completed settlements

        if (error) {
          throw error;
        }

        // Process the data to ensure all required fields exist
        const processedData = data?.map(settlement => ({
          ...settlement,
          settlement_date: settlement.settlement_date || settlement.created_at,
          firmWebsite: settlement.firm_website
        })) as Settlement[];
        
        setSettlements(processedData);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settlements. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettlements();
  }, [toast]);
  
  // Apply filters when settlements or filters change
  useEffect(() => {
    const applyFilters = () => {
      let result = [...settlements];
      
      // Filter by amount
      if (filters.amount !== "all") {
        const [min, max] = filters.amount.split("-").map(Number);
        if (max) {
          result = result.filter(s => s.amount >= min && s.amount <= max);
        } else {
          result = result.filter(s => s.amount >= min);
        }
      }
      
      // Filter by case type
      if (filters.caseType !== "all") {
        result = result.filter(s => s.type === filters.caseType);
      }
      
      // Filter by location
      if (filters.location !== "all") {
        result = result.filter(s => s.location === filters.location);
      }
      
      // Sort the results
      if (filters.sort === "highest") {
        result.sort((a, b) => b.amount - a.amount);
      } else if (filters.sort === "lowest") {
        result.sort((a, b) => a.amount - b.amount);
      } else if (filters.sort === "newest") {
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setFilteredSettlements(result);
      
      // Update URL params
      setSearchParams({
        amount: filters.amount,
        case_type: filters.caseType,
        location: filters.location,
        sort: filters.sort
      }, { replace: true });
    };
    
    applyFilters();
  }, [settlements, filters, setSearchParams]);

  // Get unique options for filters from available data
  const getFilterOptions = () => {
    const caseTypes = ["all", ...new Set(settlements.map(s => s.type))];
    const locations = ["all", ...new Set(settlements.map(s => s.location))];
    
    return {
      caseTypes,
      locations
    };
  };
  
  const { caseTypes, locations } = getFilterOptions();

  return (
    <div className="min-h-screen bg-neutral-50">
      <GalleryHeader 
        settlementCount={filteredSettlements.length} 
        isLoading={isLoading}
      />
      
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FiltersPanel 
              filters={filters}
              setFilters={setFilters}
              caseTypes={caseTypes}
              locations={locations}
            />
          </div>
          <div className="lg:col-span-3">
            <SettlementGrid 
              settlements={filteredSettlements}
            />
            
            {!isLoading && filteredSettlements.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center mt-6">
                <h3 className="text-xl font-bold mb-2">No Settlements Found</h3>
                <p className="text-neutral-600 mb-6">
                  We couldn't find any settlements matching your current filters.
                </p>
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Reset All Filters
                </button>
              </div>
            )}
            
            <div className="mt-12">
              <SubmitCTA />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
