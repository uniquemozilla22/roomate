import React from "react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Expense } from "@shared/schema";
import { ShoppingCart, Wifi, Utensils, Trash } from "lucide-react";
import { format } from "date-fns";

type ExtendedExpense = Expense & {
  group: { id: number; name: string };
  paidByUser: { id: string; displayName: string };
  userShare?: number;
  date: Date;
};

type ExpenseItemProps = {
  expense: ExtendedExpense;
  currentUserId: string;
};

export default function ExpenseItem({ expense, currentUserId }: ExpenseItemProps) {
  const getExpenseIcon = () => {
    // Basic logic to determine icon based on expense title
    const title = expense.title.toLowerCase();
    if (title.includes("grocery") || title.includes("shop") || title.includes("store")) {
      return <ShoppingCart className="h-5 w-5 text-muted-foreground" />;
    } else if (title.includes("internet") || title.includes("wifi") || title.includes("bill")) {
      return <Wifi className="h-5 w-5 text-muted-foreground" />;
    } else if (title.includes("dinner") || title.includes("lunch") || title.includes("food")) {
      return <Utensils className="h-5 w-5 text-muted-foreground" />;
    } else if (title.includes("clean")) {
      return <Trash className="h-5 w-5 text-muted-foreground" />;
    } else {
      return <ShoppingCart className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const isPaidByCurrentUser = expense.paidBy === currentUserId;
  const formattedDate = format(expense.date, "MMM d, yyyy");
  
  // Determine user balance text
  let userBalanceText = "";
  let userBalanceClass = "";
  
  if (expense.userShare !== undefined) {
    if (isPaidByCurrentUser) {
      const amountLent = Number(expense.amount) - expense.userShare;
      if (amountLent > 0) {
        userBalanceText = `You lent ${formatCurrency(amountLent)}`;
        userBalanceClass = "text-secondary";
      } else {
        userBalanceText = `You paid ${formatCurrency(expense.amount)}`;
        userBalanceClass = "text-muted-foreground";
      }
    } else {
      userBalanceText = `You owe ${formatCurrency(expense.userShare)}`;
      userBalanceClass = "text-destructive";
    }
  }

  return (
    <Link href={`/expenses/${expense.id}`}>
      <a className="block border-b border-neutral-border py-3 last:border-0 hover:bg-neutral-light">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-neutral-light flex items-center justify-center mr-3">
              {getExpenseIcon()}
            </div>
            <div>
              <div className="flex items-center">
                <h4 className="font-medium">{expense.title}</h4>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-primary text-xs rounded">
                  {expense.group.name}
                </span>
              </div>
              <div className="flex text-sm text-muted-foreground mt-1">
                <span>
                  {isPaidByCurrentUser 
                    ? "Paid by you" 
                    : `Paid by ${expense.paidByUser.displayName}`}
                </span>
                <span className="mx-1">•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(expense.amount)}</div>
            {userBalanceText && (
              <div className={`text-sm ${userBalanceClass}`}>
                {userBalanceText}
              </div>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
}
