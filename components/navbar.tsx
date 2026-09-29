'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-nav-bg text-nav-fg shadow-md">
      {/* Plaid subtle accent bar on top */}
      <div className="h-1.5 w-full pattern-plaid" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Name */}
          <Link href="/" className="flex items-center gap-3.5 group focus:outline-none">
            <div className="relative w-12 h-12 shrink-0 drop-shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/brand/dorice-logo-badge.png"
                alt="Dorice Smart Academy crest badge"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-fluid-base tracking-tight text-nav-fg group-hover:opacity-95">
                DORICE SMART ACADEMY
              </span>
              <span className="text-fluid-xs font-semibold text-accent-soft tracking-wider uppercase opacity-90">
                Inspire, Achieve, Flourish
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-fluid-sm font-bold text-nav-fg opacity-85 hover:opacity-100 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Button: The 10% Accent */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="accent" size="sm" className="gap-2">
                <span>Parent Login</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-nav-fg hover:bg-primary-hover focus:outline-none"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-border-strong bg-primary px-4 pt-4 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-fluid-base font-bold text-nav-fg hover:bg-primary-hover transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full">
              <Button variant="accent" size="md" className="w-full gap-2">
                <span>Parent Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
