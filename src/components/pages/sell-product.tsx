import { useState, useEffect } from "react";
import { DashboardLayout } from "../dashboard/layout/DashboardLayout";
import { SellProductForm } from "../dashboard/sales/SellProductForm";
import { OuterProductSaleForm } from "../dashboard/sales/OuterProductSaleForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "../../../supabase/supabase";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { CustomerSelection } from "../dashboard/sales/CustomerSelection";
import { Card, CardContent } from "@/components/ui/card";

export default function SellProduct() {
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [activeTab, setActiveTab] = useState("regular");

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name")
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

  const handleCustomerSelected = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
  };

  const handleOuterSaleSuccess = () => {
    // Reset form or navigate as needed
    setActiveTab("regular");
  };

  const handleOuterSaleCancel = () => {
    // Handle cancel action if needed
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sell Product</h1>
          <p className="text-gray-500">
            Create a new sale and generate invoice
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="regular">Regular Sale</TabsTrigger>
            <TabsTrigger value="outer">Outer Product Sale</TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="mt-4">
            <SellProductForm />
          </TabsContent>

          <TabsContent value="outer" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-3">
                {/* This space is intentionally left empty to align with the right sidebar */}
              </div>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
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
                      {shops.length === 0 && (
                        <p className="text-xs text-red-500">
                          No shops available. Please add a shop first.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <CustomerSelection
                      onCustomerSelected={handleCustomerSelected}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <OuterProductSaleForm
                onSuccess={handleOuterSaleSuccess}
                onCancel={handleOuterSaleCancel}
                shopId={shopId}
                customerName={customerName}
                customerPhone={customerPhone}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
