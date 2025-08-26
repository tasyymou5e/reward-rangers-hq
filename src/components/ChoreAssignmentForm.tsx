import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChores } from "@/hooks/useChores";

const choreSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  points_value: z.number().min(1, "Points must be at least 1"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time_minutes: z.number().optional(),
  due_date: z.date().optional(),
});

type ChoreFormData = z.infer<typeof choreSchema>;

interface ChoreAssignmentFormProps {
  children: Array<{
    id: string;
    display_name: string;
    avatar_url?: string;
    points: number;
    level: number;
  }>;
  onSuccess?: () => void;
}

export function ChoreAssignmentForm({ children, onSuccess }: ChoreAssignmentFormProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<"individual" | "all">("individual");
  const [dueDate, setDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createBulkChores } = useChores();
  const { toast } = useToast();

  const form = useForm<ChoreFormData>({
    resolver: zodResolver(choreSchema),
    defaultValues: {
      points_value: 10,
      difficulty: "easy",
    },
  });

  const handleChildSelection = (childId: string, checked: boolean) => {
    if (checked) {
      setSelectedChildren(prev => [...prev, childId]);
    } else {
      setSelectedChildren(prev => prev.filter(id => id !== childId));
    }
  };

  const handleSelectAll = () => {
    if (assignmentType === "all") {
      setSelectedChildren(children.map(child => child.id));
    } else {
      setSelectedChildren([]);
    }
  };

  const onSubmit = async (data: ChoreFormData) => {
    if (selectedChildren.length === 0) {
      toast({
        title: "No Children Selected",
        description: "Please select at least one child to assign this chore to.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const choreData = {
        ...data,
        due_date: dueDate?.toISOString(),
      };

      // Create chores for all selected children using bulk creation
      await createBulkChores(choreData, selectedChildren);

      toast({
        title: "✅ Chores Created!",
        description: `Successfully assigned "${data.title}" to ${selectedChildren.length} ${selectedChildren.length === 1 ? 'child' : 'children'}.`,
      });

      // Reset form
      form.reset();
      setSelectedChildren([]);
      setDueDate(undefined);
      setAssignmentType("individual");
      onSuccess?.();

    } catch (error) {
      console.error('Error creating chores:', error);
      toast({
        title: "Error",
        description: "Failed to create chores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-parents-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create & Assign Chores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Chore Details */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Chore Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Make bed, Clean room..."
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points (XP) *</Label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="10"
                  {...form.register("points_value", { valueAsNumber: true })}
                />
                {form.formState.errors.points_value && (
                  <p className="text-sm text-red-500">{form.formState.errors.points_value.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed instructions for the chore..."
                {...form.register("description")}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select onValueChange={(value) => form.setValue("difficulty", value as "easy" | "medium" | "hard")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">😊 Easy</SelectItem>
                    <SelectItem value="medium">🤔 Medium</SelectItem>
                    <SelectItem value="hard">💪 Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Estimated Time (minutes)</Label>
                <Input
                  id="time"
                  type="number"
                  min={1}
                  max={240}
                  placeholder="15"
                  {...form.register("estimated_time_minutes", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Assignment Type Selection */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Assignment Type</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="individual"
                  name="assignmentType"
                  checked={assignmentType === "individual"}
                  onChange={() => {
                    setAssignmentType("individual");
                    setSelectedChildren([]);
                  }}
                  className="text-parents-primary"
                />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Assign to specific children
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all"
                  name="assignmentType"
                  checked={assignmentType === "all"}
                  onChange={() => {
                    setAssignmentType("all");
                    handleSelectAll();
                  }}
                  className="text-parents-primary"
                />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Assign to all children
                </Label>
              </div>
            </div>
          </div>

          {/* Children Selection */}
          {children.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">
                Select Children ({selectedChildren.length} selected)
              </Label>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                      selectedChildren.includes(child.id)
                        ? "border-parents-primary bg-parents-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={(checked) => handleChildSelection(child.id, checked as boolean)}
                      disabled={assignmentType === "all"}
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-kids-primary flex items-center justify-center text-white font-bold">
                        {child.avatar_url ? (
                          <img
                            src={child.avatar_url}
                            alt={child.display_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          child.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`child-${child.id}`} className="font-medium cursor-pointer">
                          {child.display_name}
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Level {child.level} • {child.points} XP
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {children.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No children found in your family.</p>
                  <p className="text-sm">Add family members to assign chores.</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="parents"
              className="flex-1"
              disabled={isSubmitting || selectedChildren.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting
                ? "Creating..."
                : `Create Chore for ${selectedChildren.length} ${selectedChildren.length === 1 ? 'Child' : 'Children'}`
              }
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setSelectedChildren([]);
                setDueDate(undefined);
                setAssignmentType("individual");
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}