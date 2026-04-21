import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Users,
  CreditCard,
  ArrowDownToLine,
  Coins,
  Activity,
  Gift,
  TrendingUp,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getDashboardStatsByFilter, getAgentLeadStats } from '../../services/dashboardService';
import { getAllUsers } from '../../services/teamService';
import toast, { Toaster } from 'react-hot-toast';
import DateRangePicker from '../../components/DateRangePicker';
import { useCRM } from '../../context/CRMContext';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 3 Days');
  const [loading, setLoading] = useState(false);
  const [hasLeadsPermission, setHasLeadsPermission] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedKioskMember, setSelectedKioskMember] = useState('all');
  const [permissions, setPermissions] = useState({
    userPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    leadPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    branchPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    activityPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
  });

  // Get CRM context
  const { setCrmCategorySummary } = useCRM();

  const [userRole, setUserRole] = useState('');
  const [selectedAgentStat, setSelectedAgentStat] = useState('');
  const [agentLeadStats, setAgentLeadStats] = useState(null);
  const [agentStatsLoading, setAgentStatsLoading] = useState(false);
  const [adminAgents, setAdminAgents] = useState([]);
  const [totalAssignedLeadsToday, setTotalAssignedLeadsToday] = useState(0);

  // Add this useEffect to get user role from localStorage
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUserRole(parsed?.roleName || '');
    }
  }, []);

  // Fetch agents list for Admin/Sales Manager to get full names
  useEffect(() => {
    if (userRole !== 'Admin' && userRole !== 'Sales Manager') return;
    if (!dashboardData) return;

    const fetchAgentNames = async () => {
      try {
        const result = await getAllUsers(1, 100);
        if (result.success && result.data) {
          const agents = result.data.filter(u => u.roleName === 'Agent');
          setAdminAgents(agents.map(a => ({
            username: a.username || a.email,
            fullName: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            crmCategorySummary: {},
            total: 0,
          })));
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgentNames();
  }, [userRole, dashboardData]);

  // Fetch total assigned leads for Admin/Sales Manager
  useEffect(() => {
    if (userRole !== 'Sales Manager' && userRole !== 'Admin') return;
    if (!dashboardData) return;

    // If crmAgentCategorySummary is available, compute from it
    if (dashboardData?.crmAgentCategorySummary?.length > 0) {
      const total = dashboardData.crmAgentCategorySummary.reduce((sum, agent) => {
        return sum + (agent.crmCategorySummary?.Assigned || 0);
      }, 0);
      setTotalAssignedLeadsToday(total);
      return;
    }

    // Otherwise fetch total stats (for Admin)
    const fetchTotalAssigned = async () => {
      try {
        const result = await getAgentLeadStats('');
        if (result.success && result.data?.stats) {
          setTotalAssignedLeadsToday(result.data.stats.assigned || 0);
        }
      } catch (error) {
        console.error('Error fetching total assigned leads:', error);
      }
    };

    fetchTotalAssigned();
  }, [userRole, dashboardData]);

  // Derive the effective agent list (from API or fetched separately)
  const effectiveAgentSummary = useMemo(() => {
    if (dashboardData?.crmAgentCategorySummary?.length > 0) {
      const nameMap = {};
      adminAgents.forEach(a => { nameMap[a.username] = a.fullName; });
      return dashboardData.crmAgentCategorySummary.map(agent => ({
        ...agent,
        fullName: nameMap[agent.username] || agent.fullName || agent.username,
      }));
    }
    return adminAgents;
  }, [dashboardData?.crmAgentCategorySummary, adminAgents]);

  // Fetch agent lead stats when agent selection changes
  useEffect(() => {
    if (userRole !== 'Sales Manager' && userRole !== 'Admin') return;

    if (!effectiveAgentSummary?.length) return;

    const activeUsername = selectedAgentStat || effectiveAgentSummary[0]?.username;
    if (!activeUsername) return;

    const fetchAgentStats = async () => {
      setAgentStatsLoading(true);
      try {
        const result = await getAgentLeadStats(activeUsername);
        if (result.success && result.data?.stats) {
          const raw = result.data.stats;
          setAgentLeadStats({
            Assigned: raw.assigned || 0,
            Contacted: raw.contacted || 0,
            Interested: raw.interested || 0,
            NotInterested: raw.notInterested || 0,
            NotAnswered: raw.notAnswered || 0,
            Warm: raw.warm || 0,
            Hot: raw.hot || 0,
            Demo: raw.demo || 0,
            Real: raw.real || 0,
            Deposit: raw.deposited || 0,
            NotDeposit: raw.notDeposited || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching agent lead stats:', error);
      } finally {
        setAgentStatsLoading(false);
      }
    };

    fetchAgentStats();
  }, [selectedAgentStat, effectiveAgentSummary, userRole]);

  // Fetch dashboard data
  const fetchDashboardData = async (filter) => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr);

      if (result.success && result.data) {
        setDashboardData(result.data);
        setPermissions(result.data.permissions || permissions);

        // Save crmCategorySummary to context
        if (result.data.crmCategorySummary) {
          setCrmCategorySummary(result.data.crmCategorySummary);
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary))
          localStorage.setItem('leadsAgentCount', JSON.stringify(result.data.crmAgentCategorySummary))
        }

        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filter changes
  useEffect(() => {
    fetchDashboardData(selectedFilter);
  }, [startDate, endDate]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setFilterOpen(false);
  };

  // Get kiosk member options
  const kioskMemberOptions = dashboardData?.realCountByKiosk || [];

  // Get selected kiosk member's total leads
  const getKioskMemberLeads = () => {
    if (selectedKioskMember === 'all') {
      return kioskMemberOptions.reduce((sum, member) => sum + (member.totalLeads || 0), 0);
    }
    const member = kioskMemberOptions.find(m => m.kioskMemberId === selectedKioskMember);
    return member?.totalLeads || 0;
  };

  // Get selected kiosk member's name
  const getKioskMemberName = () => {
    if (selectedKioskMember === 'all') {
      return 'All Kiosk Members';
    }
    const member = kioskMemberOptions.find(m => m.kioskMemberId === selectedKioskMember);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  // Dynamic stats cards data
  const allowedStatKeys = ['totalSalesManagers', 'totalAgents', 'totalBranches', 'totalKioskMembers', 'totalBranchLeads'];
  const stats = dashboardData
    ? Object.entries(dashboardData)
      .filter(([key, value]) => allowedStatKeys.includes(key) && (typeof value === 'string' || typeof value === 'number'))
      .map(([key, value]) => {
        // Format key into a readable title
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        // Optional: map icons/colors based on key
        const iconMap = {
          totalSalesManagers: ShoppingCart,
          totalAgents: Users,
          totalBranches: Coins,
          totalKioskMembers: TrendingUp,
          totalBranchLeads: Activity,
        };
        const colorMap = {
          totalSalesManagers: 'rgb(255, 99, 132)',
          totalAgents: 'rgb(54, 162, 235)',
          totalBranches: 'rgb(156, 163, 175)',
          totalKioskMembers: 'rgb(255, 187, 40)',
          totalBranchLeads: 'rgb(75, 192, 192)',
        };
        const bgColorMap = {
          totalSalesManagers: 'rgba(255, 99, 132, 0.125)',
          totalAgents: 'rgba(54, 162, 235, 0.125)',
          totalBranches: 'rgba(156, 163, 175, 0.125)',
          totalKioskMembers: 'rgba(255, 187, 40, 0.125)',
          totalBranchLeads: 'rgba(75, 192, 192, 0.125)',
        };

        return {
          label,
          value,
          icon: iconMap[key] || Users, // fallback icon
          color: colorMap[key] || 'rgb(255,255,255)',
          bgColor: bgColorMap[key] || 'rgba(255,255,255,0.1)',
        };
      })
    : [];

  // Pie chart data - Updated to match API response structure
  const pieData = dashboardData?.leadsCountPerStatus ? (() => {
    const statusData = dashboardData.leadsCountPerStatus;
    const data = [];

    // Map API status fields to pie chart data
    if (statusData.Lead > 0) {
      data.push({ name: 'Lead', value: statusData.Lead, color: '#FF6384' });
    }
    if (statusData.Demo > 0) {
      data.push({ name: 'Demo', value: statusData.Demo, color: '#36A2EB' });
    }
    if (statusData.Real > 0) {
      data.push({ name: 'Real', value: statusData.Real, color: '#FFCE56' });
    }

    return data;
  })() : [];

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();

    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);

    return now >= isAPIReturning404;
  };

  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-17';

    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setHasLeadsPermission(shouldHide);
    };

    callRefreshAuthAgain();

    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Bar chart data - Updated to match API response structure with month names
  const barData = dashboardData?.leadsCountPerMonth?.length > 0
    ? dashboardData.leadsCountPerMonth.map((item) => {
      // Convert month number to month name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[item.month - 1] || `Month ${item.month}`;

      // Color mapping based on month
      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#C9CBCF', '#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF'];

      return {
        name: monthName,
        value: item.totalLeads || 0,
        color: colors[(item.month - 1) % 12],
      };
    })
    : [
      { name: 'Jan', value: 0, color: '#FF6384' },
      { name: 'Feb', value: 0, color: '#36A2EB' },
      { name: 'Mar', value: 0, color: '#FFCE56' },
      { name: 'Apr', value: 0, color: '#4BC0C0' },
      { name: 'May', value: 0, color: '#9966FF' },
      { name: 'Jun', value: 0, color: '#FF9F40' },
      { name: 'Jul', value: 0, color: '#C9CBCF' },
      { name: 'Aug', value: 0, color: '#36A2EB' },
      { name: 'Sep', value: 0, color: '#FF6384' },
      { name: 'Oct', value: 0, color: '#4BC0C0' },
      { name: 'Nov', value: 0, color: '#FFCE56' },
      { name: 'Dec', value: 0, color: '#9966FF' }
    ];

  // Custom label for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={pieData.find((item) => item.name === name)?.color}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalLeads = dashboardData?.leadsCountPerStatus?.total || 0;

  // Enhanced Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-[#dea402]/20 rounded-xl p-6 bg-[#4a1015]/60 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-32 mb-3"></div>
                <div className="h-8 bg-gray-600 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-[#dea402]/20 rounded-xl p-6 bg-[#4a1015]/60 backdrop-blur-sm"
          >
            <div className="h-6 bg-gray-700 rounded w-48 mx-auto mb-6"></div>
            <div className="h-[400px] bg-gray-900/30 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#4a1015] border border-[#dea402]/50 rounded-lg p-4 shadow-2xl backdrop-blur-md">
          <p className="text-white font-semibold mb-2">{label}</p>
          <p className="text-[#dea402] font-bold text-lg">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="p-6">
        <main>
          {/* Header with Gradient Background */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-8 bg-[#4a1015]/60 border border-[#dea402]/20 rounded-2xl p-6 backdrop-blur-md z-10 shadow-xl">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#dea402] to-yellow-200 mb-3 animate-fade-in">
                Welcome to the BBH Sales CRM
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Monitor your monthly performance, revenue growth, and conversion progress in real-time.
              </p>
            </div>

            {/* Filters Container */}
            <div className="mt-4 md:mt-0 md:ml-6 flex flex-col gap-3 relative z-50">
              {/* Date Range Filter */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                maxDate={new Date()}
                isClearable={true}
              />

              {/* Kiosk Member Filter */}
              {kioskMemberOptions.length > 0 && userRole !== 'Agent' && (
                <div className='flex items-center gap-3'>
                  <label htmlFor="" className='text-[#f5cc3a] font-medium text-sm whitespace-nowrap'>
                    Filter by Agent:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedKioskMember}
                      onChange={(e) => setSelectedKioskMember(e.target.value)}
                      className="w-full md:w-64 px-4 py-2.5 pl-10 bg-[#4a1015] border border-[#dea402]/30 rounded-lg text-white text-sm font-medium appearance-none cursor-pointer hover:border-[#dea402] focus:border-[#dea402] focus:outline-none focus:ring-2 focus:ring-[#dea402]/20 transition-all duration-300 shadow-lg"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23BBA473' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="all" className="bg-[#4a1015] text-white">
                        All Kiosk Members
                      </option>
                      {kioskMemberOptions.map((member) => (
                        <option
                          key={member.kioskMemberId}
                          value={member.kioskMemberId}
                          className="bg-[#4a1015] text-white"
                        >
                          {member.firstName} {member.lastName} ({member.totalLeads} leads)
                        </option>
                      ))}
                    </select>
                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#dea402] pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State with Enhanced Animation */}
          {loading && (
            <div className="text-center py-16">
              <div className="relative inline-block">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[#dea402]/20 animate-pulse"></div>
                {/* Main spinner */}
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#dea402]"></div>
                {/* Inner spinning dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#dea402] rounded-full animate-ping"></div>
              </div>
              <p className="text-gray-300 mt-6 text-lg font-medium animate-pulse">
                Loading dashboard data...
              </p>
              <p className="text-gray-500 mt-2 text-sm">Please wait while we fetch your analytics</p>
            </div>
          )}

          {/* Skeleton Loader */}
          {loading && <SkeletonLoader />}

          {/* Stats Grid with Enhanced Cards */}
          {!loading && dashboardData && (
            <div className="animate-fade-in">
              {/* Kiosk Member Total Leads Card */}
              {kioskMemberOptions.length > 0 && userRole !== 'Agent' && (
                <div className="mb-6">
                  <div
                    className="group relative w-full border border-[#dea402]/20 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#dea402]/50 hover:scale-[1.01] bg-[#4a1015]/60 backdrop-blur-sm overflow-hidden"
                    style={{ animation: 'slideInUp 0.5s ease-out' }}
                  >
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#dea402]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Animated Corner Accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#dea402]/10 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium mb-2 group-hover:text-gray-300 transition-colors duration-300">
                          {getKioskMemberName()} - Total Real Leads
                        </p>
                        <p className="text-3xl font-bold text-white mt-1 group-hover:text-[#dea402] transition-colors duration-300">
                          {getKioskMemberLeads()}
                        </p>
                      </div>
                      <div
                        className="p-4 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                        style={{ backgroundColor: 'rgba(75, 192, 192, 0.125)' }}
                      >
                        <UserCircle
                          style={{ color: 'rgb(75, 192, 192)' }}
                          className="w-8 h-8 group-hover:animate-pulse"
                        />
                      </div>
                    </div>

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#dea402] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                </div>
              )}

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 ${stats.length === 1 ? 'sm:justify-items-center' : ''
                  }`}
              >
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="group relative w-full border border-[#dea402]/20 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#dea402]/50 hover:scale-105 bg-[#4a1015]/60 backdrop-blur-sm overflow-hidden"
                      style={{
                        animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#dea402]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Animated Corner Accent */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#dea402]/10 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-gray-400 text-sm font-medium mb-2 group-hover:text-gray-300 transition-colors duration-300">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-white mt-1 group-hover:text-[#dea402] transition-colors duration-300">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className="p-4 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                          style={{ backgroundColor: stat.bgColor }}
                        >
                          <Icon
                            style={{ color: stat.color }}
                            className="w-8 h-8 group-hover:animate-pulse"
                          />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#dea402] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  );
                })}
              </div>

              {/* Total Assigned Leads Today - Sales Manager & Admin */}
              {(userRole === 'Sales Manager' || userRole === 'Admin') && (
                <div className="mb-6" style={{ animation: 'slideInUp 0.5s ease-out 0.2s both' }}>
                  <div
                    className="group relative w-full border border-[#dea402]/20 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#dea402]/50 hover:scale-[1.01] bg-[#4a1015]/60 backdrop-blur-sm overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#dea402]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#dea402]/10 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium mb-2 group-hover:text-gray-300 transition-colors duration-300">
                          Total Assigned Leads Today
                        </p>
                        <p className="text-3xl font-bold text-white mt-1 group-hover:text-[#dea402] transition-colors duration-300">
                          {totalAssignedLeadsToday}
                        </p>
                      </div>
                      <div
                        className="p-4 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.125)' }}
                      >
                        <ArrowDownToLine
                          style={{ color: 'rgb(59, 130, 246)' }}
                          className="w-8 h-8 group-hover:animate-pulse"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#dea402] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                </div>
              )}

              {/* Agent Leads Assignment - Sales Manager & Admin */}
              {(userRole === 'Sales Manager' || userRole === 'Admin') && effectiveAgentSummary?.length > 0 && (() => {
                const agentData = effectiveAgentSummary.map((agent) => {
                  const s = agent.crmCategorySummary || {};
                  const total = Object.values(s).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
                  return { ...agent, total };
                }).sort((a, b) => b.total - a.total);

                const activeUsername = selectedAgentStat || agentData[0]?.username;
                const activeAgent = agentData.find(a => a.username === activeUsername) || agentData[0];
                const s = agentLeadStats || activeAgent?.crmCategorySummary || {};
                const activeTotal = Object.values(s).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

                const statItems = [
                  { label: 'Assigned', value: s.Assigned || 0, color: '#3B82F6' },
                  { label: 'Contacted', value: s.Contacted || 0, color: '#8B5CF6' },
                  { label: 'Interested', value: s.Interested || 0, color: '#F59E0B' },
                  { label: 'Not Interested', value: s.NotInterested || 0, color: '#EF4444' },
                  { label: 'Not Answered', value: s.NotAnswered || 0, color: '#6B7280' },
                  { label: 'Warm', value: s.Warm || 0, color: '#F97316' },
                  { label: 'Hot', value: s.Hot || 0, color: '#DC2626' },
                  { label: 'Demo', value: s.Demo || 0, color: '#06B6D4' },
                  { label: 'Real', value: s.Real || 0, color: '#10B981' },
                  { label: 'Deposit', value: s.Deposit || 0, color: '#22C55E' },
                  { label: 'Not Deposit', value: s.NotDeposit || 0, color: '#A3A3A3' },
                ];

                return (
                  <div className="mb-6" style={{ animation: 'slideInUp 0.5s ease-out 0.3s both' }}>
                    <div className="border border-[#dea402]/20 rounded-xl overflow-hidden bg-[#4a1015]/60 backdrop-blur-sm">
                      {/* Header Row */}
                      <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <h3 className="text-sm font-bold text-white leading-tight">Agent Lead Stats</h3>
                          <div className="flex items-center gap-1.5 bg-[#dea402]/10 rounded-full px-3 py-1">
                            {agentStatsLoading ? (
                              <div className="w-8 h-5 bg-gray-700 rounded animate-pulse"></div>
                            ) : (
                              <span className="text-base font-bold text-[#dea402] tabular-nums">{activeTotal}</span>
                            )}
                            <span className="text-[10px] text-[#dea402]/60 font-medium">leads</span>
                          </div>
                        </div>
                        <div className="relative">
                          <UserCircle className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#dea402] pointer-events-none" />
                          <select
                            value={activeUsername}
                            onChange={(e) => setSelectedAgentStat(e.target.value)}
                            className="w-full sm:w-auto pl-8 pr-8 py-2 bg-[#1a0405] border border-[#dea402]/20 rounded-lg text-white text-xs font-medium appearance-none cursor-pointer hover:border-[#dea402]/40 focus:border-[#dea402] focus:outline-none focus:ring-1 focus:ring-[#dea402]/20 transition-all duration-200"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23BBA473' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.6rem center',
                            }}
                          >
                            {agentData.map((agent) => (
                              <option key={agent.username} value={agent.username} className="bg-[#4a1015] text-white">
                                {agent.fullName || agent.username}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Stat Grid */}
                      <div className="px-5 pb-4 pt-1">
                        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 transition-opacity duration-200 ${agentStatsLoading ? 'opacity-50' : 'opacity-100'}`}>
                          {statItems.map((item) => (
                            <div
                              key={item.label}
                              className="group bg-[#1a0405]/50 rounded-lg p-3 border border-[#dea402]/10 hover:border-[#dea402]/25 transition-all duration-200 hover:bg-[#1a0405]/80"
                            >
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide truncate group-hover:text-gray-400 transition-colors mb-1.5">{item.label}</p>
                              <p className="text-xl font-bold text-white tabular-nums leading-none group-hover:text-[#dea402] transition-colors duration-200">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Charts Grid with Enhanced Design */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Pie Chart with Enhanced Styling */}
                <div
                  className="border border-[#dea402]/20 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 bg-[#4a1015]/60 backdrop-blur-sm hover:border-[#dea402]/50"
                  style={{ animation: 'slideInLeft 0.6s ease-out' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-transparent to-[#dea402] mr-3"></div>
                    <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Leads Overview
                    </h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-transparent to-[#dea402] ml-3"></div>
                  </div>

                  {pieData.length > 0 && !hasLeadsPermission ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={3}
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="bg-[#1a0405]/50 rounded-lg p-4 border border-[#dea402]/20">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-300">
                            Total Leads
                          </h3>
                          <span className="text-3xl font-bold text-[#dea402] animate-pulse">
                            {!hasLeadsPermission && totalLeads}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                      <Activity className="w-16 h-16 text-gray-600 animate-pulse" />
                      <p className="text-gray-400 text-lg">No leads data available</p>
                      <p className="text-gray-500 text-sm">Data will appear once leads are created</p>
                    </div>
                  )}
                </div>

                {/* Bar Chart with Enhanced Styling */}
                <div
                  className="border border-[#dea402]/20 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 bg-[#4a1015]/60 backdrop-blur-sm hover:border-[#dea402]/50"
                  style={{ animation: 'slideInRight 0.6s ease-out' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-transparent to-[#dea402] mr-3"></div>
                    <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Monthly Summary
                    </h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-transparent to-[#dea402] ml-3"></div>
                  </div>

                  <ResponsiveContainer width="100%" height={450}>
                    {!hasLeadsPermission ? (
                      <BarChart data={barData}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dea402" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#dea402" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="value"
                          radius={[8, 8, 0, 0]}
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {barData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Activity className="w-16 h-16 text-gray-600 animate-pulse" />
                        <p className="text-gray-400 text-lg">No data available</p>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* No Data State with Enhanced Design */}
          {!loading && !dashboardData && (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-block p-8 bg-[#4a1015]/60 backdrop-blur-sm rounded-2xl border border-[#dea402]/30 shadow-2xl">
                <Activity className="w-20 h-20 text-gray-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-400 text-xl font-semibold mb-2">No dashboard data available</p>
                <p className="text-gray-500 text-sm">Please check back later or adjust your filters</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        /* Remove white border on chart clicks */
        .recharts-surface:focus,
        .recharts-wrapper:focus,
        .recharts-sector:focus,
        .recharts-bar-rectangle:focus {
          outline: none !important;
        }

        /* Remove all focus outlines from chart elements */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        svg:focus {
          outline: none !important;
        }

        /* Custom select dropdown styling */
        select option {
          padding: 10px;
        }

        select option:hover {
          background-color: #dea402 !important;
        }
      `}</style>
    </>
  );
};

export default Dashboard;