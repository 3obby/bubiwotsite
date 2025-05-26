import React, { useState, useEffect, useCallback } from 'react';

interface Transaction {
  id: string;
  transactionType: string;
  amount: string | number;
  balanceBefore: string | number;
  balanceAfter: string | number;
  createdAt: string;
  metadata?: unknown;
}

interface TransactionHistoryProps {
  userId?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50,
    hasNext: false,
    hasPrev: false,
  });
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchTransactions = useCallback(async (page: number = 1, type: string = 'all') => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: '50',
      });
      
      if (type !== 'all') {
        params.append('type', type);
      }
      
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setTransactionTypes(data.transactionTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions(1, selectedType);
  }, [fetchTransactions, selectedType]);

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage, selectedType);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    fetchTransactions(1, type);
  };

  const handleExportCSV = async () => {
    if (!userId) return;
    
    try {
      const params = new URLSearchParams({
        userId,
        export: 'csv',
      });
      
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${userId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const openDetailsModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00000000' : num.toFixed(8);
  };

  const getAmountColor = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num > 0) return 'text-green-600';
    if (num < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🔑</div>
        <div className="text-sm font-medium">Please log in to view transactions</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {transactionTypes.map(type => (
              <option key={type} value={type}>
                {formatTransactionType(type)}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date/Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Balance</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-sm font-medium">No transactions found</div>
                    <div className="text-xs mt-1">Your transaction history will appear here</div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDetailsModal(transaction)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {formatTransactionType(transaction.transactionType)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-medium ${getAmountColor(transaction.amount)}`}>
                      {parseFloat(formatAmount(transaction.amount)) >= 0 ? '+' : ''}¤{formatAmount(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-700">
                      ¤{formatAmount(transaction.balanceAfter)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailsModal(transaction);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {transactions.length} of {pagination.totalCount} transactions
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Transaction Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <div className="text-sm font-mono text-gray-800">{selectedTransaction.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="text-sm text-gray-800">{formatTransactionType(selectedTransaction.transactionType)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <div className={`text-sm font-mono font-medium ${getAmountColor(selectedTransaction.amount)}`}>
                      {parseFloat(formatAmount(selectedTransaction.amount)) >= 0 ? '+' : ''}¤{formatAmount(selectedTransaction.amount)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <div className="text-sm text-gray-800">
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Balance Before</label>
                    <div className="text-sm font-mono text-gray-800">¤{formatAmount(selectedTransaction.balanceBefore)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Balance After</label>
                    <div className="text-sm font-mono text-gray-800">¤{formatAmount(selectedTransaction.balanceAfter)}</div>
                  </div>
                </div>
                
                {selectedTransaction.metadata != null && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Metadata</label>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 