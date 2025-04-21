import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Group, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type AddExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  groupMembers: { [groupId: number]: User[] };
  currentUser: User;
};

// Form schema
const expenseFormSchema = z.object({
  title: z.string().min(1, "Description is required"),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  groupId: z.string().min(1, "Group is required"),
  paidBy: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "custom"]),
  splitWith: z.array(z.string()).nonempty("Select at least one person"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function AddExpenseModal({ 
  isOpen, 
  onClose,
  groups,
  groupMembers,
  currentUser
}: AddExpenseModalProps) {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: "",
      groupId: "",
      paidBy: currentUser.id,
      splitType: "equal",
      splitWith: [],
    },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const groupId = parseInt(data.groupId);
      const amount = parseFloat(data.amount);
      
      // Calculate shares based on split type
      const selectedMembers = data.splitWith;
      const numMembers = selectedMembers.length;
      const equalShare = Number((amount / numMembers).toFixed(2));
      
      // Adjust for rounding errors
      let shares = selectedMembers.map((userId, index) => ({
        userId,
        amount: index === numMembers - 1 
          ? Number((amount - equalShare * (numMembers - 1)).toFixed(2)) 
          : equalShare
      }));
      
      // Create expense
      await apiRequest("POST", "/api/expenses", {
        expense: {
          groupId,
          title: data.title,
          amount,
          paidBy: data.paidBy,
          splitType: data.splitType,
          createdBy: currentUser.id,
        },
        shares
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser.id, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser.id, 'balance'] });
      
      toast({
        title: "Expense added",
        description: "Your expense has been successfully added.",
      });
      
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle group selection to update available members
  const handleGroupChange = (value: string) => {
    const groupId = parseInt(value);
    setSelectedGroup(groupId);
    
    // Reset split with when group changes
    const availableMembers = groupMembers[groupId] || [];
    form.setValue('splitWith', availableMembers.map(member => member.id));
  };

  // Get members for the selected group
  const availableMembers = selectedGroup ? (groupMembers[selectedGroup] || []) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of your new expense.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="What was this expense for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">$</span>
                      <Input type="number" step="0.01" min="0.01" placeholder="0.00" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleGroupChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid by</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={currentUser.id}>You</SelectItem>
                      {selectedGroup && availableMembers
                        .filter(member => member.id !== currentUser.id)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="splitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Split Method</FormLabel>
                  <div className="flex border border-input rounded-md overflow-hidden">
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-3 ${field.value === 'equal' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}
                      onClick={() => field.onChange('equal')}
                    >
                      Equal
                    </button>
                    <button 
                      type="button"
                      className={`flex-1 py-2 px-3 ${field.value === 'custom' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}
                      onClick={() => field.onChange('custom')}
                      disabled // Custom split not implemented in this version
                    >
                      Custom
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="splitWith"
              render={() => (
                <FormItem>
                  <div className="border rounded p-3">
                    <FormLabel className="block mb-2">Split equally between:</FormLabel>
                    {selectedGroup ? (
                      <div className="space-y-2">
                        {availableMembers.map((member) => (
                          <div key={member.id} className="flex items-center">
                            <FormField
                              control={form.control}
                              name="splitWith"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(member.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValue, member.id]);
                                          } else {
                                            field.onChange(
                                              currentValue.filter((value) => value !== member.id)
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {member.id === currentUser.id ? "You" : member.displayName}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a group first</p>
                    )}
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Expense</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
