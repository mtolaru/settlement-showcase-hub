
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-16 bg-primary-900 text-white">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Share Your Success?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join the leading platform for showcasing legal settlements
          </p>
          <Link to="/submit">
            <Button size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
              Submit Your Settlement <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
