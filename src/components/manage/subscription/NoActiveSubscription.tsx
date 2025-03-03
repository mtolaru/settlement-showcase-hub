
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NoActiveSubscription = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <p className="text-neutral-600">
        You currently don't have an active subscription. Subscribe to unlock unlimited settlement submissions and more features.
      </p>
      <Button onClick={() => navigate('/pricing')}>
        Subscribe Now
      </Button>
    </div>
  );
};

export default NoActiveSubscription;
