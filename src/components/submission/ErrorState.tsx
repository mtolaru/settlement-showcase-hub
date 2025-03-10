
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  temporaryId?: string | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, temporaryId }) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkSettlementStatus = async () => {
    try {
      setIsChecking(true);
      
      // Try to get temporaryId from props or localStorage
      const tempId = temporaryId || localStorage.getItem('temporary_id');
      const sessionId = localStorage.getItem('payment_session_id');
      
      console.log("Checking settlement status:", { 
        tempId, 
        sessionId,
        location: window.location.href,
        retryCount
      });
      
      if (!tempId && !sessionId) {
        toast({
          variant: "destructive",
          title: "Missing settlement reference",
          description: "We couldn't find your settlement reference. Please contact support."
        });
        return;
      }

      // First try to directly query Stripe webhook status through the edge function
      if (sessionId) {
        try {
          console.log("Checking Stripe webhook status via edge function");
          const { data: webhookData, error: webhookError } = await supabase.functions.invoke('check-payment-status', {
            body: { 
              session_id: sessionId,
              temporary_id: tempId || null
            }
          });
          
          if (webhookError) {
            console.error("Error checking webhook status:", webhookError);
          } else if (webhookData?.success) {
            console.log("Payment status check successful:", webhookData);
            
            toast({
              title: "Payment confirmed!",
              description: "We've verified your payment. Refreshing the page..."
            });
            
            // Refresh the page after a short delay
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
        } catch (webhookErr) {
          console.error("Exception checking webhook status:", webhookErr);
        }
      }

      // Then try by temporary ID
      if (tempId) {
        const { data: tempData, error: tempError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', tempId)
          .maybeSingle();
          
        if (tempError) {
          console.error("Error checking by temporaryId:", tempError);
        }
        
        if (tempData) {
          console.log("Found settlement by temporaryId:", tempData);
          
          // If payment not marked as completed but we have a session ID, update it
          if (!tempData.payment_completed && sessionId) {
            console.log("Updating payment_completed status manually");
            
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ payment_completed: true })
              .eq('id', tempData.id);
              
            if (updateError) {
              console.error("Error updating payment status:", updateError);
            } else {
              console.log("Successfully updated payment status");
            }
          }
          
          toast({
            title: "Settlement found!",
            description: "Redirecting to your settlement..."
          });
          
          // Refresh the page to trigger confirmation flow
          setTimeout(() => window.location.reload(), 1500);
          return;
        } else {
          // Settlement not found by temporary ID, create one if we have a session ID
          if (sessionId) {
            try {
              console.log("Creating settlement record from session ID");
              
              const { data: fixData, error: fixError } = await supabase.functions.invoke('fix-settlement', {
                body: { 
                  sessionId,
                  temporaryId: tempId
                }
              });
              
              if (fixError) {
                console.error("Error fixing settlement:", fixError);
              } else if (fixData?.success) {
                console.log("Successfully created settlement from session:", fixData);
                
                toast({
                  title: "Settlement recovered!",
                  description: "We've recovered your settlement. Refreshing..."
                });
                
                setTimeout(() => window.location.reload(), 1500);
                return;
              }
            } catch (fixErr) {
              console.error("Exception fixing settlement:", fixErr);
            }
          }
        }
      }
      
      // Then try by session ID
      if (sessionId) {
        console.log("Checking by session ID:", sessionId);
        
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('temporary_id')
          .eq('payment_id', sessionId)
          .maybeSingle();
          
        if (subError) {
          console.error("Error checking by sessionId:", subError);
        }
        
        if (subData?.temporary_id) {
          console.log("Found subscription by sessionId:", subData);
          
          // Now look up the settlement
          const { data: settlementData } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', subData.temporary_id)
            .maybeSingle();
            
          if (settlementData) {
            console.log("Found settlement via subscription:", settlementData);
            
            // Store the temporaryId in localStorage and reload
            localStorage.setItem('temporary_id', subData.temporary_id);
            
            toast({
              title: "Settlement found!",
              description: "Redirecting to your settlement..."
            });
            
            setTimeout(() => window.location.reload(), 1500);
            return;
          } else {
            // Found subscription but no settlement - create one
            try {
              const { data: createData, error: createError } = await supabase
                .from('settlements')
                .insert({
                  temporary_id: subData.temporary_id,
                  payment_completed: true,
                  stripe_session_id: sessionId,
                  amount: 0, 
                  type: 'Unknown',
                  firm: 'Unknown',
                  attorney: 'Unknown',
                  location: 'Unknown'
                })
                .select()
                .single();
                
              if (createError) {
                console.error("Error creating placeholder settlement:", createError);
              } else {
                console.log("Created placeholder settlement:", createData);
                
                toast({
                  title: "Settlement created!",
                  description: "We've created a placeholder settlement. Refreshing..."
                });
                
                setTimeout(() => window.location.reload(), 1500);
                return;
              }
            } catch (createErr) {
              console.error("Exception creating placeholder settlement:", createErr);
            }
          }
        }
      }
      
      // If we get here, we didn't find a settlement
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= 2) {
        // Try last resort method with direct function invocation
        try {
          console.log("Attempting last resort direct function invocation");
          
          const { data: manualFixData, error: manualFixError } = await supabase.functions.invoke('fix-settlement', {
            body: { 
              sessionId,
              temporaryId: tempId
            }
          });
          
          console.log("Manual fix attempt result:", { manualFixData, manualFixError });
          
          if (manualFixData?.success) {
            toast({
              title: "Settlement recovered!",
              description: "We were able to recover your settlement. Refreshing..."
            });
            
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
        } catch (lastResortError) {
          console.error("Exception in last resort method:", lastResortError);
        }
        
        toast({
          variant: "destructive",
          title: "Settlement not found",
          description: "We couldn't locate your settlement after multiple attempts. The payment may have been processed, but there was an issue finding your submission."
        });
      } else {
        toast({
          title: "Still processing",
          description: "Your settlement may still be processing. Please try again in a moment."
        });
      }
      
    } catch (err) {
      console.error("Exception checking settlement status:", err);
      toast({
        variant: "destructive",
        title: "Error checking status",
        description: "There was a technical problem checking your settlement status."
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-neutral-200">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-neutral-600 mb-4">{error}</p>
        <p className="text-sm text-neutral-500 mb-6">
          If you've completed payment, your settlement has been recorded, but we're having trouble displaying it.
          Please try refreshing this page or checking your settlements later.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={checkSettlementStatus} 
            variant="secondary" 
            className="w-full flex items-center justify-center"
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>Check Settlement Status</>
            )}
          </Button>
          
          <Link to="/submit">
            <Button className="w-full">Return to Submit Page</Button>
          </Link>
          
          <Link to="/settlements">
            <Button variant="outline" className="w-full">View Settlement Gallery</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
