import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

type JoinGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
};

// Form schema
const joinGroupSchema = z.object({
  code: z.string().length(6, "Group code must be 6 characters"),
});

type JoinGroupFormValues = z.infer<typeof joinGroupSchema>;

export default function JoinGroupModal({ isOpen, onClose, currentUser }: JoinGroupModalProps) {
  const { toast } = useToast();
  
  const form = useForm<JoinGroupFormValues>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: JoinGroupFormValues) => {
    try {
      // First get the group by code
      const response = await fetch(`/api/groups/code/${data.code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return form.setError("code", { message: "Invalid group code" });
        }
        throw new Error("Failed to find group");
      }
      
      const group = await response.json();
      
      // Join the group
      await apiRequest("POST", "/api/group-members", {
        groupId: group.id,
        userId: currentUser.id,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser.id, 'groups'] });
      
      toast({
        title: "Group joined",
        description: `You have successfully joined ${group.name}.`,
      });
      
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to join group:", error);
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Existing Group</DialogTitle>
          <DialogDescription>
            Enter the 6-digit group code to join.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter the 6-digit group code" 
                      maxLength={6}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask your roommate for the code from their app
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Join Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
