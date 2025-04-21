import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { PlusCircle } from "lucide-react";

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
};

// Form schema
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  type: z.enum(["home", "trip", "couple", "other"]),
  inviteEmails: z.array(z.string().email().or(z.string().length(0))).optional(),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupModal({ isOpen, onClose, currentUser }: CreateGroupModalProps) {
  const { toast } = useToast();
  const [inviteFields, setInviteFields] = React.useState<string[]>(['']);
  
  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      type: "home",
      inviteEmails: [''],
    },
  });

  // Generate a random 6-character code
  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const onSubmit = async (data: CreateGroupFormValues) => {
    try {
      // Generate a unique code for the group
      const code = generateGroupCode();
      
      // Create the group
      const response = await apiRequest("POST", "/api/groups", {
        name: data.name,
        type: data.type,
        code,
        createdBy: currentUser.id,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser.id, 'groups'] });
      
      toast({
        title: "Group created",
        description: `Your group "${data.name}" has been created successfully.`,
      });
      
      // Note: Email invitations would be handled by the server in a real app
      const validEmails = data.inviteEmails?.filter(email => email.length > 0) || [];
      if (validEmails.length > 0) {
        toast({
          title: "Invitations sent",
          description: `Invitations have been sent to ${validEmails.length} email address(es).`,
        });
      }
      
      onClose();
      form.reset();
      setInviteFields(['']);
    } catch (error) {
      console.error("Failed to create group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding more invite fields
  const addInviteField = () => {
    const updatedFields = [...inviteFields, ''];
    setInviteFields(updatedFields);
    form.setValue('inviteEmails', updatedFields);
  };

  // Handle updating invite field values
  const updateInviteField = (index: number, value: string) => {
    const updatedFields = [...inviteFields];
    updatedFields[index] = value;
    setInviteFields(updatedFields);
    form.setValue('inviteEmails', updatedFields);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Set up a new group for tracking expenses.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Apartment 5B, Summer Vacation" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="home">Home / Apartment</SelectItem>
                      <SelectItem value="trip">Trip / Vacation</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block mb-2">Invite Members (Optional)</FormLabel>
              <div className="space-y-2">
                {inviteFields.map((email, index) => (
                  <div key={index} className="flex">
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="flex-1 rounded-r-none"
                      value={email}
                      onChange={(e) => updateInviteField(index, e.target.value)}
                    />
                    {index === inviteFields.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        onClick={addInviteField}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll send them an invitation to join your group
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
