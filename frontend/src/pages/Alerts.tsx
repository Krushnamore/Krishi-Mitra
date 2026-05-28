import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, Bell, TrendingUp, Package, AlertTriangle, XCircle, CalendarX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  getProducts, 
  generateAlerts,
  type Product,
  type Alert
} from '@/lib/api';

const Alerts = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const productsData = await getProducts(token!);
      setProducts(productsData);
      const alertsData = generateAlerts(productsData);
      setAlerts(alertsData);

      // Show notification if there are critical alerts
      const outOfStockAlerts = alertsData.filter(a => a.type === 'out_of_stock');
      const lowStockAlerts = alertsData.filter(a => a.type === 'low_stock');
      const totalCritical = outOfStockAlerts.length + lowStockAlerts.length;
      
      if (totalCritical > 0) {
        let description = '';
        if (outOfStockAlerts.length > 0 && lowStockAlerts.length > 0) {
          description = `🚫 ${outOfStockAlerts.length} out of stock | ⚠️ ${lowStockAlerts.length} low stock - Immediate attention required!`;
        } else if (outOfStockAlerts.length > 0) {
          description = `🚫 ${outOfStockAlerts.length} product(s) are out of stock - Order immediately!`;
        } else {
          description = `⚠️ ${lowStockAlerts.length} product(s) are low on stock - Reorder soon!`;
        }
        
        toast({
          title: "⚠️ Critical Inventory Alerts",
          description: description,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading alerts",
        description: "Failed to load alert data. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const lowStockAlerts = alerts.filter(a => a.type === 'low_stock');
  const outOfStockAlerts = alerts.filter(a => a.type === 'out_of_stock');
  const optimalAlerts = alerts.filter(a => a.type === 'optimal');
  const expiredAlerts = alerts.filter(a => a.type === 'expired');
  const expiringAlerts = alerts.filter(a => a.type === 'expiring');

  // Calculate insights
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const avgStock = products.length > 0 ? Math.round(totalStock / products.length) : 0;
  const criticalCount = lowStockAlerts.length + outOfStockAlerts.length;
  const outOfStockCount = outOfStockAlerts.length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Bell className="h-4 w-4" />
            Real-time Monitoring
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Alerts & Insights
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay informed with intelligent alerts and actionable insights for your inventory
          </p>
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="mt-4"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Alerts
          </Button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            <p className="text-xs text-red-700">Out of Stock</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{lowStockAlerts.length}</p>
            <p className="text-xs text-orange-700">Low Stock</p>
          </div>
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2">
              <CalendarX className="h-5 w-5 text-rose-700" />
            </div>
            <p className="text-2xl font-bold text-rose-700">{expiredAlerts.length}</p>
            <p className="text-xs text-rose-700">Expired</p>
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{expiringAlerts.length}</p>
            <p className="text-xs text-amber-700">Expiring Soon</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-600">{optimalAlerts.length}</p>
            <p className="text-xs text-green-700">Optimal</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            <p className="text-xs text-blue-700">Total Products</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-border">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Products Yet</h3>
            <p className="text-muted-foreground mb-6">Add products to your inventory to see alerts and insights</p>
            <Button variant="default" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* Alert Categories */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12" style={{gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"}}>
              {/* Out of Stock Alerts */}
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-3">
                  <XCircle className="h-6 w-6 pulse-animation" />
                  <h2 className="font-display text-lg font-bold">Out of Stock</h2>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {outOfStockAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No out of stock alerts</p>
                  ) : (
                    outOfStockAlerts.map((alert, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🚫</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-800">{alert.productName}</h4>
                            <p className="text-sm text-red-600 mt-1">
                              Stock: {alert.currentStock} units | Required: {alert.minStockLevel} units minimum
                            </p>
                            <p className="text-xs text-red-500 mt-2">{alert.message}</p>
                            <div className="mt-3 p-2 bg-red-100 rounded border border-red-200">
                              <p className="text-xs font-semibold text-red-800 mb-1">💡 Suggested Action:</p>
                              <p className="text-xs text-red-700">
                                Order at least {(alert.minStockLevel || 10) * 2} units immediately to prevent sales loss. 
                                Consider fast-track delivery options.
                              </p>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-bold">
                                Urgent Action Required
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="bg-orange-500 text-white px-6 py-4 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 pulse-animation" />
                  <h2 className="font-display text-lg font-bold">Low Stock Alerts</h2>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {lowStockAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No low stock alerts</p>
                  ) : (
                    lowStockAlerts.map((alert, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">⚠️</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-orange-800">{alert.productName}</h4>
                            <p className="text-sm text-orange-600 mt-1">
                              Stock: {alert.currentStock} units | Min Level: {alert.minStockLevel} units
                            </p>
                            <p className="text-xs text-orange-500 mt-2">{alert.message}</p>
                            <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-200">
                              <p className="text-xs font-semibold text-orange-800 mb-1">💡 Suggested Action:</p>
                              <p className="text-xs text-orange-700">
                                Reorder {Math.max((alert.minStockLevel || 10) * 2 - alert.currentStock, alert.minStockLevel || 10)} units 
                                to reach optimal stock level. Estimated time to stock out: 3-5 days.
                              </p>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                Action Required
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expired Products */}
              {expiredAlerts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
                  <div className="bg-rose-700 text-white px-6 py-4 flex items-center gap-3">
                    <CalendarX className="h-6 w-6" />
                    <h2 className="font-display text-lg font-bold">Expired Products</h2>
                    <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{expiredAlerts.length}</span>
                  </div>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {expiredAlerts.map((alert, index) => (
                      <div key={index} className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🗑️</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-rose-900">{alert.productName}</h4>
                            <p className="text-sm text-rose-700 mt-1">
                              Stock: {alert.currentStock} units
                            </p>
                            <p className="text-xs text-rose-600 mt-2 font-medium">{alert.message}</p>
                            <div className="mt-3 p-2 bg-rose-100 rounded border border-rose-200">
                              <p className="text-xs font-semibold text-rose-900 mb-1">⚠️ Action Required:</p>
                              <p className="text-xs text-rose-800">
                                Remove expired stock immediately. Check storage conditions and contact supplier for replacement.
                              </p>
                            </div>
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-rose-200 text-rose-900 text-xs rounded-full font-bold">
                                Remove Immediately
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring Soon */}
              {expiringAlerts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                  <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
                    <Clock className="h-6 w-6" />
                    <h2 className="font-display text-lg font-bold">Expiring Soon</h2>
                    <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{expiringAlerts.length}</span>
                  </div>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {expiringAlerts.map((alert, index) => (
                      <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">⏰</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-900">{alert.productName}</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Stock: {alert.currentStock} units
                              {alert.expiryDate && (
                                <span className="ml-2 text-amber-600">
                                  • Expires: {new Date(alert.expiryDate).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-amber-600 mt-2 font-medium">{alert.message}</p>
                            <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-200">
                              <p className="text-xs font-semibold text-amber-900 mb-1">💡 Suggested Action:</p>
                              <p className="text-xs text-amber-800">
                                Offer discount to sell quickly. Move to front shelf. Avoid reordering until current stock clears.
                              </p>
                            </div>
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-amber-200 text-amber-900 text-xs rounded-full font-bold">
                                Sell Quickly
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimal Stock */}
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="bg-green-500 text-white px-6 py-4 flex items-center gap-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h2 className="font-display text-lg font-bold">Optimal Stock</h2>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {optimalAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No products at optimal level</p>
                  ) : (
                    optimalAlerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✅</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-800">{alert.productName}</h4>
                            <p className="text-sm text-green-600 mt-1">
                              Stock: {alert.currentStock} units
                            </p>
                            <p className="text-xs text-green-500 mt-2">{alert.message}</p>
                            <div className="mt-3 flex gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Well Balanced
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {optimalAlerts.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground">
                      +{optimalAlerts.length - 5} more products at optimal level
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-border p-8">
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                AI-Powered Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-3">📈 Inventory Overview</h3>
                  <p className="text-sm text-blue-700">
                    You have {products.length} products with an average stock of {avgStock} units. 
                    {outOfStockCount > 0 && ` ${outOfStockCount} product(s) are completely out of stock!`}
                    {lowStockAlerts.length > 0 && ` ${lowStockAlerts.length} product(s) need restocking soon.`}
                  </p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-purple-800 mb-3">🎯 Optimization Score</h3>
                  <p className="text-sm text-purple-700">
                    Your inventory optimization score is{' '}
                    <strong>{Math.round((optimalAlerts.length / Math.max(products.length, 1)) * 100)}%</strong>.
                    {optimalAlerts.length === products.length 
                      ? ' Perfect! All products are optimally stocked.' 
                      : ` You can improve by addressing ${criticalCount} alert(s).`}
                  </p>
                </div>
                {outOfStockCount > 0 && (
                  <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                    <h3 className="font-semibold text-red-800 mb-3">🚫 Out of Stock Crisis</h3>
                    <p className="text-sm text-red-700">
                      {outOfStockCount} product(s) are completely out of stock! This is causing immediate sales loss. 
                      Place emergency orders and consider alternative suppliers for faster delivery.
                    </p>
                  </div>
                )}
                {criticalCount > 0 && (
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <h3 className="font-semibold text-orange-800 mb-3">⚠️ Urgent Actions</h3>
                    <p className="text-sm text-orange-700">
                      {criticalCount} product(s) require immediate attention. Review the suggested reorder quantities above 
                      and place orders within 24-48 hours to prevent stockouts and maintain customer satisfaction.
                    </p>
                  </div>
                )}
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-green-800 mb-3">💡 Smart Recommendation</h3>
                  <p className="text-sm text-green-700">
                    {outOfStockCount > 0 
                      ? `Priority: Restock out-of-stock items immediately. Then address low stock items to prevent future stockouts.`
                      : criticalCount > 0
                      ? `Focus on restocking low-stock items first. Set up automated reorder notifications for better management.`
                      : optimalAlerts.length === products.length
                      ? 'Excellent inventory management! Continue monitoring to maintain these optimal levels.'
                      : 'Review stock levels regularly and set appropriate min/max thresholds for better control.'}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-animation {
          animation: pulse-animation 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

export default Alerts;