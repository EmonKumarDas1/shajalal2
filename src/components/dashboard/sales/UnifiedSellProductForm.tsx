import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Trash2 } from "lucide-react";

interface UnifiedSellProductFormProps {
  shopId?: string;
  customerName?: string;
  customerPhone?: string;
}

export function UnifiedSellProductForm({
  shopId = "",
  customerName = "",
  customerPhone = "",
}: UnifiedSellProductFormProps) {
  const [activeTab, setActiveTab] = useState("regular");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [outerProducts, setOuterProducts] = useState<any[]>([]);

  // Sample data - in a real app, this would come from your database
  const regularProducts = [
    { id: 1, name: "T-Shirt", price: 25.99, stock: 50 },
    { id: 2, name: "Jeans", price: 45.99, stock: 30 },
    { id: 3, name: "Sneakers", price: 89.99, stock: 15 },
  ];

  const handleAddRegularProduct = (product: any) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleAddOuterProduct = () => {
    const newId = outerProducts.length
      ? Math.max(...outerProducts.map((p) => p.id)) + 1
      : 1;
    setOuterProducts([
      ...outerProducts,
      {
        id: newId,
        name: "",
        price: 0,
        quantity: 1,
      },
    ]);
  };

  const updateOuterProduct = (
    id: number,
    field: string,
    value: string | number,
  ) => {
    setOuterProducts(
      outerProducts.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  };

  const removeOuterProduct = (id: number) => {
    setOuterProducts(outerProducts.filter((product) => product.id !== id));
  };

  const updateProductQuantity = (id: number, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map((product) =>
        product.id === id ? { ...product, quantity } : product,
      ),
    );
  };

  const removeProduct = (id: number) => {
    setSelectedProducts(
      selectedProducts.filter((product) => product.id !== id),
    );
  };

  const calculateTotal = () => {
    const regularTotal = selectedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );

    const outerTotal = outerProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );

    return {
      regularTotal,
      outerTotal,
      grandTotal: regularTotal + outerTotal,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotal();
    console.log("Submitting sale:", {
      shopId,
      customerName,
      customerPhone,
      regularProducts: selectedProducts,
      outerProducts,
      totals,
    });
    // Here you would typically save the sale to your database
    alert("Sale completed successfully!");
  };

  const filteredProducts = regularProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totals = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Products</TabsTrigger>
          <TabsTrigger value="outer">Outer Products</TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-md p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.stock} in stock
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddRegularProduct(product)}
                  disabled={selectedProducts.some((p) => p.id === product.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="outer" className="space-y-4">
          <div className="space-y-4">
            {outerProducts.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-12 gap-4 items-center border p-4 rounded-md"
              >
                <div className="col-span-4 space-y-1">
                  <Label htmlFor={`outer-name-${product.id}`}>
                    Product Name
                  </Label>
                  <Input
                    id={`outer-name-${product.id}`}
                    value={product.name}
                    onChange={(e) =>
                      updateOuterProduct(product.id, "name", e.target.value)
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label htmlFor={`outer-price-${product.id}`}>Price</Label>
                  <Input
                    id={`outer-price-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) =>
                      updateOuterProduct(
                        product.id,
                        "price",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor={`outer-quantity-${product.id}`}>
                    Quantity
                  </Label>
                  <Input
                    id={`outer-quantity-${product.id}`}
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) =>
                      updateOuterProduct(
                        product.id,
                        "quantity",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="opacity-0">Action</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOuterProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOuterProduct}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Outer Product
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="font-medium mb-3">Selected Products</h3>
        {selectedProducts.length === 0 && outerProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No products selected</p>
        ) : (
          <div className="space-y-3">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    ${product.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateProductQuantity(
                          product.id,
                          Math.max(1, product.quantity - 1),
                        )
                      }
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{product.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateProductQuantity(product.id, product.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {outerProducts
              .filter((p) => p.name && p.price > 0)
              .map((product) => (
                <div
                  key={`outer-${product.id}`}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium">
                      {product.name}{" "}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Outer
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      ${product.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Qty: {product.quantity}</span>
                  </div>
                </div>
              ))}

            <div className="pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Regular Products Subtotal:</span>
                <span>${totals.regularTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outer Products Subtotal:</span>
                <span>${totals.outerTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t mt-1">
                <span>Total:</span>
                <span>${totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="print-receipt" />
          <Label htmlFor="print-receipt">Print receipt</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              selectedProducts.length === 0 &&
              outerProducts.filter((p) => p.name && p.price > 0).length === 0
            }
          >
            Complete Sale
          </Button>
        </div>
      </div>
    </form>
  );
}
