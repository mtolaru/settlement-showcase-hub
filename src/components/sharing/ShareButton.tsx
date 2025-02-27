
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Share2, Linkedin, Twitter, Mail, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  url: string;
  title: string;
  amount: string | number;
  caseType: string;
  variant?: "icon" | "button" | "full";
  className?: string;
}

export const ShareButton = ({ 
  url, 
  title, 
  amount, 
  caseType,
  variant = "icon",
  className = ""
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Format amount for sharing
  const formattedAmount = typeof amount === 'string' 
    ? amount.replace(/[^0-9.]/g, '') 
    : amount.toString();
    
  // Create sharing message
  const shareMessage = `I secured a $${formattedAmount} settlement for my client in a ${caseType} case. View more on SettlementWins.`;
  
  // Add UTM parameters to URL
  const getShareUrl = (source: string) => {
    const shareUrl = new URL(url);
    shareUrl.searchParams.append('utm_source', source);
    shareUrl.searchParams.append('utm_medium', 'social');
    shareUrl.searchParams.append('utm_campaign', 'settlement_share');
    return shareUrl.toString();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareMessage,
          url: getShareUrl('web_share_api')
        });
        
        toast({
          title: "Shared successfully",
          description: "Thank you for sharing your success!",
          variant: "success"
        });
      } catch (error) {
        // User probably canceled the share operation
        console.log('Sharing canceled:', error);
      }
    } else {
      // Fallback to copy to clipboard
      handleCopyLink();
    }
  };

  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl('linkedin'))}&summary=${encodeURIComponent(shareMessage)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Opening LinkedIn",
      description: "Share your success with your professional network",
      variant: "info"
    });
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(getShareUrl('twitter'))}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Opening Twitter",
      description: "Share your success with your followers",
      variant: "info"
    });
  };

  const handleEmailShare = () => {
    const subject = `${title} - Settlement Success Story`;
    const emailBody = `${shareMessage}\n\nView the full details here: ${getShareUrl('email')}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    
    toast({
      title: "Email share initiated",
      description: "Your email client should open shortly",
      variant: "info"
    });
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl('copy_link');
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    
    toast({
      title: "Link copied!",
      description: "The settlement URL has been copied to your clipboard",
      variant: "success"
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // For icon-only variant
  if (variant === "icon") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`text-neutral-500 hover:text-primary-500 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end" side="bottom">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Share this settlement</h3>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleLinkedInShare}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleTwitterShare}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleEmailShare}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleCopyLink}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // For standard button variant
  if (variant === "button") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={`text-primary-700 border-primary-200 hover:bg-primary-50 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4 mr-2" /> Share Settlement
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Share this settlement</h3>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleLinkedInShare}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleTwitterShare}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleEmailShare}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={handleCopyLink}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // For full-width CTA variant
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-center">Share Your Success</h3>
      <p className="text-sm text-neutral-600 text-center mb-4">
        Let your network know about your recent settlement success
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="w-full bg-[#0077B5] hover:bg-[#005885] flex items-center justify-center"
          onClick={handleLinkedInShare}
        >
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </Button>
        <Button
          className="w-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center"
          onClick={handleEmailShare}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="w-full bg-[#1DA1F2] hover:bg-[#0c85d0] flex items-center justify-center"
          onClick={handleTwitterShare}
        >
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleCopyLink}
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy Link
        </Button>
      </div>
      <Button 
        variant="ghost" 
        className="w-full text-neutral-500 hover:text-primary-900"
        onClick={handleShare}
      >
        Use native share (mobile)
      </Button>
    </div>
  );
};
