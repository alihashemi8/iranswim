import React from 'react';
import { SupportTicketsView } from '../common/SupportTicketsView';

export const AdminSupportPage = () => {
  return (
    <div className="space-y-6">
      <SupportTicketsView roleName="مدیر آموزشگاه" roleColor="sky" />
    </div>
  );
};
