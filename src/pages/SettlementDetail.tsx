import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Calendar, DollarSign, ClipboardCheck, PieChart, Stethoscope, Award, Loader2 } from "lucide-react";
import { ShareButton } from "@/components/sharing/ShareButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Settlement } from "@/types/settlement";
import { resolveSettlementImageUrl, resolveSettlementImageUrlSync } from "@/utils/imageUtils";

const SettlementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettlement = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const numberId = parseInt(id, 10);
        
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

        console.log('Raw settlement data:', data);

        const processedData: Settlement = {
          id: data.id,
          amount: data.amount,
          type: data.type,
          firm: data.firm,
          firmWebsite: data.firm_website,
          attorney: data.attorney,
          location: data.location,
          created_at: data.created_at,
          settlement_date: data.settlement_date || data.created_at,
          description: data.description,
          case_description: data.case_description,
          initial_offer: data.initial_offer !== undefined ? data.initial_offer : null,
          policy_limit: data.policy_limit !== undefined ? data.policy_limit : null,
          medical_expenses: data.medical_expenses !== undefined ? data.medical_expenses : null,
          settlement_phase: data.settlement_phase,
          temporary_id: data.temporary_id,
          user_id: data.user_id,
          payment_completed: data.payment_completed,
          photo_url: data.photo_url,
          attorney_email: data.attorney_email
        };

        console.log('Processed settlement data:', processedData);
        setSettlement(processedData);
        
        const initialUrl = resolveSettlementImageUrlSync(processedData.photo_url, processedData.id);
        setImageUrl(initialUrl);
        
        const verifiedUrl = await resolveSettlementImageUrl(processedData.photo_url, processedData.id);
        if (verifiedUrl !== initialUrl) {
          setImageUrl(verifiedUrl);
        }
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

  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoadError(false);
  };
  
  const handleImageError = () => {
    console.error(`Error loading image for detail page:`, imageUrl);
    setLoadError(true);
    
    if (imageUrl !== "/placeholder.svg") {
      setImageUrl("/placeholder.svg");
    }
  };

  // Format the title for sharing metadata
  const formatShareTitle = (settlement: Settlement | null) => {
    if (!settlement) return '';
    const formattedAmount = formatCurrency(settlement.amount).replace('$', '$');
    return `${formattedAmount} Settlement - ${settlement.type} - ${settlement.firm}`;
  };

  // Format the description for sharing metadata
  const formatShareDescription = (settlement: Settlement | null) => {
    if (!settlement) return '';
    return settlement.case_description || 
           `${settlement.attorney} secured a ${formatCurrency(settlement.amount)} settlement in a ${settlement.type} case.`;
  };

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
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  const getSettlementPhaseLabel = (phase: string | null) => {
    if (!phase) return "Settlement";
    
    switch (phase) {
      case 'pre-litigation':
        return 'Pre-Litigation';
      case 'during-litigation':
        return 'During Litigation';
      case 'post-trial':
        return 'Post-Trial';
      default:
        return phase.charAt(0).toUpperCase() + phase.slice(1);
    }
  };

  return (
    <>
      <Helmet>
        {/* OpenGraph tags for LinkedIn and other platforms */}
        <meta property="og:title" content={formatShareTitle(settlement)} />
        <meta property="og:description" content={formatShareDescription(settlement)} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        
        {/* LinkedIn specific tags */}
        <meta name="linkedin:title" content={formatShareTitle(settlement)} />
        <meta name="linkedin:description" content={formatShareDescription(settlement)} />
        <meta name="linkedin:image" content={imageUrl} />
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        <div className="bg-primary-900 text-white py-12">
          <div className="container">
            <Link to="/settlements">
              <Button variant="ghost" className="text-white mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settlements
              </Button>
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold font-display">
                  {formatCurrency(settlement.amount)} Settlement
                </h1>
                <div className="mt-2 text-primary-200">
                  {settlement.type}
                </div>
              </div>
              <ShareButton
                url={window.location.href}
                title={`${formatCurrency(settlement.amount)} Settlement - ${settlement.type}`}
                amount={settlement.amount.toString()}
                caseType={settlement.type}
                variant="icon"
                className="bg-white text-primary-900 hover:bg-neutral-100"
              />
            </div>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-neutral-100 relative" style={{ height: "400px" }}>
                  {!imageLoaded && !loadError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt={`${settlement.type} case`}
                    className={`w-full h-full object-cover absolute inset-0 ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {settlement.type}
                    </span>
                    <span className="inline-block bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full text-sm font-medium">
                      {getSettlementPhaseLabel(settlement.settlement_phase)}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mt-2 mb-1">Case Overview</h2>
                  <p className="text-neutral-700 mb-6">
                    {settlement.case_description || settlement.description}
                  </p>

                  <div className="border-t border-neutral-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Settlement Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settlement.initial_offer !== null && settlement.initial_offer !== undefined && (
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
                      {settlement.policy_limit !== null && settlement.policy_limit !== undefined && (
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
                      {settlement.medical_expenses !== null && settlement.medical_expenses !== undefined && (
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
                      {settlement.medical_expenses !== null && settlement.medical_expenses !== undefined && settlement.amount && (
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-primary-100 p-2">
                            <PieChart className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <dt className="text-sm text-neutral-500">Settlement/Medical Ratio</dt>
                            <dd className="font-medium">
                              {settlement.medical_expenses > 0 
                                ? `${(settlement.amount / settlement.medical_expenses).toFixed(1)}x`
                                : "-"}
                            </dd>
                          </div>
                        </div>
                      )}
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
                      {formatDate(settlement.settlement_date)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg shadow-md p-6">
                <h3 className="font-medium text-primary-900 mb-4">Share this Settlement</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="w-full bg-[#0077B5] hover:bg-[#005885] flex items-center justify-center"
                    onClick={() => {
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                    }}
                  >
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </span>
                  </Button>
                  <Button
                    className="w-full bg-[#000000] hover:bg-[#333333] flex items-center justify-center"
                    onClick={() => {
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out this ${formatCurrency(settlement.amount)} settlement for a ${settlement.type} case`)}`, '_blank');
                    }}
                  >
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                      X
                    </span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button
                    className="w-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center"
                    onClick={() => {
                      window.location.href = `mailto:?subject=${encodeURIComponent(`${formatCurrency(settlement.amount)} Settlement - ${settlement.type}`)}&body=${encodeURIComponent(`Check out this ${formatCurrency(settlement.amount)} settlement for a ${settlement.type} case: ${window.location.href}`)}`;
                    }}
                  >
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v14a2 2 0 0 1-2 2v1h-14a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Email
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link copied!",
                        description: "Settlement link copied to clipboard",
                      });
                    }}
                  >
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                      Copy Link
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettlementDetail;
