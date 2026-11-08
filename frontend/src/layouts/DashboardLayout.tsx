import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavigation } from './TopNavigation';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <TopNavigation />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300">
        <Outlet />
      </main>
    </div>
  );
};
