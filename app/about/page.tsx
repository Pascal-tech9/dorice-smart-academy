import * as React from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Heart, Target, Compass, Award } from 'lucide-react';

export const metadata = {
  title: 'About Us | Dorice Smart Academy',
  description: 'Learn about the mission, values, and teaching staff of Dorice Smart Academy in Kipkaren River, Kenya.',
};

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Excellence (Achieve)',
      desc: 'Pursuing mastery in both academic understanding and practical competence across the CBC learning areas.',
    },
    {
      icon: Heart,
      title: 'Integrity (Flourish)',
      desc: 'Cultivating honesty, mutual respect, and moral character in every learner through daily community life.',
    },
    {
      icon: Compass,
      title: 'Purpose (Inspire)',
      desc: 'Igniting curiosity, self-discovery, and leadership so our learners become responsible contributors to society.',
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-primary text-primary-fg py-12 pattern-plaid border-b border-border">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-fluid-xs font-black uppercase tracking-widest text-accent-soft">
              About Our School
            </span>
            <h1 className="text-fluid-2xl font-black text-primary-fg tracking-tight">
              Inspire, Achieve, Flourish
            </h1>
            <p className="text-fluid-base opacity-90 max-w-2xl mx-auto">
              Rooted in Kipkaren River, Kenya, Dorice Smart Academy is committed to providing transformative
              foundational and junior school education.
            </p>
          </div>
        </section>

        {/* School Overview */}
        <section className="py-16 bg-bg">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-6">
              <h2 className="text-fluid-xl font-black text-primary">
                Our Mission & Vision
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent className="text-fluid-sm text-text leading-relaxed">
                    To deliver an inclusive, child-centered Competency Based Curriculum that nurtures the unique potential
                    of every child, cultivating academic excellence, creative thinking, and upright moral character.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-2">
                      <Compass className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent className="text-fluid-sm text-text leading-relaxed">
                    To be a leading center of educational excellence and character development in Kenya, inspiring learners to
                    flourish into ethical, self-reliant global citizens.
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Core Values */}
            <div className="space-y-6 pt-6">
              <h2 className="text-fluid-xl font-black text-primary">
                Core Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {values.map((val) => {
                  const Icon = val.icon;
                  return (
                    <Card key={val.title}>
                      <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-1">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-fluid-base">{val.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-fluid-sm text-text-muted leading-relaxed">
                        {val.desc}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Teaching Staff Section */}
            <div className="space-y-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-fluid-xs font-black text-primary uppercase tracking-wider">
                    Our Dedicated Faculty
                  </span>
                  <h2 className="text-fluid-xl font-black text-primary tracking-tight">
                    Qualified & Caring Educators
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-fluid-xs font-bold border border-border">
                  <Award className="w-4 h-4 text-primary" />
                  <span>CBC Trained Teachers</span>
                </div>
              </div>

              <div className="relative h-[380px] sm:h-[480px] w-full rounded-[16px] overflow-hidden border-2 border-border shadow-lg">
                <Image
                  src="/photos/teaching-staff-group.jpg"
                  alt="Dorice Smart Academy teaching staff faculty members gathered in front of the school administration building"
                  fill
                  sizes="(max-width: 1080px) 100vw, 1080px"
                  className="object-cover object-center"
                />
              </div>

              <p className="text-fluid-sm text-text-muted leading-relaxed text-center max-w-2xl mx-auto">
                Our team of dedicated teachers work collaboratively with parents and guardians to guide every learner
                through each competency stage, values milestone, and continuous school-based assessment.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
