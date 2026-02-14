import { HelpCircle, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const faqs = [
  {
    question: "What are Claims?",
    answer: "Claims are your currency on Crescendo. Use them to unlock rewards from brands, creators, and community members. Each reward has a claim cost that gets deducted from your balance when you claim it."
  },
  {
    question: "How do I get Claims?",
    answer: "You can purchase Claims packages with real money, or earn them through activities like referrals, daily check-ins, and special promotions. Check the Earn page for current opportunities."
  },
  {
    question: "What are the status tiers?",
    answer: "Crescendo has five status tiers: Bronze → Silver → Gold → Platinum → Diamond. Higher tiers unlock better pricing on sponsored rewards, exclusive access, and special perks."
  },
  {
    question: "How do I level up my status?",
    answer: "Lock NCTR tokens in The Garden to increase your tier. The more NCTR you lock, the higher your status level. Your tier is calculated based on your total locked NCTR balance."
  },
  {
    question: "What happens when I claim a reward?",
    answer: "When you claim a reward, your Claims balance is deducted and the reward is delivered based on its type. Digital rewards like codes or subscriptions are delivered instantly. Physical items require shipping information."
  },
  {
    question: "Can I transfer Claims to another user?",
    answer: "Yes! You can send Claims as gifts to other users via email. The recipient will receive a gift code they can redeem to add the Claims to their account."
  },
  {
    question: "What is NCTR?",
    answer: "NCTR is the native token of the NCTR Alliance ecosystem. On Crescendo, you can earn bonus NCTR with purchases and lock NCTR to unlock status tier benefits."
  },
  {
    question: "How do refunds work?",
    answer: "Claims purchases are generally non-refundable once completed. If you encounter issues with a reward after claiming, please contact support for assistance."
  },
  {
    question: "How do I contact support?",
    answer: "Click the feedback button in the corner of any page to submit feedback or report issues, or email us at support@crescendo.nctr.live. We typically respond within 24-48 hours."
  },
  {
    question: "Is Crescendo available on mobile?",
    answer: "Crescendo is a web application that works on all devices. Simply visit the site on your mobile browser for the full experience. A dedicated mobile app may be coming in the future."
  },
];

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Help & FAQ" 
        description="Get answers to common questions about Crescendo, Claims, rewards, and status tiers."
      />
      
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Help & FAQ</h1>
            <p className="text-muted-foreground">
              Find answers to common questions about Crescendo
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full mb-8">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Still have questions?
              </CardTitle>
              <CardDescription>
                We're here to help! Reach out to our support team.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="mailto:support@crescendo.nctr.live">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default HelpPage;