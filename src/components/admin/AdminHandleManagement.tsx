import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminReservedHandles } from './handles/AdminReservedHandles';
import { AdminClaimedHandles } from './handles/AdminClaimedHandles';
import { AdminHandleAuditLog } from './handles/AdminHandleAuditLog';
import { AtSign } from 'lucide-react';

export function AdminHandleManagement() {
  const [activeTab, setActiveTab] = useState('reserved');
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E2FF6D20' }}>
          <AtSign className="h-5 w-5" style={{ color: '#E2FF6D' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Handle Management</h2>
          <p className="text-sm text-muted-foreground">Reserved handles, claimed handles, and audit log</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reserved">Reserved Handles</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Handles</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="reserved">
          <AdminReservedHandles key={`reserved-${refreshKey}`} onAction={triggerRefresh} />
        </TabsContent>
        <TabsContent value="claimed">
          <AdminClaimedHandles key={`claimed-${refreshKey}`} onAction={triggerRefresh} />
        </TabsContent>
        <TabsContent value="audit">
          <AdminHandleAuditLog key={`audit-${refreshKey}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
