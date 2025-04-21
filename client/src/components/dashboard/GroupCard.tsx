import React from "react";
import { Link } from "wouter";
import { Group } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Home, Users } from "lucide-react";

type GroupCardProps = {
  group: Group & { 
    balance: number; 
    memberCount: number; 
    lastActivity: string;
  };
};

export default function GroupCard({ group }: GroupCardProps) {
  const isPositiveBalance = group.balance >= 0;
  
  const getGroupIcon = () => {
    switch (group.type) {
      case 'home':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-primary">
            <Home className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 text-secondary">
            <Users className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <a className="block border-b border-neutral-border py-3 last:border-0 hover:bg-neutral-light">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getGroupIcon()}
            <div>
              <h4 className="font-medium">{group.name}</h4>
              <div className="text-sm text-muted-foreground">{group.memberCount} members</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-medium ${isPositiveBalance ? 'text-secondary' : 'text-destructive'}`}>
              {isPositiveBalance ? '+' : ''}{formatCurrency(group.balance)}
            </div>
            <div className="text-xs text-muted-foreground">
              {group.lastActivity}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}
