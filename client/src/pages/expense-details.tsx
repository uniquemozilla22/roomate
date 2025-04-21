import React from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, Trash2, Edit, Banknote } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ExpenseDetails() {
  const [, params] = useRoute("/expenses/:id");
  const [, navigate] = useLocation();
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  
  const expenseId = params?.id ? parseInt(params.id) : null;
  
  // Fetch expense details
  const {
    data: expenseData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/expenses', expenseId],
    enabled: !!expenseId && !!user,
  });
  
  // Fetch group details
  const { data: groupData } = useQuery({
    queryKey: ['/api/groups', expenseData?.expense?.groupId],
    enabled: !!expenseData?.expense?.groupId,
  });
  
  // Fetch user details
  const { data: paidByUser } = useQuery({
    queryKey: ['/api/users', expenseData?.expense?.paidBy],
    enabled: !!expenseData?.expense?.paidBy,
  });
  
  // Fetch members details for each share
  const shareUsers = {};
  if (expenseData?.shares) {
    expenseData.shares.forEach(share => {
      useQuery({
        queryKey: ['/api/users', share.userId],
        enabled: !!share.userId,
        onSuccess: (userData) => {
          shareUsers[share.userId] = userData;
        }
      });
    });
  }
  
  if (!user) return null;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !expenseData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/expenses")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Expenses
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-destructive mb-2">Expense Not Found</h2>
                <p className="text-muted-foreground">The expense you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  const { expense, shares } = expenseData;
  const group = groupData;
  const isPaidByCurrentUser = expense.paidBy === user.uid;
  const formattedDate = expense.date ? format(new Date(expense.date), "MMMM d, yyyy") : "Unknown date";
  
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/expenses/${expense.id}`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/groups', expense.groupId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.uid, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.uid, 'balance'] });
      
      toast({
        title: "Expense deleted",
        description: "The expense has been successfully deleted.",
      });
      
      navigate("/expenses");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Expenses
          </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{expense.title}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/expenses/${expense.id}/edit`)} disabled>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Expense Details</h3>
                
                <div className="text-4xl font-bold mb-6">
                  {formatCurrency(expense.amount)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Date</span>
                    <span>{formattedDate}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Group</span>
                    <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate(`/groups/${group.id}`)}>
                      {group?.name || "Unknown Group"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Paid by</span>
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={paidByUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(paidByUser?.displayName || 'User')}&background=0D8ABC&color=fff`} />
                        <AvatarFallback>{paidByUser?.displayName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span>{isPaidByCurrentUser ? "You" : paidByUser?.displayName || "Unknown User"}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Split method</span>
                    <span className="capitalize">{expense.splitType}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Split Details</h3>
                
                <div className="space-y-4">
                  {shares.map((share) => {
                    const shareUser = shareUsers[share.userId];
                    const isCurrentUser = share.userId === user.uid;
                    
                    return (
                      <div key={share.id} className="flex justify-between items-center p-3 rounded-lg border">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={shareUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(shareUser?.displayName || 'User')}&background=0D8ABC&color=fff`} />
                            <AvatarFallback>{shareUser?.displayName?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <span>{isCurrentUser ? "You" : shareUser?.displayName || "Unknown User"}</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(share.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {isPaidByCurrentUser && (
                  <div className="mt-6">
                    <Button className="w-full" disabled>
                      <Banknote className="mr-2 h-4 w-4" />
                      Request Payment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense and remove it from all calculations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
