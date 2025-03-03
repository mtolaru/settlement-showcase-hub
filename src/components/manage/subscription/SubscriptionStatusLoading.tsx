
import { Loader2 } from "lucide-react";

const SubscriptionStatusLoading = () => {
  return (
    <div className="flex items-center gap-2 text-neutral-600">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading subscription details...</span>
    </div>
  );
};

export default SubscriptionStatusLoading;
