import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import ExpenseItem from "./ExpenseItem";
import { Expense } from "@shared/schema";

type ExtendedExpense = Expense & {
  group: { id: number; name: string };
  paidByUser: { id: string; displayName: string };
  userShare?: number;
  date: Date;
};

type ExpensesListProps = {
  expenses: ExtendedExpense[];
  title?: string;
  showViewAll?: boolean;
  currentUserId: string;
};

export default function ExpensesList({ 
  expenses, 
  title = "Recent Expenses", 
  showViewAll = true,
  currentUserId
}: ExpensesListProps) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showViewAll && (
          <Link href="/expenses">
            <a className="text-sm text-primary hover:underline">View all</a>
          </Link>
        )}
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No expenses to show.</p>
        </div>
      ) : (
        <div>
          {expenses.map((expense) => (
            <ExpenseItem 
              key={expense.id} 
              expense={expense} 
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
