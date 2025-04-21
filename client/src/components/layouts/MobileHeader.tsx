import React from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";

type MobileHeaderProps = {
  toggleMobileMenu: () => void;
};

export default function MobileHeader({ toggleMobileMenu }: MobileHeaderProps) {
  return (
    <header className="bg-white p-4 shadow lg:hidden flex items-center justify-between">
      <Link href="/dashboard">
        <a className="text-xl font-semibold text-primary">RoomTab</a>
      </Link>
      <button
        onClick={toggleMobileMenu}
        className="p-1 text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label="Toggle mobile menu"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
