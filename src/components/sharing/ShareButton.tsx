import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Share2, Linkedin, Mail, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackButtonClick } from "@/utils/analytics";

interface ShareButtonProps {
  url: string;
  title: string;
  amount: string | number;
  caseType: string;
  variant?: "icon" | "button" | "full" | "social";
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
  
  const formattedAmount = typeof amount === 'string' 
    ? parseFloat(amount.replace(/[^0-9.]/g, '')).toLocaleString('en-US')
    : amount.toLocaleString('en-US');
    
  const shareMessage = `I secured a $${formattedAmount} settlement for my client in a ${caseType} case. View more on SettlementWins.`;
  
  const getShareUrl = (source: string) => {
    const shareUrl = new URL(url);
    shareUrl.searchParams.append('utm_source', source);
    shareUrl.searchParams.append('utm_medium', 'social');
    shareUrl.searchParams.append('utm_campaign', 'settlement_share');
    return shareUrl.toString();
  };

  const handleShare = async () => {
    trackButtonClick({
      button_name: "share_native",
      page_location: window.location.pathname,
      component: "ShareButton",
      action: "native_share"
    });
    
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
        console.log('Sharing canceled:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleLinkedInShare = () => {
    trackButtonClick({
      button_name: "share_linkedin",
      page_location: window.location.pathname,
      component: "ShareButton",
      action: "social_share"
    });
    
    const linkedinUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedinUrl.searchParams.append('url', getShareUrl('linkedin'));
    
    window.open(linkedinUrl.toString(), '_blank', 'noopener,noreferrer,width=600,height=600');
    
    toast({
      title: "Opening LinkedIn",
      description: "Your LinkedIn share dialog will open with the settlement details",
      variant: "info"
    });
  };

  const handleTwitterShare = () => {
    trackButtonClick({
      button_name: "share_twitter",
      page_location: window.location.pathname,
      component: "ShareButton",
      action: "social_share"
    });
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(getShareUrl('twitter'))}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Opening X",
      description: "Share your success with your followers",
      variant: "info"
    });
  };

  const handleEmailShare = () => {
    trackButtonClick({
      button_name: "share_email",
      page_location: window.location.pathname,
      component: "ShareButton",
      action: "email_share"
    });
    
    const subject = `${title} - Settlement Success Story`;
    
    const emailBody = `${shareMessage.replace('SettlementWins.', `<a href="${getShareUrl('email')}">SettlementWins</a>.`)}\n\n`;
    
    const plainEmailBody = `${shareMessage}\n\nView the full details here: ${getShareUrl('email')}`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainEmailBody)}`;
    window.location.href = mailtoUrl;
    
    toast({
      title: "Email share initiated",
      description: "Your email client should open shortly",
      variant: "info"
    });
  };

  const handleCopyLink = () => {
    trackButtonClick({
      button_name: "share_copy_link",
      page_location: window.location.pathname,
      component: "ShareButton",
      action: "copy_link"
    });
    
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

  const XLogo = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-2"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

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
        <PopoverContent className="w-56 p-3 bg-white border border-neutral-200 shadow-lg" align="end" side="bottom">
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
              <XLogo />
              X
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
        <PopoverContent className="w-56 p-3 bg-white border border-neutral-200 shadow-lg" align="end">
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
              <XLogo />
              X
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

  if (variant === "social") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="w-full bg-[#0077B5] hover:bg-[#005885] flex items-center justify-center"
            onClick={handleLinkedInShare}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
          <Button
            className="w-full bg-[#000000] hover:bg-[#333333] flex items-center justify-center"
            onClick={handleTwitterShare}
          >
            <XLogo />
            X
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="w-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center"
            onClick={handleEmailShare}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
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
      </div>
    );
  }

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
          className="w-full bg-[#000000] hover:bg-[#333333] flex items-center justify-center"
          onClick={handleTwitterShare}
        >
          <XLogo />
          X
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
