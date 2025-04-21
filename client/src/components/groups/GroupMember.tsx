import React from "react";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

type GroupMemberProps = {
  member: User;
  isCurrentUser: boolean;
  isCreator: boolean;
};

export default function GroupMember({ member, isCurrentUser, isCreator }: GroupMemberProps) {
  if (!member) return null;
  
  return (
    <div className="flex justify-between items-center p-3 border rounded-lg">
      <div className="flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage 
            src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=0D8ABC&color=fff`} 
            alt={member.displayName} 
          />
          <AvatarFallback>{member.displayName[0]}</AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center">
            <span className="font-medium">
              {isCurrentUser ? "You" : member.displayName}
            </span>
            {isCreator && (
              <div className="ml-2 flex items-center text-amber-500" title="Group Creator">
                <Crown className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{member.email}</div>
        </div>
      </div>
      
      {isCreator && !isCurrentUser && (
        <button 
          className="text-sm text-muted-foreground hover:text-destructive"
          disabled
        >
          Remove
        </button>
      )}
    </div>
  );
}
