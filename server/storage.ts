import {
  users, User, InsertUser,
  groups, Group, InsertGroup,
  groupMembers, GroupMember, InsertGroupMember,
  expenses, Expense, InsertExpense,
  expenseShares, ExpenseShare, InsertExpenseShare,
  settlements, Settlement, InsertSettlement
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupByCode(code: string): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<Group[]>;
  
  // Group Member operations
  addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  isUserInGroup(userId: string, groupId: number): Promise<boolean>;
  
  // Expense operations
  createExpense(expense: InsertExpense, shares: InsertExpenseShare[]): Promise<Expense>;
  getExpense(id: number): Promise<Expense | undefined>;
  getGroupExpenses(groupId: number): Promise<Expense[]>;
  getUserExpenses(userId: string): Promise<Expense[]>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Expense Share operations
  getExpenseShares(expenseId: number): Promise<ExpenseShare[]>;
  
  // Settlement operations
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  getGroupSettlements(groupId: number): Promise<Settlement[]>;
  getUserSettlements(userId: string): Promise<Settlement[]>;

  // Balance calculations
  getUserBalanceInGroup(userId: string, groupId: number): Promise<number>;
  getUserTotalBalance(userId: string): Promise<number>;
  getBalancesBetweenUsers(groupId: number): Promise<{ fromUserId: string; toUserId: string; amount: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private expenses: Map<number, Expense>;
  private expenseShares: Map<number, ExpenseShare>;
  private settlements: Map<number, Settlement>;
  
  private currentGroupId: number;
  private currentGroupMemberId: number;
  private currentExpenseId: number;
  private currentExpenseShareId: number;
  private currentSettlementId: number;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.expenses = new Map();
    this.expenseShares = new Map();
    this.settlements = new Map();
    
    this.currentGroupId = 1;
    this.currentGroupMemberId = 1;
    this.currentExpenseId = 1;
    this.currentExpenseShareId = 1;
    this.currentSettlementId = 1;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Group operations
  async createGroup(groupData: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = {
      ...groupData,
      id,
      createdAt: new Date()
    };
    this.groups.set(id, group);
    
    // Add creator as a member
    await this.addUserToGroup({
      groupId: id,
      userId: groupData.createdBy
    });
    
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupByCode(code: string): Promise<Group | undefined> {
    return Array.from(this.groups.values()).find(group => group.code === code);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroupMemberships = Array.from(this.groupMembers.values())
      .filter(membership => membership.userId === userId);
    
    return Promise.all(
      userGroupMemberships.map(membership => this.getGroup(membership.groupId))
    ).then(groups => groups.filter((group): group is Group => group !== undefined));
  }

  // Group Member operations
  async addUserToGroup(memberData: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const groupMember: GroupMember = {
      ...memberData,
      id,
      joinedAt: new Date()
    };
    this.groupMembers.set(id, groupMember);
    return groupMember;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }

  async isUserInGroup(userId: string, groupId: number): Promise<boolean> {
    return (await this.getGroupMembers(groupId))
      .some(member => member.userId === userId);
  }

  // Expense operations
  async createExpense(expenseData: InsertExpense, shares: InsertExpenseShare[]): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = {
      ...expenseData,
      id,
      date: new Date()
    };
    this.expenses.set(id, expense);
    
    // Add expense shares
    for (const shareData of shares) {
      const shareId = this.currentExpenseShareId++;
      const share: ExpenseShare = {
        ...shareData,
        id: shareId,
        expenseId: id
      };
      this.expenseShares.set(shareId, share);
    }
    
    return expense;
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getGroupExpenses(groupId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.groupId === groupId);
  }

  async getUserExpenses(userId: string): Promise<Expense[]> {
    const userGroups = await this.getUserGroups(userId);
    const userGroupIds = userGroups.map(group => group.id);
    
    return Array.from(this.expenses.values())
      .filter(expense => userGroupIds.includes(expense.groupId));
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = await this.getExpense(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const success = this.expenses.delete(id);
    
    // Also delete related expense shares
    if (success) {
      const sharesToDelete = Array.from(this.expenseShares.entries())
        .filter(([_, share]) => share.expenseId === id);
      
      for (const [shareId] of sharesToDelete) {
        this.expenseShares.delete(shareId);
      }
    }
    
    return success;
  }

  // Expense Share operations
  async getExpenseShares(expenseId: number): Promise<ExpenseShare[]> {
    return Array.from(this.expenseShares.values())
      .filter(share => share.expenseId === expenseId);
  }

  // Settlement operations
  async createSettlement(settlementData: InsertSettlement): Promise<Settlement> {
    const id = this.currentSettlementId++;
    const settlement: Settlement = {
      ...settlementData,
      id,
      date: new Date()
    };
    this.settlements.set(id, settlement);
    return settlement;
  }

  async getGroupSettlements(groupId: number): Promise<Settlement[]> {
    return Array.from(this.settlements.values())
      .filter(settlement => settlement.groupId === groupId);
  }

  async getUserSettlements(userId: string): Promise<Settlement[]> {
    return Array.from(this.settlements.values())
      .filter(settlement => 
        settlement.fromUserId === userId || settlement.toUserId === userId);
  }

  // Balance calculations
  async getUserBalanceInGroup(userId: string, groupId: number): Promise<number> {
    // Get all expenses in the group
    const groupExpenses = await this.getGroupExpenses(groupId);
    
    let balance = 0;
    
    for (const expense of groupExpenses) {
      // If user paid for this expense, add the amount to their balance
      if (expense.paidBy === userId) {
        balance += Number(expense.amount);
      }
      
      // Subtract the user's share of the expense
      const expenseShares = await this.getExpenseShares(expense.id);
      const userShare = expenseShares.find(share => share.userId === userId);
      
      if (userShare) {
        balance -= Number(userShare.amount);
      }
    }
    
    // Consider settlements
    const groupSettlements = await this.getGroupSettlements(groupId);
    
    for (const settlement of groupSettlements) {
      if (settlement.fromUserId === userId) {
        balance -= Number(settlement.amount);
      }
      if (settlement.toUserId === userId) {
        balance += Number(settlement.amount);
      }
    }
    
    return balance;
  }

  async getUserTotalBalance(userId: string): Promise<number> {
    const userGroups = await this.getUserGroups(userId);
    
    let totalBalance = 0;
    
    for (const group of userGroups) {
      const groupBalance = await this.getUserBalanceInGroup(userId, group.id);
      totalBalance += groupBalance;
    }
    
    return totalBalance;
  }

  async getBalancesBetweenUsers(groupId: number): Promise<{ fromUserId: string; toUserId: string; amount: number }[]> {
    const groupMembers = await this.getGroupMembers(groupId);
    const memberIds = groupMembers.map(member => member.userId);
    
    const balances: Record<string, number> = {};
    
    // Initialize balances
    for (const userId of memberIds) {
      balances[userId] = await this.getUserBalanceInGroup(userId, groupId);
    }
    
    // Calculate who owes whom
    const debts: { fromUserId: string; toUserId: string; amount: number }[] = [];
    
    // Sort users by balance (descending)
    const sortedMembers = [...memberIds].sort((a, b) => balances[b] - balances[a]);
    
    // Match creditors with debtors
    let i = 0; // creditors (positive balance)
    let j = sortedMembers.length - 1; // debtors (negative balance)
    
    while (i < j) {
      const creditor = sortedMembers[i];
      const debtor = sortedMembers[j];
      
      const credit = balances[creditor];
      const debt = -balances[debtor];
      
      if (credit <= 0) { i++; continue; } // Not a creditor anymore
      if (debt <= 0) { j--; continue; } // Not a debtor anymore
      
      const amount = Math.min(credit, debt);
      
      if (amount > 0) {
        debts.push({
          fromUserId: debtor,
          toUserId: creditor,
          amount
        });
        
        // Update balances
        balances[creditor] -= amount;
        balances[debtor] += amount;
      }
      
      if (balances[creditor] === 0) i++;
      if (balances[debtor] === 0) j--;
    }
    
    return debts;
  }
}

export const storage = new MemStorage();
