import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSignIcon, TrendingUpIcon } from 'lucide-react';
import type { ProjectCostSummary } from '../../../server/src/schema';

interface CostSummaryProps {
  costSummary: ProjectCostSummary | null;
}

export function CostSummary({ costSummary }: CostSummaryProps) {
  if (!costSummary) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Loading cost summary...</p>
        </CardContent>
      </Card>
    );
  }

  const { materials_cost, workers_cost, other_expenses_cost, total_cost } = costSummary;

  const costBreakdown = [
    { label: 'Materials', amount: materials_cost, color: 'bg-blue-500', percentage: (materials_cost / total_cost) * 100 },
    { label: 'Workers', amount: workers_cost, color: 'bg-green-500', percentage: (workers_cost / total_cost) * 100 },
    { label: 'Other Expenses', amount: other_expenses_cost, color: 'bg-purple-500', percentage: (other_expenses_cost / total_cost) * 100 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-5 h-5" />
            Cost Breakdown
          </CardTitle>
          <CardDescription>
            Total project cost: <span className="font-semibold text-lg">${total_cost.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {costBreakdown.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cost Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5" />
            Cost Analysis
          </CardTitle>
          <CardDescription>
            Detailed cost information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Materials</span>
                <span className="font-medium">${materials_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Workers</span>
                <span className="font-medium">${workers_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Expenses</span>
                <span className="font-medium">${other_expenses_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-lg border-t-2 border-gray-300">
                <span>Total Cost</span>
                <span>${total_cost.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Cost Distribution</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Materials: {((materials_cost / total_cost) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Workers: {((workers_cost / total_cost) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Other: {((other_expenses_cost / total_cost) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {costSummary.as_of_date && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Cost calculated as of: {costSummary.as_of_date.toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}