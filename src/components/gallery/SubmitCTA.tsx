
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SubmitCTA = () => {
  return (
    <div className="mt-12 text-center">
      <div className="bg-primary-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold font-display text-primary-900 mb-4">
          Ready to Showcase Your Settlement?
        </h2>
        <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
          Join the leading attorneys who are already leveraging their settlement wins
          to attract high-value cases.
        </p>
        <Link to="/submit">
          <Button className="bg-primary-500 hover:bg-primary-600">
            Submit Your Settlement <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SubmitCTA;
