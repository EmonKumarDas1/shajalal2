import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Shop } from "@/types/schema";
import { Trash2, Plus, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

type ChalanItem = {
  id: string;
  name: string;
  quantity: number;
};

interface ChalanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChalanForm({ onSuccess, onCancel }: ChalanFormProps) {
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [chalanItems, setChalanItems] = useState<ChalanItem[]>([]);
  const [notes, setNotes] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductQuantity, setNewProductQuantity] = useState<number>(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("name");

      if (error) throw error;
      setShops(data || []);

      if (data && data.length > 0) {
        setShopId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast({
        variant: "destructive",
        title: "Error fetching shops",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const addItemToChalan = () => {
    if (!newProductName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Product name is required",
      });
      return;
    }

    if (newProductQuantity < 1) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Quantity must be at least 1",
      });
      return;
    }

    setChalanItems([
      ...chalanItems,
      {
        id: Date.now().toString(),
        name: newProductName.trim(),
        quantity: newProductQuantity,
      },
    ]);

    toast({
      title: "Product added",
      description: `${newProductName.trim()} added to chalan`,
    });

    // Reset form
    setNewProductName("");
    setNewProductQuantity(1);
  };

  const removeItem = (id: string) => {
    setChalanItems(chalanItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) quantity = 1;

    setChalanItems(
      chalanItems.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a shop",
      });
      return;
    }

    if (chalanItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one product to the chalan",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate a unique chalan number
      const chalanNumber = `CHLN-${Date.now().toString().slice(-6)}`;

      // Insert the chalan record
      const { data: chalanData, error: chalanError } = await supabase
        .from("chalans")
        .insert({
          chalan_number: chalanNumber,
          shop_id: shopId,
          status: "pending",
          notes: notes || null,
          created_at: new Date().toISOString(),
        })
        .select();

      if (chalanError) throw chalanError;

      const chalanId = chalanData[0].id;

      // Insert chalan items
      const chalanItemsData = chalanItems.map((item) => ({
        chalan_id: chalanId,
        product_name: item.name,
        quantity: item.quantity,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from("chalan_items")
        .insert(chalanItemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Chalan created",
        description: `Chalan #${chalanNumber} has been created successfully`,
      });

      // Navigate to the chalan detail page
      navigate(`/dashboard/chalans/${chalanId}`);
      onSuccess();
    } catch (error) {
      console.error("Error creating chalan:", error);
      toast({
        variant: "destructive",
        title: "Error creating chalan",
        description:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="shop">Shop *</Label>
          <Select value={shopId} onValueChange={setShopId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional information here"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Product</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              placeholder="Enter product name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={newProductQuantity}
              onChange={(e) =>
                setNewProductQuantity(parseInt(e.target.value) || 1)
              }
            />
          </div>
          <Button
            type="button"
            onClick={addItemToChalan}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Chalan Items</h3>

        {chalanItems.length === 0 ? (
          <div className="text-center py-8 border rounded-md text-gray-500">
            No items added to chalan yet
          </div>
        ) : (
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[150px]">Quantity</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chalanItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || chalanItems.length === 0}>
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Save Chalan
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
