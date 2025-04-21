import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import ExpenseDetails from "@/pages/expense-details";
import GroupDetails from "@/pages/group-details";

function App() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Main Routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      
      {/* Group Routes */}
      <Route path="/groups/:id" component={GroupDetails} />
      
      {/* Expense Routes */}
      <Route path="/expenses/:id" component={ExpenseDetails} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
