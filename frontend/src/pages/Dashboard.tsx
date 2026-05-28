import { useAuth } from '@/context/AuthContext';
import FarmerDashboard from './FarmerDashboard';
import RetailerDashboard from './RetailerDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'farmer') return <FarmerDashboard />;
  return <RetailerDashboard />;
};

export default Dashboard;
