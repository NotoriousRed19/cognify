"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NavHeader from "@/Components/molecules/NavHeader";
import Button from "@/Components/atoms/Button";
import { Brain, Menu, X } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const authRoutes = ["/login", "/register", "/forgot-password"];
  if (authRoutes.includes(pathname)) return null;

  return (
    <header className="fixed top-0 w-full z-50 flex flex-col bg-background/80 backdrop-blur-lg shadow-sm">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 h-20">
        <a href="#Hero" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="w-5 h-5" color="white" />
          </div>
          <p className="text-brand-gradient font-bold text-lg cursor-pointer">
            Cognify
          </p>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center">
          <NavHeader className="text-gray-500 hover:text-[#886dbe] duration-300 transition-colors" />
        </nav>

        <div className="hidden md:flex items-center shrink-0">
            <a href="/register" className=" cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300">
              Comenzar gratis
            </a>
        </div>

        {/* Mobile menu toggle button */}
        <button 
          className="md:hidden p-2 text-gray-600 hover:text-[#886dbe] focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 flex flex-col px-6 py-4 shadow-lg absolute top-20 left-0 w-full pb-6">
          <nav className="flex flex-col mb-6">
            <NavHeader 
              wrapperClassName="flex-col gap-4 text-lg" 
              className="block w-full py-2 text-gray-600 font-medium hover:text-[#886dbe] transition-colors" 
            />
          </nav>
          <a href="/register" className="w-full whitespace-nowrap px-6 py-3 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 text-lg">
            Comenzar gratis
          </a>
        </div>
      )}
    </header>
  );
}
