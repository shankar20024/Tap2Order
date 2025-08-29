import StatsCard from './StatsCard';
import {
  FaRupeeSign,
  FaUtensils,
  FaClock,
  FaFire,
  FaCheckCircle,
  FaBell,
  FaTable
} from 'react-icons/fa';

const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
    <StatsCard 
      title="Total Revenue" 
      value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} 
      icon={FaRupeeSign} 
      color="green" 
    />
    <StatsCard 
      title="Total Items" 
      value={stats.totalItems} 
      icon={FaUtensils} 
      color="blue" 
    />
    <StatsCard 
      title="Pending Items" 
      value={stats.pendingItems} 
      icon={FaClock} 
      color="amber" 
    />
    <StatsCard 
      title="Preparing Items" 
      value={stats.preparingItems} 
      icon={FaFire} 
      color="indigo" 
    />
    <StatsCard 
      title="Ready Items" 
      value={stats.readyItems} 
      icon={FaCheckCircle} 
      color="purple" 
    />
    <StatsCard 
      title="Served Items" 
      value={stats.servedItems} 
      icon={FaBell} 
      color="red" 
    />
    <StatsCard 
      title="Active Tables" 
      value={stats.activeTables} 
      icon={FaTable} 
      color="blue" 
    />
  </div>
);

export default DashboardStats;
