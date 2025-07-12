"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, MessageSquare, Phone } from "lucide-react"

export default function HelpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmitContactForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Message Sent",
      description: "We've received your message and will get back to you soon.",
    })

    setIsSubmitting(false)(
      // Reset form
      e.target as HTMLFormElement,
    ).reset()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about TuniMind.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is TuniMind?</AccordionTrigger>
                  <AccordionContent>
                    TuniMind is a mental health platform designed specifically for Tunisian university students. It
                    offers tools like an AI chatbot, mood tracker, relaxation exercises, emotion detection, and
                    self-care tips to help students manage their mental wellbeing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, we take your privacy seriously. All your data is encrypted and stored securely. We do not share
                    your personal information with third parties without your consent. You can review our privacy policy
                    for more details.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How does the emotion detection feature work?</AccordionTrigger>
                  <AccordionContent>
                    The emotion detection feature uses computer vision technology to analyze facial expressions through
                    your webcam. It can identify emotions like happiness, sadness, anger, and more. This feature is
                    completely optional, and any images captured are not stored permanently unless you choose to save
                    them.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I use TuniMind on my mobile device?</AccordionTrigger>
                  <AccordionContent>
                    Yes, TuniMind is designed to be responsive and works on mobile devices, tablets, and desktop
                    computers. You can access all features through your web browser without needing to install an app.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Is the AI chatbot a replacement for professional help?</AccordionTrigger>
                  <AccordionContent>
                    No, the AI chatbot is not a replacement for professional mental health services. It's designed to
                    provide support, information, and coping strategies, but it should not be used in place of therapy
                    or counseling. If you're experiencing a mental health crisis, please contact a mental health
                    professional or emergency services.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>How can I delete my account and data?</AccordionTrigger>
                  <AccordionContent>
                    You can delete your account and all associated data from the Settings page. Go to Settings &gt;
                    Privacy & Security, and click on "Delete Account". This action is permanent and cannot be undone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Have a question or need help? Reach out to our support team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <form onSubmit={handleSubmitContactForm} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input id="name" placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="Your email" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input id="subject" placeholder="How can we help?" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message
                      </label>
                      <Textarea id="message" placeholder="Your message" className="min-h-[120px]" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Other Ways to Reach Us</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Email</h4>
                        <p className="text-sm text-muted-foreground">support@tunimind.com</p>
                        <p className="text-sm text-muted-foreground">We typically respond within 24 hours.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Phone</h4>
                        <p className="text-sm text-muted-foreground">+216 71 123 456</p>
                        <p className="text-sm text-muted-foreground">Available Monday-Friday, 9am-5pm (GMT+1)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Live Chat</h4>
                        <p className="text-sm text-muted-foreground">Available on our website during business hours.</p>
                        <Button variant="link" className="p-0 h-auto text-sm">
                          Start Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Resources</CardTitle>
              <CardDescription>Find additional resources and support for your mental wellbeing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Emergency Resources</h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">National Suicide Prevention Lifeline</h4>
                      <p className="text-sm text-muted-foreground mb-2">24/7 support for people in distress</p>
                      <p className="text-sm font-medium">Phone: 1-800-273-8255</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">Crisis Text Line</h4>
                      <p className="text-sm text-muted-foreground mb-2">Text HOME to 741741 for crisis support</p>
                      <p className="text-sm font-medium">Available 24/7</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">Tunisia Emergency Services</h4>
                      <p className="text-sm text-muted-foreground mb-2">For immediate emergency assistance</p>
                      <p className="text-sm font-medium">Phone: 190 (Police) / 197 (Ambulance)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Educational Resources</h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">Mental Health Articles</h4>
                      <p className="text-sm text-muted-foreground mb-2">Learn about various mental health topics</p>
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Browse Articles
                      </Button>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">Guided Meditation Library</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Access our full library of guided meditations
                      </p>
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Explore Library
                      </Button>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium">Self-Help Workbooks</h4>
                      <p className="text-sm text-muted-foreground mb-2">Downloadable resources for self-guided help</p>
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Download Resources
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Local Support Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">University Counseling</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Free counseling services available at most Tunisian universities.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        Find Services
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Support Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Connect with peers in moderated support groups.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        Join a Group
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Professional Therapy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Find licensed therapists and mental health professionals.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        Find a Therapist
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
