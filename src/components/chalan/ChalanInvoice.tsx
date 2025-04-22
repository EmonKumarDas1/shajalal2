import { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { usePDF } from "react-to-pdf";
import { Link } from "react-router-dom";

type ChalanItem = {
  id: string;
  chalan_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
};

type Chalan = {
  id: string;
  chalan_number: string;
  created_at: string;
  shop_id: string;
  shop_name?: string;
  status: "pending" | "delivered" | "cancelled";
  notes?: string;
};

type Shop = {
  id: string;
  name: string;
  address: string;
  phone: string;
};

interface ChalanInvoiceProps {
  chalanId: string;
  isDownloadMode?: boolean;
}

export function ChalanInvoice({
  chalanId,
  isDownloadMode,
}: ChalanInvoiceProps) {
  const [chalan, setChalan] = useState<Chalan | null>(null);
  const [chalanItems, setChalanItems] = useState<ChalanItem[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const { toPDF, targetRef } = usePDF({
    filename: `chalan-${chalanId}.pdf`,
    options: {
      // Optimize PDF size
      compress: true,
      // Ensure content fits on one page
      scale: 0.8,
    },
  });

  useEffect(() => {
    if (chalanId) {
      fetchChalanDetails();
    }
  }, [chalanId]);

  // Auto-download in download mode
  useEffect(() => {
    if (isDownloadMode && !loading && chalan) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        toPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isDownloadMode, loading, chalan, toPDF]);

  async function fetchChalanDetails() {
    try {
      setLoading(true);

      // Fetch chalan details
      const { data: chalanData, error: chalanError } = await supabase
        .from("chalans")
        .select("*")
        .eq("id", chalanId)
        .single();

      if (chalanError) throw chalanError;
      setChalan(chalanData);

      // Fetch shop details
      if (chalanData.shop_id) {
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", chalanData.shop_id)
          .single();

        if (shopError) throw shopError;
        setShop(shopData);
      }

      // Fetch chalan items
      const { data: itemsData, error: itemsError } = await supabase
        .from("chalan_items")
        .select("*")
        .eq("chalan_id", chalanId);

      if (itemsError) throw itemsError;
      setChalanItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching chalan details:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chalan) {
    return (
      <div className="text-center py-10 text-gray-500">
        Chalan not found or has been deleted.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isDownloadMode && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/chalans">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Chalans
              </Link>
            </Button>
            <h2 className="text-2xl font-bold ml-2">Chalan Invoice</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => toPDF()}
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Print-specific styles */}
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        `}
      </style>

      <div
        ref={targetRef}
        className="bg-white p-6 rounded-lg shadow-sm print:shadow-none print:p-0"
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CHALAN</h1>
            <p className="text-gray-600 mt-1">
              #{chalan.chalan_number || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">
              ElectroShop ERP
            </h2>
            <p className="text-sm text-gray-600">123 Business Street</p>
            <p className="text-sm text-gray-600">City, State 12345</p>
            <p className="text-sm text-gray-600">Phone: (123) 456-7890</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-600 font-medium text-sm mb-1">
              Delivery To:
            </h3>
            <p className="font-semibold text-gray-900">{shop?.name || "N/A"}</p>
            <p className="text-sm text-gray-600">{shop?.address || "N/A"}</p>
            <p className="text-sm text-gray-600">{shop?.phone || "N/A"}</p>
          </div>
          <div className="text-right">
            <h3 className="text-gray-600 font-medium text-sm mb-1">
              Chalan Details:
            </h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Chalan Date:</span>{" "}
              {chalan.created_at
                ? format(new Date(chalan.created_at), "MMMM dd, yyyy")
                : "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`${chalan.status === "delivered" ? "text-green-600" : chalan.status === "cancelled" ? "text-red-600" : "text-yellow-600"}`}
              >
                {chalan.status.charAt(0).toUpperCase() + chalan.status.slice(1)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  No.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chalanItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-2 text-center text-sm text-gray-500"
                  >
                    No items in this chalan
                  </td>
                </tr>
              ) : (
                chalanItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {chalan.notes && (
          <div className="mt-6">
            <h3 className="text-gray-600 font-medium text-sm mb-1">Notes:</h3>
            <p className="text-sm text-gray-600 border p-2 rounded-md bg-gray-50">
              {chalan.notes}
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prepared By:</p>
              <p className="mt-6 border-t border-gray-300 pt-1 w-40">
                Signature
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Received By:</p>
              <p className="mt-6 border-t border-gray-300 pt-1 w-40">
                Signature
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            This is a computer-generated document. No signature is required.
          </p>
          <p>
            © {new Date().getFullYear()} ElectroShop ERP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
