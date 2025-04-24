import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";

export function ChalanTable() {
  // Sample data - in a real app, this would come from your database
  const chalans = [
    {
      id: "CH001",
      date: "2023-07-15",
      customer: "ABC Company",
      items: 5,
      status: "Delivered",
      invoiced: true,
    },
    {
      id: "CH002",
      date: "2023-07-16",
      customer: "XYZ Corporation",
      items: 3,
      status: "In Transit",
      invoiced: false,
    },
    {
      id: "CH003",
      date: "2023-07-17",
      customer: "123 Industries",
      items: 8,
      status: "Pending",
      invoiced: false,
    },
  ];

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chalan ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoiced</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chalans.map((chalan) => (
            <TableRow key={chalan.id}>
              <TableCell className="font-medium">{chalan.id}</TableCell>
              <TableCell>{chalan.date}</TableCell>
              <TableCell>{chalan.customer}</TableCell>
              <TableCell>{chalan.items}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(chalan.status)}`}
                >
                  {chalan.status}
                </span>
              </TableCell>
              <TableCell>{chalan.invoiced ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {!chalan.invoiced && (
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "In Transit":
      return "bg-blue-100 text-blue-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
