
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface SettlementDiagnosticProps {
  userId?: string;
  refreshSettlements: () => void;
}

const SettlementDiagnostic = ({ userId, refreshSettlements }: SettlementDiagnosticProps) => {
  const [temporaryId, setTemporaryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to run diagnostics.",
      });
      return;
    }

    try {
      setLoading(true);
      
      // First, check latest settlement
      const { data: latestSettlement, error: latestError } = await supabase
        .from('settlements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (latestError) {
        console.error("Error fetching latest settlement:", latestError);
      }
      
      // Check settlement by temporary ID if provided
      let tempIdSettlement = null;
      if (temporaryId) {
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', temporaryId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching settlement by temporaryId:", error);
        } else {
          tempIdSettlement = data;
        }
      }
      
      // Check for unlinked settlements by email
      const { data: { user } } = await supabase.auth.getUser();
      let unlinkedByEmail = [];
      
      if (user?.email) {
        const { data: emailSettlements, error: emailError } = await supabase
          .from('settlements')
          .select('*')
          .eq('attorney_email', user.email)
          .is('user_id', null)
          .eq('payment_completed', true);
          
        if (emailError) {
          console.error("Error fetching unlinked settlements by email:", emailError);
        } else {
          unlinkedByEmail = emailSettlements || [];
        }
      }
      
      // Set diagnostic data
      setDiagnosticData({
        latestSettlement,
        tempIdSettlement,
        unlinkedByEmail,
        currentUser: user
      });
      
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run settlement diagnostics.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const linkTemporaryIdToUser = async () => {
    if (!userId || !temporaryId) return;
    
    try {
      setLoading(true);
      
      // Update the settlement with the user ID
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ user_id: userId })
        .eq('temporary_id', temporaryId);
        
      if (updateError) {
        console.error("Error linking settlement:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to link settlement. Please try again.",
        });
      } else {
        toast({
          title: "Settlement Linked",
          description: "Settlement has been linked to your account.",
        });
        runDiagnostic();
        refreshSettlements();
      }
    } catch (error) {
      console.error("Error linking settlement:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const claimUnlinkedSettlements = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        const { data: updated, error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .is('user_id', null)
          .eq('attorney_email', user.email)
          .eq('payment_completed', true)
          .select('id');
          
        if (updateError) {
          console.error("Error claiming settlements:", updateError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to claim settlements.",
          });
        } else if (updated && updated.length > 0) {
          toast({
            title: "Settlements Claimed",
            description: `Successfully claimed ${updated.length} settlements.`,
          });
          runDiagnostic();
          refreshSettlements();
        } else {
          toast({
            title: "No Settlements Found",
            description: "No unlinked settlements were found for your email.",
          });
        }
      }
    } catch (error) {
      console.error("Error claiming settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Settlement Diagnostic Tools</h3>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Settlement Temporary ID"
          value={temporaryId}
          onChange={(e) => setTemporaryId(e.target.value)}
          className="flex-1"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runDiagnostic}
          disabled={loading}
        >
          Run Diagnostic
        </Button>
        {temporaryId && (
          <Button
            variant="outline"
            size="sm"
            onClick={linkTemporaryIdToUser}
            disabled={loading || !userId}
          >
            Link to Me
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={claimUnlinkedSettlements}
          disabled={loading || !userId}
        >
          Claim by Email
        </Button>
      </div>
      
      {diagnosticData && (
        <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-40 overflow-auto">
          {diagnosticData.latestSettlement && (
            <div>
              <p className="font-semibold">Latest Settlement:</p>
              <p>ID: {diagnosticData.latestSettlement.id}</p>
              <p>User ID: {diagnosticData.latestSettlement.user_id || 'None'}</p>
              <p>Temporary ID: {diagnosticData.latestSettlement.temporary_id}</p>
              <p>Payment Completed: {diagnosticData.latestSettlement.payment_completed ? 'Yes' : 'No'}</p>
              <p>Attorney Email: {diagnosticData.latestSettlement.attorney_email}</p>
              <Separator className="my-2" />
            </div>
          )}
          
          {diagnosticData.tempIdSettlement && (
            <div>
              <p className="font-semibold">Settlement with Temporary ID:</p>
              <p>ID: {diagnosticData.tempIdSettlement.id}</p>
              <p>User ID: {diagnosticData.tempIdSettlement.user_id || 'None'}</p>
              <p>Payment Completed: {diagnosticData.tempIdSettlement.payment_completed ? 'Yes' : 'No'}</p>
              <p>Attorney Email: {diagnosticData.tempIdSettlement.attorney_email}</p>
              <Separator className="my-2" />
            </div>
          )}
          
          {diagnosticData.unlinkedByEmail.length > 0 && (
            <div>
              <p className="font-semibold">Unlinked Settlements by Email ({diagnosticData.unlinkedByEmail.length}):</p>
              {diagnosticData.unlinkedByEmail.map((s: any) => (
                <div key={s.id} className="mb-1">
                  <p>ID: {s.id}, Temporary ID: {s.temporary_id}</p>
                </div>
              ))}
              <Separator className="my-2" />
            </div>
          )}
          
          {diagnosticData.currentUser && (
            <div>
              <p className="font-semibold">Current User:</p>
              <p>ID: {diagnosticData.currentUser.id}</p>
              <p>Email: {diagnosticData.currentUser.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettlementDiagnostic;
