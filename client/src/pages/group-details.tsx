import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Copy, Trash2, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GroupMember from "@/components/groups/GroupMember";
import ExpensesList from "@/components/dashboard/ExpensesList";
import AddExpenseModal from "@/components/modals/AddExpenseModal";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function GroupDetails() {
  const [, params] = useRoute("/groups/:id");
  const [, navigate] = useLocation();
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  
  const groupId = params?.id ? parseInt(params.id) : null;
  
  // Fetch group details
  const {
    data: group,
    isLoading: groupLoading,
    error: groupError
  } = useQuery({
    queryKey: ['/api/groups', groupId],
    enabled: !!groupId && !!user,
  });
  
  // Fetch group members
  const {
    data: membersData,
    isLoading: membersLoading
  } = useQuery({
    queryKey: ['/api/groups', groupId, 'members'],
    enabled: !!groupId && !!user,
  });
  
  // Fetch group expenses
  const {
    data: expensesData,
    isLoading: expensesLoading
  } = useQuery({
    queryKey: ['/api/groups', groupId, 'expenses'],
    enabled: !!groupId && !!user,
  });
  
  // Fetch balances between users
  const {
    data: balances,
    isLoading: balancesLoading
  } = useQuery({
    queryKey: ['/api/groups', groupId, 'balances'],
    enabled: !!groupId && !!user,
  });
  
  // Get current user's balance in this group
  const {
    data: userBalance,
    isLoading: userBalanceLoading
  } = useQuery({
    queryKey: ['/api/users', user?.uid, 'groups', groupId, 'balance'],
    enabled: !!groupId && !!user?.uid,
  });
  
  if (!user) return null;
  
  if (groupLoading || membersLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (groupError || !group) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-destructive mb-2">Group Not Found</h2>
                <p className="text-muted-foreground">The group you're looking for doesn't exist or you don't have permission to view it.</p>
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
  
  const members = membersData || [];
  
  // Process expenses for display
  const processedExpenses = expensesData ? expensesData.map(expense => {
    return {
      ...expense,
      group: { id: group.id, name: group.name },
      paidByUser: { 
        id: expense.paidBy, 
        displayName: members.find(m => m.user?.id === expense.paidBy)?.user?.displayName || "Unknown User" 
      },
      userShare: expense.shares?.find(share => share.userId === user.uid)?.amount || 0,
      date: new Date(expense.date)
    };
  }) : [];
  
  // Check if current user is the creator of the group
  const isCreator = group.createdBy === user.uid;
  
  const copyGroupCode = () => {
    navigator.clipboard.writeText(group.code);
    toast({
      title: "Group code copied",
      description: "The code has been copied to your clipboard.",
    });
  };
  
  const handleDeleteGroup = async () => {
    // Note: This functionality would be implemented in a real app
    toast({
      title: "Not implemented",
      description: "Group deletion functionality is not implemented in this version.",
    });
    setDeleteDialogOpen(false);
  };
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">{group.name}</h2>
            <div className="flex items-center mt-1 text-muted-foreground">
              <span className="capitalize mr-2">{group.type}</span>
              <span className="text-sm">•</span>
              <span className="mx-2">{members.length} members</span>
              <span className="text-sm">•</span>
              <span className="ml-2">Code: {group.code}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-1 h-6 w-6" 
                onClick={copyGroupCode}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-2">
            {isCreator && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            )}
            <Button 
              size="sm"
              onClick={() => setAddExpenseModalOpen(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
        
        {/* Group Balance Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-muted-foreground font-medium">Your Balance</h3>
                <div className={`text-3xl font-bold ${(userBalance?.balance || 0) >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {userBalanceLoading ? (
                    <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
                  ) : (
                    `${(userBalance?.balance || 0) >= 0 ? '+' : ''}${formatCurrency(userBalance?.balance || 0)}`
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(userBalance?.balance || 0) > 0 
                    ? "You are owed money" 
                    : (userBalance?.balance || 0) < 0 
                      ? "You owe money" 
                      : "You're all settled up"}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Button variant="outline" disabled>
                  Settle Up
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full md:w-auto mb-4">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="mt-0">
            {expensesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ExpensesList 
                expenses={processedExpenses}
                title="Group Expenses"
                showViewAll={false}
                currentUserId={user.uid}
              />
            )}
          </TabsContent>
          
          <TabsContent value="members" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <GroupMember 
                      key={member.id} 
                      member={member.user} 
                      isCurrentUser={member.user?.id === user.uid}
                      isCreator={member.user?.id === group.createdBy}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="balances" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Current Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : balances && balances.length > 0 ? (
                  <div className="space-y-4">
                    {balances.map((balance, index) => {
                      const fromUser = members.find(m => m.user?.id === balance.fromUserId)?.user;
                      const toUser = members.find(m => m.user?.id === balance.toUserId)?.user;
                      
                      const fromIsCurrentUser = fromUser?.id === user.uid;
                      const toIsCurrentUser = toUser?.id === user.uid;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">
                              {fromIsCurrentUser ? "You" : fromUser?.displayName || "Unknown"}
                            </span>
                            <span className="mx-2">owes</span>
                            <span className="font-medium">
                              {toIsCurrentUser ? "you" : toUser?.displayName || "Unknown"}
                            </span>
                          </div>
                          <div className="font-medium text-destructive">
                            {formatCurrency(balance.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4 text-muted" />
                    <h3 className="text-lg font-medium mb-1">All settled up!</h3>
                    <p>There are no outstanding balances in this group.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Expense Modal */}
      {addExpenseModalOpen && (
        <AddExpenseModal
          isOpen={addExpenseModalOpen}
          onClose={() => setAddExpenseModalOpen(false)}
          groups={[group]}
          groupMembers={{ [group.id]: members.map(m => m.user) }}
          currentUser={{ 
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split('@')[0] || "User",
            photoURL: user.photoURL || null,
            createdAt: new Date()
          }}
        />
      )}
      
      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this group and all its expenses.
              All members will lose access to the group data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteGroup}>
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
