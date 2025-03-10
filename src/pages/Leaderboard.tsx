import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

const Leaderboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [displayedSettlements, setDisplayedSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const itemsPerPage = 9; // Load 9 items at a time (3x3 grid)
  
  const initialFilters = {
    amount: searchParams.get("amount") || "all",
    caseType: searchParams.get("case_type") || "all",
    location: searchParams.get("location") || "all",
    sort: searchParams.get("sort") || "highest"
  };
  
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionError(null);
        const result = await checkSupabaseConnection();
        if (!result.success) {
          setConnectionError(`Connection check failed: ${result.error}`);
          console.error('Supabase connection check failed:', result.error);
        } else {
          console.log('Supabase connection verified:', result);
        }
      } catch (error) {
        setConnectionError(`Connection check error: ${String(error)}`);
        console.error('Error checking Supabase connection:', error);
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setIsLoading(true);
        console.log('Starting to fetch settlements...');
        
        const { data: subscribedUsers, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('user_id, temporary_id')
          .eq('is_active', true);
          
        if (subscriptionError) {
          console.error('Error fetching subscriptions:', subscriptionError);
          toast({
            variant: "destructive",
            title: "Subscription Error",
            description: `Failed to load subscriptions: ${subscriptionError.message}`,
          });
          throw subscriptionError;
        }
        
        console.log('Retrieved subscriptions:', subscribedUsers);
        
        const userIds = subscribedUsers
          ?.filter(sub => sub.user_id)
          .map(sub => sub.user_id) || [];
          
        const temporaryIds = subscribedUsers
          ?.filter(sub => sub.temporary_id)
          .map(sub => sub.temporary_id) || [];
        
        console.log('Extracted user IDs:', userIds);
        console.log('Extracted temporary IDs:', temporaryIds);
        
        if (userIds.length === 0 && temporaryIds.length === 0) {
          console.log('No active subscriptions found');
          setSettlements([]);
          setIsLoading(false);
          return;
        }
        
        let queryParts = [];
        
        if (userIds.length > 0) {
          queryParts.push(`user_id.in.(${userIds.join(',')})`);
        }
        
        if (temporaryIds.length > 0) {
          queryParts.push(`temporary_id.in.(${temporaryIds.join(',')})`);
        }
        
        queryParts.push('payment_completed.eq.true');
        
        console.log('Query parts:', queryParts);
        const queryString = queryParts.join(',');
        console.log('Final OR query string:', queryString);
        
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .or(queryString);

        if (error) {
          console.error('Error fetching settlements:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to load settlements: ${error.message}`,
          });
          throw error;
        }

        console.log('Settlements data received:', data);

        const processedData: Settlement[] = data?.map(settlement => {
          return {
            id: settlement.id,
            amount: settlement.amount,
            type: settlement.type,
            firm: settlement.firm,
            firmWebsite: settlement.firm_website,
            attorney: settlement.attorney,
            location: settlement.location,
            created_at: settlement.created_at,
            settlement_date: settlement.settlement_date || settlement.created_at,
            description: settlement.description,
            case_description: settlement.case_description,
            initial_offer: settlement.initial_offer,
            policy_limit: settlement.policy_limit,
            medical_expenses: settlement.medical_expenses,
            settlement_phase: settlement.settlement_phase,
            temporary_id: settlement.temporary_id,
            user_id: settlement.user_id,
            payment_completed: settlement.payment_completed,
            photo_url: settlement.photo_url
          };
        }) || [];
        
        console.log('Processed settlements:', processedData);
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
  
  useEffect(() => {
    const applyFilters = () => {
      let result = [...settlements];
      
      if (filters.amount !== "all") {
        const [min, max] = filters.amount.split("-").map(Number);
        if (max) {
          result = result.filter(s => s.amount >= min && s.amount <= max);
        } else {
          result = result.filter(s => s.amount >= min);
        }
      }
      
      if (filters.caseType !== "all") {
        result = result.filter(s => s.type === filters.caseType);
      }
      
      if (filters.location !== "all") {
        result = result.filter(s => s.location === filters.location);
      }
      
      if (filters.sort === "highest") {
        result.sort((a, b) => b.amount - a.amount);
      } else if (filters.sort === "lowest") {
        result.sort((a, b) => a.amount - b.amount);
      } else if (filters.sort === "newest") {
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setFilteredSettlements(result);
      setDisplayedSettlements(result.slice(0, itemsPerPage));
      setHasMore(result.length > itemsPerPage);
      
      setSearchParams({
        amount: filters.amount,
        case_type: filters.caseType,
        location: filters.location,
        sort: filters.sort
      }, { replace: true });
    };
    
    applyFilters();
  }, [settlements, filters, setSearchParams, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Wait a moment to simulate loading (and prevent rapid calls)
    setTimeout(() => {
      const currentLength = displayedSettlements.length;
      const newItems = filteredSettlements.slice(currentLength, currentLength + itemsPerPage);
      
      setDisplayedSettlements(prev => [...prev, ...newItems]);
      setHasMore(currentLength + newItems.length < filteredSettlements.length);
      setIsLoadingMore(false);
    }, 500);
  }, [displayedSettlements, filteredSettlements, hasMore, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentTarget = observerTarget.current;
    
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const getFilterOptions = () => {
    const caseTypes = ["all", ...new Set(settlements.map(s => s.type))];
    const locations = ["all", ...new Set(settlements.map(s => s.location))];
    
    return {
      caseTypes,
      locations
    };
  };
  
  const { caseTypes, locations } = getFilterOptions();

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-white">
      <GalleryHeader 
        settlementCount={filteredSettlements.length} 
        isLoading={isLoading}
        filters={filters}
        setFilters={handleFiltersChange}
        caseTypes={caseTypes}
        locations={locations}
      />
      
      <div className="container py-8">
        {connectionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-semibold">Supabase Connection Error</h3>
              <p className="text-sm">{connectionError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-700 underline text-sm mt-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-neutral-600">Loading settlements...</p>
              </div>
            </div>
          ) : (
            <>
              <SettlementGrid 
                settlements={displayedSettlements}
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
            </>
          )}
          
          {/* Loading indicator and intersection observer target */}
          {(hasMore || isLoadingMore) && (
            <div 
              ref={observerTarget} 
              className="py-8 flex justify-center items-center"
            >
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more settlements...</span>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-12">
            <SubmitCTA />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
