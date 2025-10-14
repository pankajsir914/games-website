import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I deposit money into my wallet?",
    answer: "Go to the Wallet page, click on 'Add Money', select your preferred payment method, enter the amount, and follow the payment instructions. Your balance will be updated instantly upon successful payment.",
  },
  {
    question: "How can I withdraw my winnings?",
    answer: "Navigate to the Wallet page, click on 'Withdraw Money', enter the amount you wish to withdraw, and select your preferred withdrawal method. Withdrawals are typically processed within 24-48 hours.",
  },
  {
    question: "What games are available on GameZone?",
    answer: "We offer a wide variety of games including Ludo, Aviator, Color Prediction, Andar Bahar, Roulette, Teen Patti, Poker, Rummy, Jackpot, and more. Visit our Games section to explore all available options.",
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we use industry-standard encryption and security measures to protect your personal information and financial transactions. Your data is stored securely and never shared with third parties.",
  },
  {
    question: "What are the minimum and maximum bet amounts?",
    answer: "Minimum and maximum bet amounts vary by game. Generally, minimum bets start from ₹10, and maximum bets can go up to ₹10,000 depending on the game type and your account status.",
  },
  {
    question: "How do I verify my account?",
    answer: "To verify your account, go to your profile settings and upload the required documents (ID proof, address proof). Our team will review and verify your account within 24 hours.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support various payment methods including UPI, Net Banking, Credit/Debit Cards, and popular digital wallets. You can add or manage payment methods from your Wallet page.",
  },
  {
    question: "Can I play on mobile devices?",
    answer: "Yes! GameZone is fully optimized for mobile devices. You can play all our games seamlessly on smartphones and tablets through your mobile browser.",
  },
];

export const FAQSection = () => {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="text-center pb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 mx-auto">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">Frequently Asked Questions</CardTitle>
        <CardDescription className="text-base">
          Find quick answers to common questions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:no-underline py-4 text-sm sm:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-8 p-6 bg-accent/50 rounded-lg text-center">
          <p className="text-sm sm:text-base font-medium mb-2">Still need help?</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Contact our support team via Telegram or WhatsApp for personalized assistance
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
