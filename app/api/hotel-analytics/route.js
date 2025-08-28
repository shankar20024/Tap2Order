import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../../lib/mongodb';
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
    const period = parseInt(searchParams.get('period')) || 30;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const table = searchParams.get('table');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');

    const userId = session.user.id;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);
      dateFilter = {
        createdAt: { $gte: daysAgo }
      };
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
      
      // Total revenue in period
      Order.aggregate([
        { $match: { ...finalMatch, status: 'completed' } },
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
            status: 'completed',
            createdAt: { 
              $gte: DateTime.now().startOf('day').toJSDate(),
              $lte: DateTime.now().endOf('day').toJSDate()
            }
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
      
      // Revenue by day (last 30 days)
      Order.aggregate([
        { $match: { ...finalMatch, status: 'completed' } },
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
      
      // Top menu items
      Order.aggregate([
        { $match: { ...finalMatch, status: 'completed' } },
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
      
      // Average order value
      Order.aggregate([
        { $match: { ...finalMatch, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]),
      
      // Peak hours analysis
      Order.aggregate([
        { $match: finalMatch },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Customer metrics
      Order.aggregate([
        { $match: finalMatch },
        {
          $group: {
            _id: '$customerInfo.phone',
            orders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
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
      
      // Payment methods
      Order.aggregate([
        { $match: { ...finalMatch, status: 'completed' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      
      // Monthly revenue (last 12 months)
      Order.aggregate([
        { 
          $match: { 
            userId, 
            status: 'completed',
            createdAt: { $gte: DateTime.now().minus({ months: 12 }).toJSDate() }
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
      
      // Orders by table
      Order.aggregate([
        { $match: finalMatch },
        { $group: { _id: '$tableNumber', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
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
      
      // Revenue Trends (Daily)
      revenueTrend: {
        labels: revenueByDay.length > 0 ? revenueByDay.map(item => DateTime.fromISO(item._id).toFormat('MMM dd')) : ['No Data'],
        datasets: [
          {
            label: 'Revenue',
            data: revenueByDay.length > 0 ? revenueByDay.map(item => item.revenue) : [0],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)'
          },
          {
            label: 'Orders',
            data: revenueByDay.length > 0 ? revenueByDay.map(item => item.orders) : [0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }
        ]
      },
      
      // Monthly Revenue (Bar Chart)
      monthlyRevenue: {
        labels: monthlyRevenue.length > 0 ? monthlyRevenue.map(item => 
          DateTime.fromObject({ year: item._id.year, month: item._id.month }).toFormat('MMM yyyy')
        ) : ['No Data'],
        data: monthlyRevenue.length > 0 ? monthlyRevenue.map(item => item.revenue) : [0]
      },
      
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
