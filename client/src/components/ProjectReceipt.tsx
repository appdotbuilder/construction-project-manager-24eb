import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PrinterIcon, DownloadIcon, ReceiptIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Receipt } from '../../../server/src/schema';

interface ProjectReceiptProps {
  projectId: number;
}

export function ProjectReceipt({ projectId }: ProjectReceiptProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReceipt = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const receiptData = await trpc.generateProjectReceipt.query({ project_id: projectId });
      setReceipt(receiptData);
    } catch (err) {
      console.error('Failed to generate receipt:', err);
      setError('Failed to generate receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    generateReceipt();
  }, [generateReceipt]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // STUB: In a real implementation, this would generate a PDF
    alert('PDF download functionality would be implemented here. For now, you can use the print function.');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'in_progress':
        return 'destructive' as const;
      case 'on_hold':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'on_hold':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ReceiptIcon className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Generating receipt...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={generateReceipt}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!receipt) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No receipt data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Receipt</h2>
          <p className="text-gray-600 mt-1">
            Generated on {receipt.generated_at.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={generateReceipt}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏗️ Construction Receipt</h1>
              <p className="text-gray-600">Project Completion Summary</p>
            </div>

            {/* Project Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {receipt.project.name}
                  </div>
                  {receipt.project.description && (
                    <div>
                      <span className="font-medium">Description:</span> {receipt.project.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <Badge variant={getStatusBadgeVariant(receipt.project.status)} className={getStatusColor(receipt.project.status)}>
                      {receipt.project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Start Date:</span> {receipt.project.start_date.toLocaleDateString()}
                  </div>
                  {receipt.project.end_date && (
                    <div>
                      <span className="font-medium">End Date:</span> {receipt.project.end_date.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Cost Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span>${receipt.cost_summary.materials_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor:</span>
                    <span>${receipt.cost_summary.workers_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Expenses:</span>
                    <span>${receipt.cost_summary.other_expenses_cost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${receipt.cost_summary.total_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Detailed Breakdown */}
            <div className="space-y-6">
              {/* Materials */}
              {receipt.materials.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Materials ({receipt.materials.length} items)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Quantity</th>
                          <th className="text-right py-2">Unit Price</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.materials.map((material, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{material.name} ({material.unit})</td>
                            <td className="text-right py-2">{material.quantity}</td>
                            <td className="text-right py-2">${material.price_per_unit.toFixed(2)}</td>
                            <td className="text-right py-2">
                              ${(material.quantity * material.price_per_unit).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Workers */}
              {receipt.workers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Labor ({receipt.workers.length} workers)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Worker</th>
                          <th className="text-right py-2">Days Worked</th>
                          <th className="text-right py-2">Daily Rate</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.workers.map((worker, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{worker.name}</td>
                            <td className="text-right py-2">{worker.days_worked}</td>
                            <td className="text-right py-2">${worker.daily_pay_rate.toFixed(2)}</td>
                            <td className="text-right py-2">
                              ${(worker.days_worked * worker.daily_pay_rate).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Other Expenses */}
              {receipt.other_expenses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Other Expenses ({receipt.other_expenses.length} items)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Expense</th>
                          <th className="text-left py-2">Description</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.other_expenses.map((expense, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{expense.name}</td>
                            <td className="py-2">{expense.description || '-'}</td>
                            <td className="text-right py-2">${expense.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>Thank you for choosing our construction services!</p>
              <p>Receipt generated on {receipt.generated_at.toLocaleDateString()} at {receipt.generated_at.toLocaleTimeString()}</p>
              <p className="font-mono text-xs">Receipt ID: {receipt.project.id}-{receipt.generated_at.getTime()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}