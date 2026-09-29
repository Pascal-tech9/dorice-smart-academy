'use client';

import * as React from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-primary text-primary-fg py-12 pattern-plaid border-b border-border">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-fluid-xs font-black uppercase tracking-widest text-accent-soft">
              Get in Touch
            </span>
            <h1 className="text-fluid-2xl font-black text-primary-fg tracking-tight">
              Contact & School Office
            </h1>
            <p className="text-fluid-base opacity-90 max-w-2xl mx-auto">
              We welcome parents, prospective guardians, and community members to visit or contact our school office.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-bg">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Office Details */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h2 className="text-fluid-xl font-black text-primary">
                    School Office
                  </h2>
                  <p className="text-fluid-sm text-text-muted mt-1">
                    Administration Block, Dorice Smart Academy
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-4 rounded-[12px] bg-surface border border-border shadow-sm">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-fluid-sm text-text">Postal & Physical Location</div>
                      <div className="text-fluid-sm text-text-muted">P.O. Box 204, Kipkaren River, Kenya</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-[12px] bg-surface border border-border shadow-sm">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-fluid-sm text-text">Office Operating Hours</div>
                      <div className="text-fluid-sm text-text-muted">Monday – Friday: 7:30 AM – 5:00 PM</div>
                      <div className="text-fluid-xs text-text-muted">Saturday: 8:00 AM – 12:00 PM (By appointment)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-[12px] bg-surface border border-border shadow-sm">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-fluid-sm text-text">Telephone & Enquiries</div>
                      <div className="text-fluid-sm text-text-muted">+254 700 000 000 (Office Desk)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-[12px] bg-surface border border-border shadow-sm">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-fluid-sm text-text">Email Address</div>
                      <div className="text-fluid-sm text-text-muted">info@doricesmartacademy.sc.ke</div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Direct Action */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/254700000000?text=Hello%20Dorice%20Smart%20Academy%20Office"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full"
                  >
                    <Button variant="outline" size="md" className="w-full gap-2 border-success-solid text-success-fg hover:bg-success-soft">
                      <MessageSquare className="w-4 h-4 text-success-solid" />
                      <span>Chat with Admissions on WhatsApp</span>
                    </Button>
                  </a>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-7">
                <Card>
                  <CardHeader>
                    <CardTitle>Send an Inquiry Message</CardTitle>
                    <CardDescription>
                      Have a question regarding admissions, school fees, or academic programs? Send a note to our team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="p-8 text-center space-y-4 bg-success-soft rounded-[10px] border border-success-border">
                        <CheckCircle2 className="w-12 h-12 text-success-solid mx-auto" />
                        <h4 className="text-fluid-base font-black text-success-fg">
                          Inquiry Received
                        </h4>
                        <p className="text-fluid-sm text-success-fg max-w-sm mx-auto">
                          Thank you for reaching out to Dorice Smart Academy. A member of our administration office will contact you promptly.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSubmitted(false);
                            setFullName('');
                            setPhone('');
                            setMessage('');
                          }}
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="fullName" className="block text-fluid-xs font-bold text-text mb-1">
                            Your Full Name <span className="text-danger-solid">*</span>
                          </label>
                          <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Mary Wanjiku"
                            className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-fluid-xs font-bold text-text mb-1">
                            M-PESA / Mobile Phone Number <span className="text-danger-solid">*</span>
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 0712 345 678"
                            className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-focus-ring"
                          />
                        </div>

                        <div>
                          <label htmlFor="message" className="block text-fluid-xs font-bold text-text mb-1">
                            Message or Inquiry <span className="text-danger-solid">*</span>
                          </label>
                          <textarea
                            id="message"
                            rows={4}
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask about admissions, CBC classes, or fee structures..."
                            className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                          />
                        </div>

                        <div className="pt-2">
                          <Button variant="accent" size="lg" type="submit" className="w-full sm:w-auto gap-2">
                            <Send className="w-4 h-4" />
                            <span>Send Inquiry</span>
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
