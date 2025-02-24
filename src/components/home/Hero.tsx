
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="bg-white pt-20 pb-24">
      <div className="container max-w-6xl mx-auto text-center">
        <h1 className="text-[4rem] leading-tight font-bold font-display text-neutral-900 mb-6">
          WE GIVE CREDIT
          <br />
          WHERE CREDIT IS DUE
        </h1>
        <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-12">
          Share your success, generate more leads, discover settlements —
          fast, simple, impactful. Democratizing legal wins, one settlement at a time.
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-16">
          <Link to="/submit">
            <Button 
              className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 text-base h-11"
            >
              Submit Settlement
            </Button>
          </Link>
          <Link to="/settlements">
            <Button 
              variant="outline" 
              className="px-6 py-2 text-base h-11"
            >
              Browse Settlements
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search settlements, firms, or case types..."
              className="w-full pl-10 pr-4 py-3 text-lg bg-white border-2 border-neutral-200 focus:border-primary-500 rounded-lg shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
