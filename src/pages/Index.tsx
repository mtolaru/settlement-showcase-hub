
import { useState, useEffect } from "react";
import { getCities } from "@/lib/locations";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";
import { ArrowRight, Trophy, Clock, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedCity, setSelectedCity] = useState("all");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const cities = getCities();

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setIsLoading(true);
        
        // First, get all users with active subscriptions
        const { data: subscribedUsers, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('user_id, temporary_id')
          .eq('is_active', true);
          
        if (subscriptionError) {
          throw subscriptionError;
        }
        
        // Collect all user IDs and temporary IDs from active subscriptions
        const userIds = subscribedUsers
          ?.filter(sub => sub.user_id)
          .map(sub => sub.user_id) || [];
          
        const temporaryIds = subscribedUsers
          ?.filter(sub => sub.temporary_id)
          .map(sub => sub.temporary_id) || [];
        
        // Fetch settlements from subscribed users or with payment_completed=true
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .or(`user_id.in.(${userIds.join(',')}),temporary_id.in.(${temporaryIds.join(',')}),payment_completed.eq.true`);

        if (error) {
          throw error;
        }

        console.log('Fetched settlements for homepage:', data);
        
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

    fetchSettlements();
  }, [toast]);

  const filteredSettlements = settlements.filter(settlement => 
    selectedCity === "all" || settlement.location === selectedCity
  );

  const recentSettlements = [...filteredSettlements]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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

      <section className="py-12 bg-neutral-50">
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
              <LoadingState />
            ) : recentSettlements.length > 0 ? (
              recentSettlements.map((settlement) => (
                <SettlementCard 
                  key={settlement.id} 
                  settlement={formatSettlement(settlement)} 
                />
              ))
            ) : (
              <EmptyState type="recent" />
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
