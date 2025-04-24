import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface ChalanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChalanForm({ onSuccess, onCancel }: ChalanFormProps) {
  const [items, setItems] = useState([
    { id: 1, name: "", quantity: 1, description: "" },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: items.length + 1, name: "", quantity: 1, description: "" },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the chalan data to your database
    console.log("Submitting chalan data:", { items });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select defaultValue="">
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer1">ABC Company</SelectItem>
              <SelectItem value="customer2">XYZ Corporation</SelectItem>
              <SelectItem value="customer3">123 Industries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-5 space-y-2">
                <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                <Input
                  id={`item-name-${item.id}`}
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor={`item-quantity-${item.id}`}>Quantity</Label>
                <Input
                  id={`item-quantity-${item.id}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", parseInt(e.target.value))
                  }
                />
              </div>
              <div className="col-span-4 space-y-2">
                <Label htmlFor={`item-description-${item.id}`}>
                  Description
                </Label>
                <Input
                  id={`item-description-${item.id}`}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="col-span-1 pt-8">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={addItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes or delivery instructions"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Chalan</Button>
      </div>
    </form>
  );
}
