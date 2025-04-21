import express, { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertExpenseSchema,
  insertExpenseShareSchema,
  insertSettlementSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();

  // User routes
  apiRouter.post("/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(200).json(existingUser); // User already exists
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  apiRouter.get("/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Group routes
  apiRouter.post("/groups", async (req, res) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  apiRouter.get("/groups/:id", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group" });
    }
  });

  apiRouter.get("/groups/code/:code", async (req, res) => {
    try {
      const group = await storage.getGroupByCode(req.params.code);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group by code" });
    }
  });

  apiRouter.get("/users/:userId/groups", async (req, res) => {
    try {
      const groups = await storage.getUserGroups(req.params.userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user groups" });
    }
  });

  // Group Member routes
  apiRouter.post("/group-members", async (req, res) => {
    try {
      const memberData = insertGroupMemberSchema.parse(req.body);
      
      // Check if user is already in the group
      const isAlreadyMember = await storage.isUserInGroup(memberData.userId, memberData.groupId);
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member of this group" });
      }
      
      const groupMember = await storage.addUserToGroup(memberData);
      res.status(201).json(groupMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add member to group" });
    }
  });

  apiRouter.get("/groups/:groupId/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const members = await storage.getGroupMembers(groupId);
      
      // Get full user details for each member
      const memberDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return { ...member, user };
        })
      );
      
      res.json(memberDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group members" });
    }
  });

  // Expense routes
  apiRouter.post("/expenses", async (req, res) => {
    try {
      const { expense, shares } = req.body;
      
      const validatedExpense = insertExpenseSchema.parse(expense);
      const validatedShares = z.array(insertExpenseShareSchema).parse(shares);
      
      // Verify that the sum of shares equals the expense amount
      const totalShares = validatedShares.reduce((sum, share) => sum + Number(share.amount), 0);
      if (Number(totalShares.toFixed(2)) !== Number(validatedExpense.amount)) {
        return res.status(400).json({ 
          message: "Sum of shares must equal the expense amount",
          expenseAmount: validatedExpense.amount,
          sharesTotal: totalShares
        });
      }
      
      const createdExpense = await storage.createExpense(validatedExpense, validatedShares);
      res.status(201).json(createdExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  apiRouter.get("/expenses/:id", async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const expense = await storage.getExpense(expenseId);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      const shares = await storage.getExpenseShares(expenseId);
      
      res.json({ expense, shares });
    } catch (error) {
      res.status(500).json({ message: "Failed to get expense" });
    }
  });

  apiRouter.get("/groups/:groupId/expenses", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const expenses = await storage.getGroupExpenses(groupId);
      
      // Get expense shares for each expense
      const expensesWithShares = await Promise.all(
        expenses.map(async (expense) => {
          const shares = await storage.getExpenseShares(expense.id);
          return { ...expense, shares };
        })
      );
      
      res.json(expensesWithShares);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group expenses" });
    }
  });

  apiRouter.get("/users/:userId/expenses", async (req, res) => {
    try {
      const expenses = await storage.getUserExpenses(req.params.userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user expenses" });
    }
  });

  apiRouter.put("/expenses/:id", async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const expenseData = req.body;
      
      const updatedExpense = await storage.updateExpense(expenseId, expenseData);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  apiRouter.delete("/expenses/:id", async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const success = await storage.deleteExpense(expenseId);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Settlement routes
  apiRouter.post("/settlements", async (req, res) => {
    try {
      const settlementData = insertSettlementSchema.parse(req.body);
      const settlement = await storage.createSettlement(settlementData);
      res.status(201).json(settlement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create settlement" });
    }
  });

  apiRouter.get("/groups/:groupId/settlements", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const settlements = await storage.getGroupSettlements(groupId);
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group settlements" });
    }
  });

  // Balance routes
  apiRouter.get("/users/:userId/groups/:groupId/balance", async (req, res) => {
    try {
      const userId = req.params.userId;
      const groupId = parseInt(req.params.groupId);
      
      const balance = await storage.getUserBalanceInGroup(userId, groupId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user balance in group" });
    }
  });

  apiRouter.get("/users/:userId/balance", async (req, res) => {
    try {
      const userId = req.params.userId;
      const balance = await storage.getUserTotalBalance(userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user total balance" });
    }
  });

  apiRouter.get("/groups/:groupId/balances", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const balances = await storage.getBalancesBetweenUsers(groupId);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: "Failed to get balances between users" });
    }
  });

  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
