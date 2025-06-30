"use client";
import Link from "next/link";
import { Home, Search, Upload, User } from "lucide-react";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/admin/dashboard", label: "بحث", icon: Search },
  { href: "/admin/upload", label: "رفع ملف", icon: Upload },
  { href: "/account/settings", label: "حسابي", icon: User },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10002] bg-white/95 border-t border-theme flex justify-around items-center h-16 md:hidden shadow-xl">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center justify-center gap-1 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <Icon className="h-6 w-6" />
          <span className="gulf-text-xs font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
