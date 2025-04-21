import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import SummaryCard from "@/components/dashboard/SummaryCard";
import GroupsList from "@/components/dashboard/GroupsList";
import ExpensesList from "@/components/dashboard/ExpensesList";
import AddExpenseModal from "@/components/modals/AddExpenseModal";
import JoinGroupModal from "@/components/modals/JoinGroupModal";
import CreateGroupModal from "@/components/modals/CreateGroupModal";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { formatCurrency } from "@/lib/utils";
import { format, subDays } from "date-fns";

export default function Dashboard() {
  const { user } = useFirebaseAuth();
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  
  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users', user?.uid],
    enabled: !!user?.uid,
  });

  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['/api/users', user?.uid, 'balance'],
    enabled: !!user?.uid,
  });

  // Fetch user groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/users', user?.uid, 'groups'],
    enabled: !!user?.uid,
  });

  // Fetch recent expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/users', user?.uid, 'expenses'],
    enabled: !!user?.uid,
  });

  // Fetch group members for each group (needed for expense modal)
  const groupMembers = {};
  if (groups) {
    groups.forEach(group => {
      useQuery({
        queryKey: ['/api/groups', group.id, 'members'],
        enabled: !!group,
        onSuccess: (data) => {
          groupMembers[group.id] = data.map(member => member.user);
        }
      });
    });
  }

  if (!user) return null;

  // Process data for display
  const processedGroups = groups ? groups.map(group => ({
    ...group,
    balance: Math.random() * 200 - 50, // In a real app, this would come from the API
    memberCount: Math.floor(Math.random() * 4) + 2, // In a real app, this would come from the API
    lastActivity: `Updated ${Math.floor(Math.random() * 7) + 1}d ago` // In a real app, this would come from the API
  })) : [];

  // Process recent expenses for display
  const processedExpenses = expenses ? expenses.slice(0, 4).map(expense => {
    const randomDate = subDays(new Date(), Math.floor(Math.random() * 30));
    return {
      ...expense,
      group: { 
        id: expense.groupId, 
        name: processedGroups.find(g => g.id === expense.groupId)?.name || "Unknown Group" 
      },
      paidByUser: { 
        id: expense.paidBy, 
        displayName: expense.paidBy === user.uid ? "You" : "Other User" 
      },
      userShare: Math.random() * Number(expense.amount),
      date: randomDate
    };
  }) : [];

  // Calculate summary data
  const totalBalance = balanceData?.balance || 0;
  const monthlyExpenses = expenses ? expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) : 0;
  const activeGroups = groups?.length || 0;
  const totalMembers = activeGroups * 3; // In a real app, this would be calculated correctly

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-semibold mb-2 md:mb-0">Dashboard</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setJoinGroupModalOpen(true)}
              className="text-primary border-primary"
            >
              <Users className="mr-1 h-4 w-4" />
              Join Group
            </Button>
            <Button onClick={() => setAddExpenseModalOpen(true)}>
              <PlusCircle className="mr-1 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Total Balance"
            value={totalBalance >= 0 ? `+${formatCurrency(totalBalance)}` : formatCurrency(totalBalance)}
            description={totalBalance >= 0 ? "You are owed" : "You owe"}
            className={totalBalance >= 0 ? "text-secondary" : "text-destructive"}
          />
          
          <SummaryCard
            title="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            description="This month"
          />
          
          <SummaryCard
            title="Active Groups"
            value={activeGroups}
            description={`${totalMembers} total members`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* My Groups Section */}
          <div className="lg:col-span-2">
            <GroupsList 
              groups={processedGroups} 
              onCreateGroup={() => setCreateGroupModalOpen(true)} 
            />
          </div>

          {/* Recent Expenses Section */}
          <div className="lg:col-span-3">
            <ExpensesList 
              expenses={processedExpenses} 
              currentUserId={user.uid}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {addExpenseModalOpen && (
        <AddExpenseModal
          isOpen={addExpenseModalOpen}
          onClose={() => setAddExpenseModalOpen(false)}
          groups={groups || []}
          groupMembers={groupMembers}
          currentUser={{ 
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split('@')[0] || "User",
            photoURL: user.photoURL || null,
            createdAt: new Date()
          }}
        />
      )}
      
      {joinGroupModalOpen && (
        <JoinGroupModal
          isOpen={joinGroupModalOpen}
          onClose={() => setJoinGroupModalOpen(false)}
          currentUser={{ 
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split('@')[0] || "User",
            photoURL: user.photoURL || null,
            createdAt: new Date()
          }}
        />
      )}
      
      {createGroupModalOpen && (
        <CreateGroupModal
          isOpen={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          currentUser={{ 
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split('@')[0] || "User",
            photoURL: user.photoURL || null,
            createdAt: new Date()
          }}
        />
      )}
    </MainLayout>
  );
}
