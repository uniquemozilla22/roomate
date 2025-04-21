import React from "react";
import { Link, useLocation } from "wouter";
import { FirebaseUser } from "@/lib/firebase";
import { Home, Users, ReceiptText, Wallet, User } from "lucide-react";

type SidebarProps = {
  user: FirebaseUser | null;
};

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  if (!user) return null;

  return (
    <div className="hidden lg:flex lg:w-64 flex-col bg-white shadow-sm">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-primary">RoomTab</h1>
      </div>
      <div className="flex-1">
        <nav>
          <SidebarLink
            href="/dashboard"
            icon={<Home className="mr-3 h-5 w-5" />}
            active={location === "/dashboard"}
          >
            Dashboard
          </SidebarLink>
          
          <SidebarLink
            href="/groups"
            icon={<Users className="mr-3 h-5 w-5" />}
            active={location.startsWith("/groups")}
          >
            My Groups
          </SidebarLink>
          
          <SidebarLink
            href="/expenses"
            icon={<ReceiptText className="mr-3 h-5 w-5" />}
            active={location.startsWith("/expenses")}
          >
            Expenses
          </SidebarLink>
          
          <SidebarLink
            href="/balances"
            icon={<Wallet className="mr-3 h-5 w-5" />}
            active={location.startsWith("/balances")}
          >
            Balances
          </SidebarLink>
          
          <SidebarLink
            href="/profile"
            icon={<User className="mr-3 h-5 w-5" />}
            active={location === "/profile"}
          >
            Profile
          </SidebarLink>
        </nav>
      </div>
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

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
};

function SidebarLink({ href, icon, active, children }: SidebarLinkProps) {
  const baseClasses = "flex items-center px-6 py-3";
  const activeClasses = "text-primary bg-blue-50 border-l-4 border-primary";
  const inactiveClasses = "text-muted-foreground hover:bg-neutral-light border-l-4 border-transparent";

  return (
    <Link href={href}>
      <a className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}
