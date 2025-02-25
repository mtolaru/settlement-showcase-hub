
import { Award, Share2, Target, LightningBolt, Smartphone } from "lucide-react";

const WhyShare = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Share Your Settlements?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="mb-4">
                <Award className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rank Among Peers</h3>
              <p className="text-neutral-600">Gain visibility through our ranking system that highlights top settlements by amount, case type, and location.</p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="mb-4">
                <Share2 className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Showcase Your Wins</h3>
              <p className="text-neutral-600">Prominently display your settlement amounts, case types, and results in a professional gallery that builds credibility with potential clients.</p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="mb-4">
                <Target className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Discovered</h3>
              <p className="text-neutral-600">Be found by potential clients searching for attorneys with proven success in specific case types or locations.</p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="mb-4">
                <LightningBolt className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy Submission</h3>
              <p className="text-neutral-600">Submit your settlements in minutes with our simple, streamlined process - no complex setup required.</p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="mb-4">
                <Smartphone className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mobile Responsive</h3>
              <p className="text-neutral-600">Looks great on all devices, so you can showcase your settlements wherever potential clients are looking.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyShare;
