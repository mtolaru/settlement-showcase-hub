import { useState, useEffect } from "react";
import { getCities } from "@/lib/locations";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";
import { ArrowRight, Trophy, Clock, FileQuestion, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedCity, setSelectedCity] = useState("all");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const cities = getCities();

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
        
        console.log('Starting to fetch settlements from:', supabase.supabaseUrl);
        
        const { data: subscribedUsers, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('user_id, temporary_id')
          .eq('is_active', true);
          
        if (subscriptionError) {
          console.error('Error fetching subscriptions:', subscriptionError);
          throw subscriptionError;
        }
        
        const userIds = subscribedUsers
          ?.filter(sub => sub.user_id)
          .map(sub => sub.user_id) || [];
          
        const temporaryIds = subscribedUsers
          ?.filter(sub => sub.temporary_id)
          .map(sub => sub.temporary_id) || [];
        
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
        
        console.log('Final query parts:', queryParts);
        
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .or(queryParts.join(','));

        if (error) {
          console.error('Error fetching settlements:', error);
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
        
        const uniqueSettlements = processedData ? 
          Array.from(new Map(processedData.map(item => [item.id, item])).values()) : 
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

    if (!connectionError) {
      fetchSettlements();
    }
  }, [toast, connectionError]);
  
  const filteredSettlements = settlements.filter(settlement => 
    selectedCity === "all" || settlement.location === selectedCity
  );

  const recentSettlements = [...filteredSettlements]
    .sort((a, b) => new Date(b.settlement_date).getTime() - new Date(a.settlement_date).getTime())
    .slice(0, 3);

  const topSettlements = [...filteredSettlements]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
    
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch (e) {
      return "Unknown";
    }
  };

  const formatSettlement = (settlement: Settlement) => ({
    id: settlement.id,
    type: settlement.type,
    amount: `$${(settlement.amount).toLocaleString()}`,
    lawyer: settlement.attorney,
    firm: settlement.firm,
    firmWebsite: settlement.firmWebsite,
    location: settlement.location,
    date: formatDate(settlement.created_at),
    settlementDate: formatDate(settlement.settlement_date),
    photo_url: settlement.photo_url
  });

  const LoadingState = () => (
    <div className="col-span-1 md:col-span-3 py-16 flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary-400 animate-spin mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        Loading Settlements
      </h3>
      <p className="text-neutral-600 text-center max-w-md">
        Please wait while we fetch the latest settlement data...
      </p>
    </div>
  );

  const EmptyState = ({ type }: { type: "recent" | "top" }) => (
    <div className="col-span-1 md:col-span-3 py-16 flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-neutral-300">
      <FileQuestion className="h-12 w-12 text-neutral-400 mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        No {type === "recent" ? "Recent" : "Top"} Settlements Found
      </h3>
      <p className="text-neutral-600 text-center max-w-md mb-6">
        {type === "recent" 
          ? "There are no recent settlements in this location yet." 
          : "There are no top settlements in this location yet."}
      </p>
      <Link to="/submit">
        <Button variant="outline">
          Submit Your Settlement
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="w-full">
      <Hero />
      <LocationSelector 
        cities={cities} 
        onCitySelect={setSelectedCity}
        selectedCity={selectedCity}
      />

      {connectionError && (
        <div className="container mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-semibold">Supabase Connection Error</h3>
              <p className="text-sm">{connectionError}</p>
              <p className="text-sm mt-1">Check the console for more details or try refreshing the page.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-700 underline text-sm mt-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="py-12 bg-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary-500" />
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Recent Settlements</h2>
                <p className="text-neutral-600">Latest cases and victories from our community</p>
              </div>
            </div>
            <Link to="/settlements">
              <Button variant="outline" className="group">
                View More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-1 md:col-span-3 py-16 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary-400 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Loading Settlements
                </h3>
                <p className="text-neutral-600 text-center max-w-md">
                  Please wait while we fetch the latest settlement data...
                </p>
              </div>
            ) : settlements.length > 0 ? (
              recentSettlements.map((settlement) => (
                <SettlementCard 
                  key={settlement.id} 
                  settlement={formatSettlement(settlement)} 
                />
              ))
            ) : (
              <div className="col-span-1 md:col-span-3 py-16 flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-neutral-300">
                <FileQuestion className="h-12 w-12 text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No Settlements Found
                </h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  We couldn't find any settlements. This might be due to a connection issue or there may not be any data yet.
                </p>
                <Link to="/submit">
                  <Button variant="outline">
                    Submit Your Settlement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary-900 text-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent-300" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Top Settlements</h2>
                <p className="text-primary-200">Highest value settlements in our database</p>
              </div>
            </div>
            <Link to="/settlements">
              <Button 
                variant="outline-on-dark" 
                className="group"
              >
                View More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <LoadingState />
            ) : topSettlements.length > 0 ? (
              topSettlements.map((settlement) => (
                <SettlementCard 
                  key={settlement.id} 
                  settlement={formatSettlement(settlement)} 
                />
              ))
            ) : (
              <EmptyState type="top" />
            )}
          </div>
        </div>
      </section>

      <WhyShare />
      <CallToAction />
    </div>
  );
};

export default Index;
