import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Hero = () => {
  return <section className="bg-white pt-20 pb-24">
      <div className="container max-w-6xl mx-auto text-center">
        <h1 className="text-[4rem] leading-tight font-bold font-display text-neutral-900 mb-6">
          WE GIVE CREDIT
          <br />
          WHERE CREDIT IS DUE
        </h1>
        <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-12">Share your success and generate more leads — fast, simple, impactful. Turn your settlement victories into shareable marketing content.</p>
        
        <div className="flex items-center justify-center gap-4">
          <Link to="/submit">
            <Button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 text-base h-11">
              Submit Settlement
            </Button>
          </Link>
          <Link to="/settlements">
            <Button variant="outline" className="px-6 py-2 text-base h-11">
              Browse Settlements
            </Button>
          </Link>
        </div>
      </div>
    </section>;
};
export default Hero;