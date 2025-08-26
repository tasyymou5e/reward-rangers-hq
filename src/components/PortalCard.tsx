import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: "kids" | "parents" | "admin";
  onClick: () => void;
}

export function PortalCard({ title, description, icon, variant, onClick }: PortalCardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case "kids":
        return "bg-kids-background border-kids-primary/20 hover:shadow-kids hover:scale-105 transform transition-bounce";
      case "parents":
        return "bg-parents-background border-parents-primary/20 hover:shadow-parents hover:scale-105 transform transition-bounce";
      case "admin":
        return "bg-admin-background border-admin-primary/20 hover:shadow-lg hover:scale-105 transform transition-bounce";
    }
  };

  return (
    <Card className={`cursor-pointer ${getCardStyles()}`} onClick={onClick}>
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex justify-center text-6xl animate-bounce-in">
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant={variant} size="lg" className="w-full">
          Enter {title}
        </Button>
      </CardContent>
    </Card>
  );
}