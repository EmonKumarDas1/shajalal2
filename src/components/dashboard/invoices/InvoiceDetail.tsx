import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Download,
  Printer,
  Plus,
  RotateCcw,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { usePDF } from "react-to-pdf";
import { ReturnForm } from "../returns/ReturnForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvoiceItem = {
  id?: string;
  product_id: string;
  product_name: string;
  product_barcode?: string | null;
  product_watt?: number | null;
  product_size?: string | null;
  product_color?: string | null;
  product_model?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_outer_product: boolean;
  buying_price: number;
};

type Invoice = {
  id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  advance_payment: number;
  remaining_amount: number;
  status: "paid" | "partially_paid" | "unpaid";
  supplier_id?: string;
  shop_id: string;
  supplier_name?: string;
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
  supplier_details?: any;
  shop_details?: any;
  invoice_items?: InvoiceItem[];
  payments?: any[];
  invoice_type?: "sales" | "product_addition";
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  customer_details?: any;
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({
    filename: `invoice-${invoice?.invoice_number}.pdf`,
  });

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails(id);
    }
  }, [id]);

  async function fetchInvoiceDetails(invoiceId: string) {
    try {
      setLoading(true);
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoiceData) throw new Error("Invoice not found");

      let supplierData = null;
      if (invoiceData.supplier_id) {
        const { data, error: supplierError } = await supabase
          .from("suppliers")
          .select("*")
          .eq("id", invoiceData.supplier_id)
          .single();
        if (!supplierError) supplierData = data;
      }

      let customerData = null;
      if (invoiceData.customer_id) {
        const { data, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", invoiceData.customer_id)
          .single();
        if (!customerError) customerData = data;
      }

      let shopData = null;
      if (invoiceData.shop_id) {
        const { data, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", invoiceData.shop_id)
          .single();
        if (!shopError) shopData = data;
      }

      const { data: invoiceItemsData, error: invoiceItemsError } =
        await supabase
          .from("invoice_items")
          .select("*, products(id, name, barcode, watt, size, color, model)")
          .eq("invoice_id", invoiceId);

      if (invoiceItemsError) throw invoiceItemsError;

      const processedInvoiceItems = invoiceItemsData?.map((item) => ({
        id: item.id,
        product_id: (item.products && item.products.id) || item.product_id,
        product_name:
          item.product_name ||
          (item.products && item.products.name) ||
          "Unknown Product",
        product_barcode:
          item.barcode || (item.products && item.products.barcode) || null,
        product_watt:
          item.watt || (item.products && item.products.watt) || null,
        product_size:
          item.size || (item.products && item.products.size) || null,
        product_color:
          item.color || (item.products && item.products.color) || null,
        product_model:
          item.model || (item.products && item.products.model) || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        is_outer_product: item.is_outer_product,
        buying_price: item.buying_price,
      }));

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (paymentsError) throw paymentsError;

      const invoiceDetails: Invoice = {
        ...invoiceData,
        supplier_name: supplierData?.name || "Unknown Supplier",
        shop_name: shopData?.name || "Unknown Shop",
        shop_address: shopData?.address || "",
        shop_phone: shopData?.phone || "",
        supplier_details: supplierData || {},
        shop_details: shopData || {},
        customer_details: customerData || {},
        invoice_items: processedInvoiceItems || [],
        payments: paymentsData || [],
      };

      setInvoice(invoiceDetails);
      setEditedInvoice({ ...invoiceDetails });
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast({
        variant: "destructive",
        title: "Error fetching invoice",
        description:
          error instanceof Error
            ? error.message
            : (error as any)?.message || "An unexpected error occurred",
      });
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "border-green-600 bg-green-100 text-green-800";
      case "partially_paid":
        return "border-yellow-600 bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "border-red-600 bg-red-100 text-red-800";
      default:
        return "border-gray-600 bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "PAID";
      case "partially_paid":
        return "PARTIALLY PAID";
      case "unpaid":
        return "UNPAID";
      default:
        return status.toUpperCase();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddPayment = async () => {
    if (!id || !invoice) return;

    if (
      !paymentAmount ||
      isNaN(Number(paymentAmount)) ||
      Number(paymentAmount) <= 0
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
      });
      return;
    }

    if (Number(paymentAmount) > invoice.remaining_amount) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Payment amount cannot exceed remaining balance",
      });
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes,
        payment_date: new Date().toISOString(),
      });

      if (paymentError) throw paymentError;

      const newRemainingAmount = Math.max(
        0,
        invoice.remaining_amount - Number(paymentAmount),
      );
      const newStatus = newRemainingAmount <= 0 ? "paid" : "partially_paid";

      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          remaining_amount: newRemainingAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      toast({
        title: "Payment Recorded",
        description: `Payment of $${Number(paymentAmount).toFixed(2)} successfully recorded`,
      });

      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
      setIsAddPaymentOpen(false);
      fetchInvoiceDetails(id);
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description:
          error instanceof Error ? error.message : "Failed to process payment",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && invoice) {
      setEditedInvoice({ ...invoice });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    field: keyof Invoice,
    value: string | number | InvoiceItem[],
  ) => {
    if (editedInvoice) {
      setEditedInvoice({ ...editedInvoice, [field]: value });
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number | null,
  ) => {
    if (editedInvoice && editedInvoice.invoice_items) {
      const updatedItems = [...editedInvoice.invoice_items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        updatedItems[index].total_price =
          Number(updatedItems[index].quantity) *
          Number(updatedItems[index].unit_price);
      }

      const newTotalAmount = updatedItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );
      const newRemainingAmount = Math.max(
        0,
        newTotalAmount - editedInvoice.advance_payment,
      );
      const newStatus =
        newRemainingAmount <= 0
          ? "paid"
          : newTotalAmount === newRemainingAmount
            ? "unpaid"
            : "partially_paid";

      setEditedInvoice({
        ...editedInvoice,
        invoice_items: updatedItems,
        total_amount: newTotalAmount,
        remaining_amount: newRemainingAmount,
        status: newStatus,
      });
    }
  };

  const handleSave = async () => {
    if (!id || !editedInvoice) return;

    if (!editedInvoice.invoice_number.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invoice number is required",
      });
      return;
    }

    if (
      !editedInvoice.invoice_items ||
      editedInvoice.invoice_items.length === 0
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invoice must have at least one item",
      });
      return;
    }

    for (const item of editedInvoice.invoice_items) {
      if (!item.product_name.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Product name is required for all items",
        });
        return;
      }
      if (
        !item.quantity ||
        isNaN(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Invalid quantity for ${item.product_name}`,
        });
        return;
      }
      if (
        !item.unit_price ||
        isNaN(Number(item.unit_price)) ||
        Number(item.unit_price) <= 0
      ) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Invalid unit price for ${item.product_name}`,
        });
        return;
      }
      if (
        item.product_watt &&
        (isNaN(Number(item.product_watt)) || Number(item.product_watt) <= 0)
      ) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Invalid watt for ${item.product_name}`,
        });
        return;
      }
    }

    try {
      setIsSaving(true);

      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          invoice_number: editedInvoice.invoice_number,
          total_amount: editedInvoice.total_amount,
          advance_payment: editedInvoice.advance_payment,
          remaining_amount: editedInvoice.remaining_amount,
          status: editedInvoice.status,
          notes: editedInvoice.notes,
          customer_name: editedInvoice.customer_name,
          customer_phone: editedInvoice.customer_phone,
          created_at: editedInvoice.created_at,
          updated_at: new Date().toISOString(),
          invoice_type: editedInvoice.invoice_type,
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      for (const item of editedInvoice.invoice_items) {
        if (item.id) {
          const { error: itemError } = await supabase
            .from("invoice_items")
            .update({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              barcode: item.product_barcode?.trim() || null,
              watt: item.product_watt ? Number(item.product_watt) : null,
              size: item.product_size?.trim() || null,
              color: item.product_color?.trim() || null,
              model: item.product_model?.trim() || null,
            })
            .eq("id", item.id);

          if (itemError) throw itemError;
        } else {
          const { error: itemError } = await supabase
            .from("invoice_items")
            .insert({
              invoice_id: id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              barcode: item.product_barcode?.trim() || null,
              watt: item.product_watt ? Number(item.product_watt) : null,
              size: item.product_size?.trim() || null,
              color: item.product_color?.trim() || null,
              model: item.product_model?.trim() || null,
            });

          if (itemError) throw itemError;
        }
      }

      toast({
        title: "Invoice Updated",
        description: "The invoice has been successfully updated",
      });

      setIsEditing(false);
      fetchInvoiceDetails(id);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error updating invoice",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDiscountAmount = () => {
    if (!editedInvoice?.notes) return 0;
    const discountMatch = editedInvoice.notes.match(/Discount: ([\d.]+)/);
    return discountMatch ? parseFloat(discountMatch[1]) : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice || !editedInvoice) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        Invoice not found
      </div>
    );
  }

  const discountAmount = getDiscountAmount();
  const subtotalBeforeDiscount = editedInvoice.total_amount + discountAmount;

  return (
    <div className="space-y-4 print:space-y-0 text-sm">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-size: 10pt;
              line-height: 1.2;
            }
            .print\\:hidden {
              display: none;
            }
            .print\\:border {
              border: 1px solid #e5e7eb;
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
            .card-content {
              padding: 8mm !important;
            }
            table {
              font-size: 9pt !important;
            }
            .no-print {
              display: none;
            }
            .print-compact {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      <div className="flex justify-between items-center print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/invoices")}
          className="flex items-center gap-1 text-xs p-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="flex items-center gap-1 text-xs p-2"
                disabled={isSaving}
              >
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-xs p-2"
                disabled={isSaving}
              >
                <Save className="h-3 w-3" /> {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              {invoice.remaining_amount > 0 && (
                <Button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-xs p-2"
                >
                  <Plus className="h-3 w-3" /> Payment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-1 text-xs p-2"
              >
                <Printer className="h-3 w-3" /> Print
              </Button>
              {invoice.invoice_type === "sales" && (
                <Button
                  variant="outline"
                  onClick={() => setIsReturnDialogOpen(true)}
                  className="flex items-center gap-1 border-orange-600 text-orange-600 hover:bg-orange-50 text-xs p-2"
                >
                  <RotateCcw className="h-3 w-3" /> Return
                </Button>
              )}
              <Button
                onClick={() => toPDF()}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-xs p-2"
              >
                <Download className="h-3 w-3" /> PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="flex items-center gap-1 text-xs p-2"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
            </>
          )}
        </div>
      </div>

      <Card
        className="border-none print:border print:shadow-none"
        ref={targetRef}
      >
        <CardContent className="p-4 card-content">
          <div className="mb-4 bg-gradient-to-r from-blue-100 to-white p-2 rounded-t-md border-b border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="https://i.ibb.co.com/B2MzGc7Y/Screenshot-2025-04-20-195658.png"
                  alt="Shahjalal Lighting Logo"
                  className="h-12"
                />
                <div>
                  <h1 className="text-xl font-bold text-blue-900">
                    SHAHJALAL LIGHTING
                  </h1>
                  <p className="text-xs text-gray-700">
                    1st Class Contractor, Importer & Suppliers
                  </p>
                  <p className="text-[10px] font-semibold text-green-700 inline-block px-1 py-0.5 mt-0.5 rounded">
                    ELECTRICAL GOODS WHOLESALER & RETAILER
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p>119/24, Foyez Electric Market</p>
                <p>Nandankanan, Chittagong</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <svg
                    className="w-3 h-3 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  <p>031-2859667, 01979-500055</p>
                </div>
                <p className="mt-0.5">mslctg444@gmail.com</p>
              </div>
            </div>
            <div className="text-center mt-2">
              {isEditing ? (
                <Input
                  value={editedInvoice.invoice_number}
                  onChange={(e) =>
                    handleInputChange("invoice_number", e.target.value)
                  }
                  className="text-xs text-center mx-auto w-32"
                />
              ) : (
                <p className="text-xs text-gray-600">
                  Invoice #{editedInvoice.invoice_number}
                </p>
              )}
              <Badge
                variant="outline"
                className={`mt-1 ${getStatusColor(editedInvoice.status)} font-semibold text-[10px]`}
              >
                {getStatusLabel(editedInvoice.status)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h2 className="text-xs font-semibold text-gray-700 uppercase">
                Billed To
              </h2>
              {isEditing ? (
                <>
                  <Input
                    value={editedInvoice.customer_name || ""}
                    onChange={(e) =>
                      handleInputChange("customer_name", e.target.value)
                    }
                    placeholder="Customer Name"
                    className="mt-1 text-sm"
                  />
                  <Input
                    value={editedInvoice.customer_phone || ""}
                    onChange={(e) =>
                      handleInputChange("customer_phone", e.target.value)
                    }
                    placeholder="Customer Phone"
                    className="mt-1 text-xs"
                  />
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm">
                    {editedInvoice.invoice_type === "sales"
                      ? editedInvoice.customer_name ||
                        editedInvoice.customer_details?.name ||
                        "Unknown Customer"
                      : editedInvoice.supplier_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {editedInvoice.invoice_type === "sales"
                      ? editedInvoice.customer_phone ||
                        editedInvoice.customer_details?.phone ||
                        ""
                      : ""}
                  </p>
                  {editedInvoice.invoice_type === "sales" &&
                    editedInvoice.customer_details?.address && (
                      <p className="text-xs text-gray-600">
                        {editedInvoice.customer_details.address}
                      </p>
                    )}
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs">
              <div>
                <p className="font-semibold text-gray-600">Invoice Date:</p>
                {isEditing ? (
                  <Input
                    type="date"
                    value={
                      new Date(editedInvoice.created_at)
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      handleInputChange("created_at", e.target.value)
                    }
                    className="text-xs"
                  />
                ) : (
                  <p>
                    {new Date(editedInvoice.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-600">Invoice Type:</p>
                {isEditing ? (
                  <Select
                    value={editedInvoice.invoice_type}
                    onValueChange={(value) =>
                      handleInputChange("invoice_type", value)
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="product_addition">Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>
                    {editedInvoice.invoice_type === "sales"
                      ? "Sales"
                      : "Purchase"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Description
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Watt
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Size
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Color
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Model
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Qty
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Unit Price
                  </th>
                  <th className="py-1 px-2 text-left font-semibold text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {editedInvoice.invoice_items &&
                editedInvoice.invoice_items.length > 0 ? (
                  editedInvoice.invoice_items.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="border-b border-gray-200"
                    >
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            value={item.product_name}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "product_name",
                                e.target.value,
                              )
                            }
                            className="text-xs"
                          />
                        ) : (
                          <>
                            <p className="font-medium">{item.product_name}</p>
                            {item.product_barcode && (
                              <p className="text-[10px] text-gray-500">
                                Barcode: {item.product_barcode}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.product_watt || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "product_watt",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className="text-xs w-16"
                            placeholder="Watt"
                            min="0"
                          />
                        ) : item.product_watt ? (
                          `${item.product_watt}W`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            value={item.product_size || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "product_size",
                                e.target.value,
                              )
                            }
                            className="text-xs w-20"
                            placeholder="Size"
                          />
                        ) : (
                          item.product_size || "-"
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            value={item.product_color || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "product_color",
                                e.target.value,
                              )
                            }
                            className="text-xs w-20"
                            placeholder="Color"
                          />
                        ) : (
                          item.product_color || "-"
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            value={item.product_model || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "product_model",
                                e.target.value,
                              )
                            }
                            className="text-xs w-20"
                            placeholder="Model"
                          />
                        ) : (
                          item.product_model || "-"
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="text-xs w-16"
                            min="1"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unit_price",
                                Number(e.target.value),
                              )
                            }
                            className="text-xs w-20"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          `$${Number(item.unit_price).toFixed(2)}`
                        )}
                      </td>
                      <td className="py-1 px-2">
                        <div className="font-medium">
                          ${Number(item.total_price).toFixed(2)}
                        </div>
                        {item.is_outer_product && item.buying_price > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Profit: $
                            {(
                              item.total_price -
                              item.buying_price * item.quantity
                            ).toFixed(2)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-1 px-2 text-center text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-4">
            <div className="w-64 text-xs">
              <div className="flex justify-between py-1">
                <span className="font-semibold">Subtotal:</span>
                <span>${subtotalBeforeDiscount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="font-semibold">Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t border-gray-300">
                <span className="font-semibold">Total:</span>
                <span>${editedInvoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">Paid:</span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedInvoice.advance_payment}
                    onChange={(e) =>
                      handleInputChange(
                        "advance_payment",
                        Number(e.target.value),
                      )
                    }
                    className="text-xs w-20"
                    step="0.01"
                    min="0"
                  />
                ) : (
                  <span>${editedInvoice.advance_payment.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between py-1 border-t border-gray-300">
                <span className="font-bold">Balance Due:</span>
                <span className="font-bold">
                  ${editedInvoice.remaining_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs font-semibold text-gray-600">Notes</Label>
            {isEditing ? (
              <Input
                value={editedInvoice.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="text-xs mt-1"
                placeholder="Enter notes (e.g., Discount: 10)"
              />
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                {editedInvoice.notes || "No notes"}
              </p>
            )}
          </div>

          <div className="text-center text-[10px] text-gray-500 border-t pt-2">
            <p>Thank you for your business with SHAHJALAL LIGHTING</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Record Payment</DialogTitle>
            <DialogDescription className="text-xs">
              Add payment for Invoice #{invoice?.invoice_number} - Balance: $
              {invoice?.remaining_amount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="amount" className="text-right text-xs">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={invoice?.remaining_amount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3 text-xs"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="method" className="text-right text-xs">
                Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="col-span-3 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="notes" className="text-right text-xs">
                Notes
              </Label>
              <Input
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="col-span-3 text-xs"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPaymentOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={isSubmittingPayment}
              className="text-xs"
            >
              {isSubmittingPayment ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Initiate Return</DialogTitle>
            <DialogDescription className="text-xs">
              Process return for Invoice #{invoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <ReturnForm
            invoice={invoice}
            onSuccess={() => {
              setIsReturnDialogOpen(false);
              toast({
                title: "Return Processed",
                description: "Return request successfully created",
              });
            }}
            onCancel={() => setIsReturnDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
