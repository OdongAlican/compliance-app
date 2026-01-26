import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';

const Dashboard = () => {
  const [recentActivity] = useState([
    {
      id: 1,
      icon: 'hazard',
      title: 'Wet floor reported',
      location: 'Building A',
      time: '2 hours ago'
    },
    {
      id: 2,
      icon: 'assessment',
      title: 'Risk Assessment completed',
      location: 'Building A',
      time: '2 hours ago'
    }
  ]);

  const MetricCard = ({ icon: Icon, title, value, change, trend }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-green-600 text-sm mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {change}
          </p>
        </div>
        <div className="bg-blue-100 p-3 rounded">{Icon && <Icon className="w-6 h-6 text-blue-600" />}</div>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome Back Paul, here is your overview for today</p>
      </div>

      {/* Inspections Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Inspections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon={AlertCircle}
            title="Total Reports"
            value="200"
            change="12% from last month"
          />
          <MetricCard
            icon={CheckCircle}
            title="Resolved Issues"
            value="200"
            change="12% resolution rate"
          />
          <MetricCard
            icon={Clock}
            title="In Progress"
            value="200"
            change="12% from last month"
          />
        </div>
      </div>

      {/* Hazard & Risk Management Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hazard & Risk Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={AlertCircle}
            title="Open Reports"
            value="200"
            change="12% from last month"
          />
          <MetricCard
            icon={CheckCircle}
            title="Resolved Issues"
            value="200"
            change="12% resolution rate"
          />
          <MetricCard
            icon={Clock}
            title="In Progress"
            value="200"
            change="12% from last month"
          />
          <MetricCard
            icon={Activity}
            title="Assessments"
            value="200"
            change="12% from last month"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hazard Report</h3>
            <p className="text-gray-600 text-sm mb-6">Report a new safety hazard or concern in your workplace</p>
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded w-full">
              Create Report
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Assessment</h3>
            <p className="text-gray-600 text-sm mb-6">Conduct a comprehensive health and safety risk assessment</p>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded w-full">
              Start Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center p-6 border-b last:border-b-0 hover:bg-gray-50">
              <div className="mr-4">
                {activity.icon === 'hazard' ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <Activity className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{activity.title}</p>
                <p className="text-gray-600 text-sm">{activity.location} · {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
