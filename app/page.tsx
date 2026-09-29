import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, BookOpen, CreditCard, Award, Users, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';

export default function HomePage() {
  const quickFacts = [
    {
      icon: BookOpen,
      title: 'CBC Curriculum',
      description: 'Pre-Primary, Lower Primary, Upper Primary & Junior School (Grade 7-9).',
    },
    {
      icon: CreditCard,
      title: 'M-PESA Integrated',
      description: 'Instant fee payments, automated SMS receipts, and zero reconciliation delay.',
    },
    {
      icon: Award,
      title: 'Holistic Growth',
      description: 'Values-driven education fostering leadership, innovation, and integrity.',
    },
    {
      icon: ShieldCheck,
      title: 'Safe & Secure',
      description: 'Strict Kenya Data Protection Act 2019 compliance for all learner records.',
    },
  ];

  const highlights = [
    'Comprehensive Continuous School-Based Assessments (SBA) and Term Evaluations',
    'Real-time guardian fee statement tracking with immediate M-PESA Daraja receipts',
    'Dedicated, qualified teaching faculty guiding each child to their fullest potential',
    'Co-curricular activities: athletics, drama, music, scouting, and agriculture',
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 lg:py-20 bg-bg border-b border-border">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headlines & CTA (Navy 30% Structure + Single 10% Accent CTA) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary font-bold text-fluid-xs border border-border">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Admissions & 2026 Term Portal Open</span>
                </div>

                <h1 className="text-fluid-2xl font-black text-primary tracking-tight leading-[1.15]">
                  Inspire. Achieve. <br />
                  <span className="text-primary underline decoration-accent decoration-4 underline-offset-8">
                    Flourish.
                  </span>
                </h1>

                <p className="text-fluid-lg text-text max-w-xl leading-relaxed">
                  Welcome to <strong>Dorice Smart Academy</strong> in Kipkaren River, Kenya. Empowering learners through 
                  exceptional Competency Based Curriculum (CBC) education, character formation, and transparent school management.
                </p>

                {/* 60-30-10 Rule: Exactly ONE Accent Button for Primary Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link href="/login">
                    <Button variant="accent" size="lg" className="w-full sm:w-auto gap-2.5">
                      <span>Access School Portal</span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>

                  <Link href="/about">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Learn About Us
                    </Button>
                  </Link>
                </div>

                {/* Feature Bullet Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-fluid-sm text-text">
                    <CheckCircle2 className="w-4 h-4 text-success-solid shrink-0" />
                    <span>Instant M-PESA fee statements</span>
                  </div>
                  <div className="flex items-center gap-2 text-fluid-sm text-text">
                    <CheckCircle2 className="w-4 h-4 text-success-solid shrink-0" />
                    <span>Direct CBC term report cards</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Photo with Arch Mask Motif */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-[480px]">
                  {/* Decorative background shadow */}
                  <div className="absolute inset-0 translate-x-3 translate-y-3 bg-primary-soft rounded-t-[140px] rounded-b-[20px] -z-10 border border-border" />
                  
                  {/* Image container with Arch top */}
                  <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden rounded-t-[140px] rounded-b-[20px] border-4 border-surface shadow-xl bg-surface">
                    <Image
                      src="/photos/preprimary-children-red-sweaters.jpg"
                      alt="Pre-primary school learners in bright red uniform sweaters enthusiastically raising hands during an outdoor morning assembly"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Badge Overlay */}
                  <div className="absolute -bottom-5 -left-4 sm:left-4 bg-surface p-4 rounded-[12px] shadow-lg border border-border flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-fluid-xs text-text-muted font-bold uppercase tracking-wider">Accreditation</div>
                      <div className="text-fluid-sm font-black text-primary">Ministry of Education Approved</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Quick Facts Section */}
        <section className="py-16 bg-surface">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-fluid-xl font-black text-primary tracking-tight">
                Designed for Learners, Families & Educators
              </h2>
              <p className="text-fluid-base text-text-muted mt-2">
                A streamlined, modern academy providing quality education and reliable digital access.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <Card key={fact.title} className="hover:-translate-y-1 transition-transform">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center mb-2">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{fact.title}</CardTitle>
                      <CardDescription>{fact.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Learners & Curriculum Sections */}
        <section className="py-16 bg-bg border-t border-border">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* Primary Pupils */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 relative h-[340px] sm:h-[400px] rounded-[16px] overflow-hidden border-2 border-border shadow-md">
                <Image
                  src="/photos/primary-pupils-navy-uniforms.jpg"
                  alt="Primary school pupils dressed in navy school uniforms waving cheerfully in front of the school administration building"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              </div>

              <div className="lg:col-span-6 space-y-5">
                <span className="text-fluid-xs font-black text-primary uppercase tracking-wider">
                  Foundational Excellence
                </span>
                <h3 className="text-fluid-xl font-black text-primary tracking-tight">
                  Lower & Upper Primary Education
                </h3>
                <p className="text-fluid-base text-text leading-relaxed">
                  Our primary learners engage in activity-based learning under the Competency Based Curriculum (CBC), 
                  building literacy, numeracy, critical thinking, and social values in a supportive, vibrant environment.
                </p>
                <div className="space-y-2.5 pt-2">
                  {highlights.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-fluid-sm text-text">
                      <CheckCircle2 className="w-5 h-5 text-success-solid shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Junior School */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1 space-y-5">
                <span className="text-fluid-xs font-black text-primary uppercase tracking-wider">
                  Nurturing Tomorrow's Leaders
                </span>
                <h3 className="text-fluid-xl font-black text-primary tracking-tight">
                  Junior School (Grade 7 – 9)
                </h3>
                <p className="text-fluid-base text-text leading-relaxed">
                  Preparing adolescent learners for future pathways through integrated science, pre-technical studies, 
                  business studies, and digital skills with continuous teacher mentorship and values assessment.
                </p>

                {/* Sample CBC Indicators Preview */}
                <div className="p-4 rounded-[12px] bg-surface border border-border space-y-2">
                  <div className="text-fluid-xs font-bold text-text-muted">CBC Performance Rubric Sample:</div>
                  <div className="flex flex-wrap gap-2">
                    <CbcStars level="EE" size="sm" />
                    <CbcStars level="ME" size="sm" />
                    <CbcStars level="AE" size="sm" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 order-1 lg:order-2 relative h-[340px] sm:h-[400px] rounded-[16px] overflow-hidden border-2 border-border shadow-md">
                <Image
                  src="/photos/junior-pupils-blue-plaid-uniforms.jpg"
                  alt="Junior school pupils posing smartly in distinctive blue-plaid school uniforms in the school courtyard"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Leadership Welcome & School Message */}
        <section className="py-16 bg-surface border-t border-border">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                <div className="md:col-span-5 relative h-[320px] md:h-full min-h-[300px] bg-bg">
                  <Image
                    src="/photos/leadership-portrait-at-desk.jpg"
                    alt="School leadership seated at an administrative desk with Kenyan flag and official documents"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover object-top"
                  />
                </div>

                <div className="md:col-span-7 p-6 sm:p-10 space-y-4">
                  <Badge variant="credit" label="Leadership Welcome" />
                  <h3 className="text-fluid-lg font-black text-primary">
                    Welcome to Our School Community
                  </h3>
                  <blockquote className="text-fluid-sm text-text italic leading-relaxed border-l-4 border-primary pl-4">
                    "At Dorice Smart Academy, our mission is to create a nurturing haven where every child is inspired to discover their God-given talents, achieve academic excellence, and flourish in character."
                  </blockquote>
                  <div className="pt-2">
                    <div className="font-black text-fluid-sm text-primary">D. A. Chapia</div>
                    <div className="text-fluid-xs text-text-muted">School Administration</div>
                    <div className="text-fluid-xs text-text-muted italic mt-1 text-[11px]">
                      * Note: Placeholder portrait; title and formal bio to be finalized with the school administration.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-12 bg-primary text-primary-fg pattern-plaid">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-fluid-xl font-black text-primary-fg tracking-tight">
              Ready to view results or manage term school fees?
            </h2>
            <p className="text-fluid-base opacity-90 max-w-xl mx-auto">
              Our mobile-friendly portal lets you review CBC assessment performance and pay school fees via M-PESA in seconds.
            </p>
            <div>
              <Link href="/login">
                <Button variant="accent" size="lg" className="gap-2.5">
                  <span>Sign In to School Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
