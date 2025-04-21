import { DashboardLayout } from "../dashboard/layout/DashboardLayout";
import { SellProductForm } from "../dashboard/sales/SellProductForm";

export default function SellProduct() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sell Product</h1>
          <p className="text-gray-500">
            Create a new sale and generate invoice
          </p>
        </div>
        <SellProductForm />
      </div>
    </DashboardLayout>
  );
}
