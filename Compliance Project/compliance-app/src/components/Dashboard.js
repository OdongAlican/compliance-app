import React from "react";
import {
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Reports",
      value: 200,
      change: 12,
      color: "bg-yellow-100 text-yellow-800",
      icon: ClipboardDocumentListIcon,
    },
    {
      title: "Resolved Issues",
      value: 200,
      change: 12,
      color: "bg-green-100 text-green-800",
      icon: CheckCircleIcon,
    },
    {
      title: "In Progress",
      value: 200,
      change: 12,
      color: "bg-blue-100 text-blue-800",
      icon: ClockIcon,
    },
    {
      title: "Open Reports",
      value: 200,
      change: 12,
      color: "bg-red-100 text-red-800",
      icon: ExclamationTriangleIcon,
    },
    {
      title: "Completed Assessments",
      value: 200,
      change: 12,
      color: "bg-purple-100 text-purple-800",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      title: "Assessment In Progress",
      value: 200,
      change: 12,
      color: "bg-indigo-100 text-indigo-800",
      icon: ShieldCheckIcon,
    },

    {
  title: "Pending Reviews",
  value: 200,
  change: 12,
  color: "bg-teal-100 text-teal-800",
  icon: ClipboardDocumentListIcon,
}

  ];

  const activities = [
    {
      text: "Wet floor reported in Building A",
      time: "2 hours ago",
      user: "Paul Ameshah",
    },
    {
      text: "Risk Assessment completed in Building A",
      time: "2 hours ago",
      user: "Paul Ameshah",
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Welcome Back Paul, here is your overview for today
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Report Hazard
        </button>
      </div>

      {/* Top Stats */}
      <h3 className="text-lg font-bold mb-4">Inspections</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.slice(0, 3).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`shadow rounded p-4 flex items-center space-x-4 ${stat.color}`}
            >
              <Icon className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">{stat.title}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm">↑ {stat.change}% from last month</p>
              </div>
            </div>
          );
        })}
      </div>


       {/* Hazard & Risk Management + Action Cards */}
      <h3 className="text-lg font-bold mb-4">Hazard & Risk Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-stretch">
        {/* Left column: 2x2 grid for stats */}
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(3).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`shadow rounded p-4 flex flex-col ${stat.color}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">{stat.title}</h3>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm">↑ {stat.change}% resolution rate</p>
              </div>
            );
          })}
        </div>

     




        {/* Middle column: Hazard Report */}
        <div className="bg-red-100 text-red-800 shadow rounded p-4 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-700" />
            <h3 className="text-lg font-semibold">Hazard Report</h3>
          </div>
          <p className="mb-4">
            Report a hazard or potential risk of concern in your workplace
          </p>
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-40">
            Create Report
          </button>
        </div>

        {/* Right column: Risk Assessment */}
        <div className="bg-blue-100 text-blue-800 shadow rounded p-4 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheckIcon className="h-6 w-6 text-blue-700" />
            <h3 className="text-lg font-semibold">Risk Assessment</h3>
          </div>
          <p className="mb-4">Conduct a comprehensive risk assessment</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-40">
            Start Assessment
          </button>
        </div>
      </div>

      {/* Recent Activity */}
         <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="bg-white shadow rounded p-4">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-500 mt-1" />
              <span className="w-1 h-12 border-l border-gray-300"></span>
              <div>
                <p className="text-gray-800 font-medium">{activity.text}</p>
                <p className="text-sm text-gray-500">
                  {activity.time} by {activity.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
