import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-fg mt-auto border-t border-border-strong">
      {/* Plaid Band */}
      <div className="h-2 w-full pattern-plaid" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: School Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src="/brand/dorice-logo-badge.png"
                  alt="Dorice Smart Academy crest"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div>
                <h4 className="text-fluid-lg font-black tracking-tight text-primary-fg">
                  DORICE SMART ACADEMY
                </h4>
                <p className="text-fluid-xs font-semibold text-accent-soft tracking-wider uppercase">
                  Inspire, Achieve, Flourish
                </p>
              </div>
            </div>
            <p className="text-fluid-sm opacity-90 max-w-md leading-relaxed">
              Providing holistic, high-quality Competency Based Curriculum (CBC) education for Pre-Primary,
              Primary, and Junior School learners in Kipkaren River, Kenya.
            </p>
            <div className="flex items-center gap-2 pt-1 text-fluid-xs text-accent-soft font-semibold">
              <Shield className="w-4 h-4 text-accent" />
              <span>Registered under Kenya Ministry of Education</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h5 className="text-fluid-base font-black text-primary-fg uppercase tracking-wider">
              Quick Links
            </h5>
            <ul className="space-y-2 text-fluid-sm">
              <li>
                <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="opacity-80 hover:opacity-100 transition-opacity">
                  About Us & Staff
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="opacity-80 hover:opacity-100 transition-opacity">
                  School Gallery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="opacity-80 hover:opacity-100 transition-opacity">
                  Contact & Directions
                </Link>
              </li>
              <li>
                <Link href="/login" className="opacity-80 hover:opacity-100 transition-opacity">
                  Parent Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h5 className="text-fluid-base font-black text-primary-fg uppercase tracking-wider">
              School Office
            </h5>
            <div className="space-y-2.5 text-fluid-sm opacity-90">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-1" />
                <span>P.O. Box 204, Kipkaren River, Kenya</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>Administration Office</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>info@doricesmartacademy.sc.ke</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-hover flex flex-col sm:flex-row items-center justify-between gap-4 text-fluid-xs opacity-80">
          <p>© {new Date().getFullYear()} Dorice Smart Academy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">
              Privacy Notice (DPA 2019)
            </Link>
            <Link href="/design/tokens" className="hover:underline text-accent-soft">
              Design Tokens Review
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
