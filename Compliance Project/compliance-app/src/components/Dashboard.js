{/*import React from 'react'
import { Navbar } from './Navbar';

export const Dashboard = ({sidebarToggle, setSidebarToggle}) => {
  return (
  <div className={`${sidebarToggle ? "" : " ml-64 "}w-full`}>
      <Navbar
      sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}
      />
    </div>
  )
}*/}
import { useNavigate } from 'react-router-dom';
export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    </div>
  );
}