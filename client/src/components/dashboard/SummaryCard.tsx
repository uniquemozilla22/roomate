import React from "react";
import { Card } from "@/components/ui/card";

type SummaryCardProps = {
  title: string;
  value: string | number;
  description: string;
  className?: string;
};

export default function SummaryCard({ 
  title, 
  value, 
  description, 
  className = "" 
}: SummaryCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className={`text-2xl font-semibold ${value.toString().startsWith('+') ? 'text-secondary' : ''}`}>
        {value}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </Card>
  );
}
