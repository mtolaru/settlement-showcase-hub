
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Calendar, DollarSign, ClipboardCheck, PieChart, Stethoscope, Award, Loader2 } from "lucide-react";
import { ShareButton } from "@/components/sharing/ShareButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";

const SettlementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettlement = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        // Convert string ID to number for Supabase query
        const numberId = parseInt(id, 10);
        
        // Check if conversion was successful
        if (isNaN(numberId)) {
          throw new Error("Invalid settlement ID");
        }
        
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('id', numberId)
          .eq('payment_completed', true)
          .single();

        if (error) {
          console.error('Error fetching settlement:', error);
          throw new Error("Settlement not found");
        }

        setSettlement(data);
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Settlement not found or could not be loaded",
        });
        navigate('/settlements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettlement();
  }, [id, toast, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-neutral-600">Fetching settlement details</p>
        </div>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Settlement Not Found</h2>
          <p className="text-neutral-600 mb-4">
            The settlement you're looking for couldn't be found or may have been removed.
          </p>
          <Link to="/settlements">
            <Button>View All Settlements</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/settlements">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settlements
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-4xl font-bold font-display">
              {formatCurrency(settlement.amount)} Settlement
            </h1>
            <ShareButton
              url={window.location.href}
              title={`${formatCurrency(settlement.amount)} Settlement - ${settlement.type}`}
              amount={settlement.amount.toString()}
              caseType={settlement.type}
              variant="full"
              className="bg-white text-primary-900 hover:bg-neutral-100"
            />
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-neutral-100">
                <img
                  src={settlement.photo_url || "/placeholder.svg"}
                  alt={`${settlement.type} case`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                    {settlement.type}
                  </span>
                  <span className="inline-block bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full text-sm font-medium">
                    {settlement.settlement_phase === 'pre-litigation' 
                      ? 'Pre-Litigation'
                      : settlement.settlement_phase === 'during-litigation'
                      ? 'During Litigation'
                      : settlement.settlement_phase === 'post-trial'
                      ? 'Post-Trial'
                      : 'Settlement'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mt-2 mb-1">Case Overview</h2>
                <p className="text-neutral-700 mb-6">
                  {settlement.case_description || settlement.description}
                </p>

                <div className="border-t border-neutral-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Settlement Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settlement.initial_offer && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary-100 p-2">
                          <ClipboardCheck className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">Initial Offer</dt>
                          <dd className="font-medium">{formatCurrency(settlement.initial_offer)}</dd>
                        </div>
                      </div>
                    )}
                    {settlement.policy_limit && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary-100 p-2">
                          <Award className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">Policy Limit</dt>
                          <dd className="font-medium">{formatCurrency(settlement.policy_limit)}</dd>
                        </div>
                      </div>
                    )}
                    {settlement.medical_expenses && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary-100 p-2">
                          <Stethoscope className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">Medical Expenses</dt>
                          <dd className="font-medium">{formatCurrency(settlement.medical_expenses)}</dd>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary-100 p-2">
                        <PieChart className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <dt className="text-sm text-neutral-500">Settlement/Medical Ratio</dt>
                        <dd className="font-medium">
                          {settlement.medical_expenses 
                            ? `${(settlement.amount / settlement.medical_expenses).toFixed(1)}x`
                            : 'N/A'}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-6">Attorney Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{settlement.attorney}</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-neutral-700">
                      {settlement.firmWebsite ? (
                        <a
                          href={settlement.firmWebsite.startsWith('http') ? settlement.firmWebsite : `https://${settlement.firmWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {settlement.firm}
                        </a>
                      ) : (
                        settlement.firm
                      )}
                    </p>
                    <div className="flex items-center text-neutral-600">
                      <Building2 className="h-4 w-4 mr-1" />
                      {settlement.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Settlement Summary</h2>
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Final Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(settlement.amount)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-neutral-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Settlement Date</span>
                  </div>
                  <div>
                    {new Date(settlement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Share This Settlement</h2>
              <ShareButton
                url={window.location.href}
                title={`${formatCurrency(settlement.amount)} Settlement - ${settlement.type}`}
                amount={settlement.amount.toString()}
                caseType={settlement.type}
                variant="full"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDetail;
