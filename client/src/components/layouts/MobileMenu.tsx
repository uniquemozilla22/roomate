import React from "react";
import { Link, useLocation } from "wouter";
import { FirebaseUser } from "@/lib/firebase";
import { Home, Users, ReceiptText, Wallet, User } from "lucide-react";

type MobileMenuProps = {
  isOpen: boolean;
  user: FirebaseUser | null;
};

export default function MobileMenu({ isOpen, user }: MobileMenuProps) {
  const [location] = useLocation();

  if (!user) return null;

  return (
    <div
      className={`lg:hidden bg-white shadow-md absolute inset-x-0 top-16 z-20 transform ${
        isOpen ? "translate-y-0" : "-translate-y-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <nav className="py-2">
        <MobileLink
          href="/dashboard"
          icon={<Home className="mr-3 h-5 w-5" />}
          active={location === "/dashboard"}
        >
          Dashboard
        </MobileLink>
        
        <MobileLink
          href="/groups"
          icon={<Users className="mr-3 h-5 w-5" />}
          active={location.startsWith("/groups")}
        >
          My Groups
        </MobileLink>
        
        <MobileLink
          href="/expenses"
          icon={<ReceiptText className="mr-3 h-5 w-5" />}
          active={location.startsWith("/expenses")}
        >
          Expenses
        </MobileLink>
        
        <MobileLink
          href="/balances"
          icon={<Wallet className="mr-3 h-5 w-5" />}
          active={location.startsWith("/balances")}
        >
          Balances
        </MobileLink>
        
        <MobileLink
          href="/profile"
          icon={<User className="mr-3 h-5 w-5" />}
          active={location === "/profile"}
        >
          Profile
        </MobileLink>
      </nav>
      <div className="p-4 border-t border-neutral-border">
        <div className="flex items-center">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0D8ABC&color=fff`}
            alt="User avatar"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <div className="font-medium">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

type MobileLinkProps = {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
};

function MobileLink({ href, icon, active, children }: MobileLinkProps) {
  const baseClasses = "flex items-center px-6 py-3";
  const activeClasses = "text-primary bg-blue-50";
  const inactiveClasses = "text-muted-foreground";

  return (
    <Link href={href}>
      <a className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}
