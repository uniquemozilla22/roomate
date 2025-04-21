import React from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import GroupCard from "./GroupCard";
import { Group } from "@shared/schema";

type GroupsListProps = {
  groups: Array<Group & { balance: number; memberCount: number; lastActivity: string; }>;
  onCreateGroup: () => void;
};

export default function GroupsList({ groups, onCreateGroup }: GroupsListProps) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Groups</h3>
        <button 
          onClick={onCreateGroup}
          className="text-primary hover:text-primary/80"
          aria-label="Create new group"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>You haven't joined any groups yet.</p>
          <button 
            onClick={onCreateGroup} 
            className="mt-2 text-primary hover:underline"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </Card>
  );
}
