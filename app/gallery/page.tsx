import * as React from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'School Gallery | Dorice Smart Academy',
  description: 'Moments of learning, fellowship, and achievement at Dorice Smart Academy in Kipkaren River, Kenya.',
};

export default function GalleryPage() {
  const photos = [
    {
      src: '/photos/preprimary-children-red-sweaters.jpg',
      title: 'Pre-Primary Learners Morning Assembly',
      category: 'Early Years (PP1 & PP2)',
      alt: 'Pre-primary school learners in bright red uniform sweaters raising their hands enthusiastically during an outdoor school gathering',
    },
    {
      src: '/photos/primary-pupils-navy-uniforms.jpg',
      title: 'Primary School Pupils',
      category: 'Lower & Upper Primary',
      alt: 'Primary school pupils in navy blue uniforms cheerfully waving together in the school compound',
    },
    {
      src: '/photos/junior-pupils-blue-plaid-uniforms.jpg',
      title: 'Junior School Learners',
      category: 'Junior School (Grade 7-9)',
      alt: 'Junior school students proudly posing in blue-plaid school uniforms in the school courtyard',
    },
    {
      src: '/photos/teaching-staff-group.jpg',
      title: 'Academy Teaching & Administration Faculty',
      category: 'Our Staff',
      alt: 'Dorice Smart Academy teachers and staff assembled in front of the school administration office',
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
              Life at Dorice Smart Academy
            </span>
            <h1 className="text-fluid-2xl font-black text-primary-fg tracking-tight">
              School Gallery
            </h1>
            <p className="text-fluid-base opacity-90 max-w-2xl mx-auto">
              A glimpse into the daily joy, growth, and teamwork of our learners and educators in Kipkaren River.
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-16 bg-bg">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {photos.map((photo, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-[280px] sm:h-[360px] w-full bg-surface-muted">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="text-fluid-xs font-bold text-primary uppercase tracking-wider mb-1">
                      {photo.category}
                    </div>
                    <h3 className="text-fluid-base font-black text-text">
                      {photo.title}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center text-fluid-xs text-text-muted">
              <p>
                * In accordance with the Kenya Data Protection Act 2019, all school photographs are approved for institutional
                representation and are maintained under strict student privacy standards.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
