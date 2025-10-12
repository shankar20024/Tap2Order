import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../../lib/mongodb';
import mongoose from 'mongoose';
import Order from '../../../models/Order';
import MenuItem from '../../../models/MenuItem';
import Table from '../../../models/Table';
import { DateTime } from 'luxon';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const table = searchParams.get('table');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');

    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    // Build date filter
    let dateFilter = {};
    let period = 30; // Default for chart generation
    
    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
      // Calculate period from date range for charts
      const start = new Date(startDate);
      const end = new Date(endDate);
      period = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    } else if (periodParam !== 'all') {
      // Period filter (7, 30, 90 days)
      period = parseInt(periodParam);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);
      dateFilter = {
        createdAt: { $gte: daysAgo }
      };
    } else {
      // All time - no date restriction, use 365 days for chart display
      period = 365;
    }

    // Build base match criteria
    let baseMatch = {
      userId: userId,
      ...dateFilter
    };

    // Add filters
    if (table && table !== 'all') {
      baseMatch.tableNumber = table;
    }
    if (status && status !== 'all') {
      baseMatch.status = status;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      baseMatch.paymentMethod = paymentMethod;
    }

    // Category filter requires menu item lookup
    let categoryMatch = {};
    if (category && category !== 'all') {
      const menuItems = await MenuItem.find({ 
        userId: userId, 
        category: category 
      }).select('_id');
      const menuItemIds = menuItems.map(item => item._id);
      categoryMatch = {
        'items.menuItemId': { $in: menuItemIds }
      };
    }

    const finalMatch = { ...baseMatch, ...categoryMatch };

    // Parallel data fetching for better performance
    const [
      totalOrders,
      completedOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      ordersByStatus,
      ordersByType,
      revenueByDay,
      ordersByDay,
      topMenuItems,
      menuItemsCount,
      tablesCount,
      averageOrderValue,
      peakHours,
      customerMetrics,
      paymentMethods,
      monthlyRevenue,
      ordersByTable
    ] = await Promise.all([
      // Total orders in period
      Order.countDocuments(finalMatch),
      
      // Completed orders in period
      Order.countDocuments({ ...finalMatch, status: 'completed' }),
      
      // Total revenue in period (served, completed, or paid orders)
      Order.aggregate([
        { $match: finalMatch },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Today's orders
      Order.countDocuments({ 
        userId, 
        createdAt: { 
          $gte: DateTime.now().startOf('day').toJSDate(),
          $lte: DateTime.now().endOf('day').toJSDate()
        }
      }),
      
      // Today's revenue
      Order.aggregate([
        { 
          $match: { 
            userId,
            createdAt: { 
              $gte: DateTime.now().startOf('day').toJSDate(),
              $lte: DateTime.now().endOf('day').toJSDate()
            }
          }
        },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Orders by status
      Order.aggregate([
        { $match: finalMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Orders by type (food vs beverages)
      Order.aggregate([
        { $match: finalMatch },
        { $group: { _id: '$orderType', count: { $sum: 1 } } }
      ]),
      
      // Revenue by day (last 30 days) - served, completed, or paid orders
      Order.aggregate([
        { $match: finalMatch },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Orders by day
      Order.aggregate([
        { $match: finalMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top menu items (served, completed, or paid orders)
      Order.aggregate([
        { $match: finalMatch },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          } 
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 }
      ]),
      
      // Menu items count
      MenuItem.countDocuments({ userId }),
      
      // Tables count
      Table.countDocuments({ userId }),
      
      // Average order value (served, completed, or paid orders)
      Order.aggregate([
        { $match: finalMatch },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          } 
        },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]),
      
      // Peak hours analysis (count all orders, revenue only from paid/served/completed)
      Order.aggregate([
        { $match: finalMatch },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
            revenue: { 
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $in: ['$status', ['served', 'completed']] },
                      { $eq: ['$paymentStatus', 'paid'] }
                    ]
                  },
                  '$totalAmount',
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Customer metrics (count all orders, revenue only from paid/served/completed)
      Order.aggregate([
        { $match: finalMatch },
        {
          $group: {
            _id: '$customerInfo.phone',
            orders: { $sum: 1 },
            totalSpent: { 
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $in: ['$status', ['served', 'completed']] },
                      { $eq: ['$paymentStatus', 'paid'] }
                    ]
                  },
                  '$totalAmount',
                  0
                ]
              }
            },
            lastOrder: { $max: '$createdAt' }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            repeatCustomers: { $sum: { $cond: [{ $gt: ['$orders', 1] }, 1, 0] } },
            avgOrdersPerCustomer: { $avg: '$orders' }
          }
        }
      ]),
      
      // Payment methods (served, completed, or paid orders)
      Order.aggregate([
        { $match: finalMatch },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          } 
        },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      
      // Monthly revenue - served, completed, or paid orders
      Order.aggregate([
        { 
          $match: periodParam === 'all' 
            ? { userId }
            : { 
                userId,
                createdAt: { $gte: DateTime.now().minus({ months: 12 }).toJSDate() }
              }
        },
        { 
          $match: {
            $or: [
              { status: { $in: ['served', 'completed'] } },
              { paymentStatus: 'paid' }
            ]
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      
      // Orders by table (count all orders, revenue only from paid/served/completed)
      Order.aggregate([
        { $match: finalMatch },
        { 
          $group: { 
            _id: '$tableNumber', 
            count: { $sum: 1 }, 
            revenue: { 
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $in: ['$status', ['served', 'completed']] },
                      { $eq: ['$paymentStatus', 'paid'] }
                    ]
                  },
                  '$totalAmount',
                  0
                ]
              }
            }
          } 
        },
        { $sort: { count: -1 } }
      ])
    ]);
    
    // Process and format the data
    const analytics = {
      // Key Performance Indicators
      kpis: {
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        averageOrderValue: averageOrderValue[0]?.avg || 0,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
        menuItemsCount,
        tablesCount
      },
      
      // Order Status Distribution
      orderStatus: {
        labels: ordersByStatus.length > 0 ? ordersByStatus.map(item => item._id) : ['No Data'],
        data: ordersByStatus.length > 0 ? ordersByStatus.map(item => item.count) : [1],
        colors: {
          pending: '#f59e0b',
          preparing: '#3b82f6',
          ready: '#10b981',
          served: '#8b5cf6',
          completed: '#059669',
          cancelled: '#ef4444',
          'No Data': '#9ca3af'
        }
      },
      
      // Order Type Distribution
      orderType: {
        labels: ordersByType.length > 0 ? ordersByType.map(item => item._id || 'Unknown') : ['No Data'],
        data: ordersByType.length > 0 ? ordersByType.map(item => item.count) : [1]
      },
      
      // Revenue Trends (Daily) - Only show dates with actual data
      revenueTrend: (() => {
        if (revenueByDay.length === 0) {
          return {
            labels: ['No Data'],
            datasets: [
              {
                label: 'Revenue (₹)',
                data: [0],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                tension: 0.4
              },
              {
                label: 'Orders',
                data: [0],
                borderColor: 'rgb(234, 88, 12)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                borderWidth: 3,
                tension: 0.4
              }
            ]
          };
        }
        
        // Show only dates that have data
        const dates = revenueByDay.map(item => 
          DateTime.fromISO(item._id).toFormat('MMM dd, yyyy')
        );
        const revenues = revenueByDay.map(item => item.revenue);
        const orders = revenueByDay.map(item => item.orders);
        
        return {
          labels: dates,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: revenues,
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: 'rgb(99, 102, 241)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              tension: 0.4,
              fill: true
            },
            {
              label: 'Orders',
              data: orders,
              borderColor: 'rgb(234, 88, 12)',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: 'rgb(234, 88, 12)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              tension: 0.4,
              fill: true
            }
          ]
        };
      })(),
      
      // Monthly Revenue (Bar Chart) - Only show months with actual data
      monthlyRevenue: (() => {
        if (monthlyRevenue.length === 0) {
          return { 
            labels: ['No Data'], 
            data: [0] 
          };
        }
        
        // Show only months that have data
        const months = monthlyRevenue.map(item => {
          return DateTime.fromObject({ 
            year: item._id.year, 
            month: item._id.month 
          }).toFormat('MMM yyyy');
        });
        const revenues = monthlyRevenue.map(item => item.revenue);
        
        return { 
          labels: months, 
          data: revenues 
        };
      })(),
      
      // Top Menu Items
      topMenuItems: topMenuItems.length > 0 ? topMenuItems.map(item => ({
        name: item._id,
        quantity: item.quantity,
        revenue: item.revenue
      })) : [{
        name: 'No Data',
        quantity: 0,
        revenue: 0
      }],
      
      // Peak Hours
      peakHours: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = peakHours.find(item => item._id === hour);
          return hourData ? hourData.count : 0;
        })
      },
      
      // Customer Analytics
      customers: {
        total: customerMetrics[0]?.totalCustomers || 0,
        repeat: customerMetrics[0]?.repeatCustomers || 0,
        avgOrdersPerCustomer: customerMetrics[0]?.avgOrdersPerCustomer || 0,
        retentionRate: customerMetrics[0]?.totalCustomers > 0 ? 
          ((customerMetrics[0]?.repeatCustomers / customerMetrics[0]?.totalCustomers) * 100).toFixed(1) : 0
      },
      
      // Payment Methods
      paymentMethods: {
        labels: paymentMethods.length > 0 ? paymentMethods.map(item => item._id) : ['No Data'],
        data: paymentMethods.length > 0 ? paymentMethods.map(item => item.count) : [1],
        revenue: paymentMethods.length > 0 ? paymentMethods.map(item => item.revenue) : [0]
      },
      
      // Table Performance
      tablePerformance: ordersByTable.length > 0 ? ordersByTable.map(item => ({
        table: item._id,
        orders: item.count,
        revenue: item.revenue
      })) : [{
        table: 'No Data',
        orders: 0,
        revenue: 0
      }],
      
      // Growth Metrics
      growth: {
        dailyGrowth: calculateGrowthRate(ordersByDay),
        revenueGrowth: calculateGrowthRate(revenueByDay, 'revenue')
      }
    };
    
    return NextResponse.json(analytics);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate growth rate
function calculateGrowthRate(data, field = 'count') {
  if (data.length < 2) return 0;
  
  const recent = data.slice(-7); // Last 7 days
  const previous = data.slice(-14, -7); // Previous 7 days
  
  const recentAvg = recent.reduce((sum, item) => sum + (item[field] || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, item) => sum + (item[field] || 0), 0) / previous.length;
  
  if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;
  
  return ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
}
