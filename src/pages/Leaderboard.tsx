
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Settlement } from "@/types/settlement";
import { Loader2 } from "lucide-react";

const Leaderboard = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("amount");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Reset filters when search query is present
  useEffect(() => {
    if (searchQuery) {
      setSelectedType("all");
      setSelectedLocation("all");
    }
  }, [searchQuery]);

  // Fetch settlements from Supabase
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('payment_completed', true) // Only show paid/completed settlements
          .order('amount', { ascending: false });

        if (error) {
          throw error;
        }

        console.log('Fetched settlements:', data);
        
        // Deduplicate settlements by ID (in case there are duplicates in the database)
        const uniqueSettlements = data ? 
          Array.from(new Map(data.map(item => [item.id, item])).values()) : 
          [];
          
        console.log('Unique settlements after deduplication:', uniqueSettlements.length);
        setSettlements(uniqueSettlements);
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

  const caseTypes = [
    "All",
    "Motor Vehicle Accidents",
    "Medical Malpractice",
    "Product Liability",
    "Premises Liability",
    "Wrongful Death",
    "Animal Attack",
    "Assault and Abuse",
    "Boating Accidents",
    "Slip & Fall",
    "Workplace Injury",
  ];

  const locations = [
    "All",
    "Los Angeles, CA",
    "San Francisco, CA",
    "San Diego, CA",
  ];

  // Filter and sort settlements
  const filteredSettlements = useMemo(() => {
    if (isLoading || !settlements.length) return [];
    
    let filtered = [...settlements];

    // Apply search filter if query exists
    if (searchQuery) {
      filtered = filtered.filter((settlement) => {
        const searchFields = [
          settlement.type?.toLowerCase() || '',
          settlement.firm?.toLowerCase() || '',
          settlement.location?.toLowerCase() || '',
          settlement.description?.toLowerCase() || '',
          settlement.case_description?.toLowerCase() || '',
        ];
        return searchFields.some(field => field.includes(searchQuery));
      });
    } else {
      // Apply regular filters only if no search query
      if (selectedType.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (settlement) => settlement.type?.toLowerCase() === selectedType.toLowerCase()
        );
      }

      if (selectedLocation.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (settlement) => settlement.location === selectedLocation
        );
      }
    }

    // Sort settlements
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [settlements, selectedType, selectedLocation, sortBy, searchQuery, isLoading]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <GalleryHeader />
      <div className="container py-8">
        <FiltersPanel
          caseTypes={caseTypes}
          locations={locations}
          selectedType={selectedType}
          selectedLocation={selectedLocation}
          sortBy={sortBy}
          onTypeSelect={setSelectedType}
          onLocationChange={setSelectedLocation}
          onSortChange={setSortBy}
        />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="ml-2 text-lg text-neutral-600">Loading settlements...</span>
          </div>
        ) : (
          <SettlementGrid settlements={filteredSettlements} />
        )}
        
        <SubmitCTA />
      </div>
    </div>
  );
};

export default Leaderboard;
