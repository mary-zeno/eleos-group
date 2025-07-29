import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const STATUS_KEYS = [
  'status.submitted',
  'status.inReview',
  'status.pendingInfo',
  'status.inProgress',
  'status.awaitingPayment',
  'status.completed',
  'status.onHold',
  'status.cancelled',
  'status.archived',
];

const getStatusColor = (statusKey) => {
  const colors = {
    'status.submitted': 'bg-blue-100 text-blue-800',
    'status.inReview': 'bg-yellow-100 text-yellow-800',
    'status.pendingInfo': 'bg-orange-100 text-orange-800',
    'status.inProgress': 'bg-purple-100 text-purple-800',
    'status.awaitingPayment': 'bg-red-100 text-red-800',
    'status.completed': 'bg-green-100 text-green-800',
    'status.onHold': 'bg-gray-100 text-gray-800',
    'status.cancelled': 'bg-red-100 text-red-800',
    'status.archived': 'bg-gray-100 text-gray-800',
  };
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const { t } = useTranslation();

  // For edit mode toggle
  const [isEditing, setIsEditing] = useState(false);
  const [requestsToDelete, setRequestsToDelete] = useState(new Set());
  const [statusChanges, setStatusChanges] = useState({});

  //for payment 
  const [invoiceUrl, setInvoiceUrl] = useState(null);

  useEffect(() => {
    const fetchUserAndData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserData(user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        setName('');
        setRole('user');
      } else {
        setName(profile.name || '');
        setRole(profile.role || 'user');
      }

      await fetchRequests(user, profile?.role || 'user');
    };

    fetchUserAndData();
  }, [navigate, user]);

  const fetchRequests = async (userData, role) => {
    if (!userData || !userData.id) return;

    setLoading(true);

    const tables = [
      { name: 'travel_forms', service: t('dashboard.tables.travel') },
      { name: 'business_setup_forms', service: t('dashboard.tables.business') },
      { name: 'property_interest_forms', service: t('dashboard.tables.property') },
    ];    

    let allRequests = [];

    for (const table of tables) {
      const query = supabase
        .from(table.name)
        .select('*')
        .order('inserted_at', { ascending: false });

      if (role !== 'admin') {
        query.eq('user_id', userData.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${table.name}:`, error.message);
      } else {
        const enriched = data.map((entry) => ({
          ...entry,
          service: table.service,
          tableName: table.name,
          status: 'status.submitted'
        }));
        allRequests = allRequests.concat(enriched);
      }
    }

    // Collect unique user_ids from allRequests
    const uniqueUserIds = [...new Set(allRequests.map((r) => r.user_id))];

    // Fetch profiles for these user ids
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', uniqueUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
    }

    // Map user_id to user name
    const userIdToName = {};
    profiles?.forEach((p) => {
      userIdToName[p.id] = p.name || t('fallback.noName');
    });

    // Add userName field to each request
    allRequests = allRequests.map((req) => ({
      ...req,
      userName: userIdToName[req.user_id] || t('fallback.unknown')
    }));

    // Fetch invoices for admin
    if (role === 'admin') {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('user_id, service_type, invoice_url');

      if (!invoicesError && invoicesData?.length) {
        const invoiceMap = {};
        invoicesData.forEach((inv) => {
          const key = `${inv.user_id}-${inv.service_type}`;
          invoiceMap[key] = inv.invoice_url;
        });
        allRequests = allRequests.map((req) => {
          const key = `${req.user_id}-${req.service}`;
          return {
            ...req,
            invoiceUrl: invoiceMap[key] || null,
          };
        });
      }
    }

    allRequests.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
    setRequests(allRequests);
    setLoading(false);
  };

  const toggleDeleteRequest = (id) => {
    setRequestsToDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleStatusChange = (id, newStatus) => {
    setStatusChanges((prev) => ({ ...prev, [id]: newStatus }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);

    // Delete marked requests
    for (const id of requestsToDelete) {
      const req = requests.find((r) => r.id === id);
      if (!req) continue;
      const { error } = await supabase.from(req.tableName).delete().eq('id', id);
      if (error) console.error('Delete error for id:', id, error.message);
    }

    // Update statuses
    for (const [id, newStatus] of Object.entries(statusChanges)) {
      if (requestsToDelete.has(id)) continue;

      const req = requests.find((r) => r.id === id);
      if (!req) continue;

      if (req.status === newStatus) continue;

      const { error } = await supabase
        .from(req.tableName)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) console.error('Update status error for id:', id, error.message);
    }

    // Refresh the requests from DB
    await fetchRequests(userData, role);

    // Reset editing state
    setIsEditing(false);
    setRequestsToDelete(new Set());
    setStatusChanges({});
    setLoading(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setRequestsToDelete(new Set());
    setStatusChanges({});
  };

  const toggleDetails = (idx) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('dashboard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>{t('dashboard.loggedInAs')}</strong> {name || user?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('dashboard.role')}</strong> {role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Controls */}
        {role === 'admin' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    {t('dashboard.editMode')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSaveChanges} disabled={loading}>
                      {t('dashboard.saveChanges')}
                    </Button>
                    <Button onClick={cancelEditing} variant="outline">
                      {t('dashboard.cancel')}
                    </Button>
                  </>
                )}
              </div>
              {isEditing && (
                <Alert className="mt-4">
                  <AlertDescription>
                    {t('dashboard.editActive')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.requestsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>{t('dashboard.loading')}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('dashboard.noRequests')}</p>
                <Button className="mt-4" onClick={() => navigate('/property-form')}>
                  {t('dashboard.submitFirst')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {role === 'admin' && isEditing && <TableHead>{t('dashboard.delete')}</TableHead>}
                    <TableHead>{t('dashboard.service')}</TableHead>
                    <TableHead>{t('dashboard.user')}</TableHead>
                    <TableHead>{t('dashboard.date')}</TableHead>
                    <TableHead>{t('dashboard.status')}</TableHead>
                    {role === 'admin' && <TableHead>{t('dashboard.payments')}</TableHead>}
                    <TableHead>{t('dashboard.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req, idx) => {
                    const isDeleted = requestsToDelete.has(req.id);
                    const currentStatus = statusChanges[req.id] || req.status;

                    return (
                      <React.Fragment key={req.id}>
                        <TableRow className={isDeleted ? 'opacity-50 line-through' : ''}>
                          {role === 'admin' && isEditing && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDeleteRequest(req.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ❌
                              </Button>
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant="outline">{req.service}</Badge>
                          </TableCell>
                          <TableCell>{role === 'admin' ? req.userName : 'You'}</TableCell>
                          <TableCell>{new Date(req.inserted_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {role === 'admin' && isEditing ? (
                              <Select
                                value={currentStatus}
                                onValueChange={(value) => handleStatusChange(req.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_KEYS.map((key) => (
                                    <SelectItem key={key} value={t(key)}>
                                      {t(key)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getStatusColor(currentStatus)}>
                                {t(currentStatus)}
                              </Badge>
                            )}
                          </TableCell>
                          {role === 'admin' && (
                            <TableCell className="py-2 px-4">
                              {req.invoiceUrl ? (
                                <Button
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => setInvoiceUrl(req.invoiceUrl)}
                                >
                                  {t('dashboard.viewInvoice')}
                                </Button>
                              ) : (
                                isEditing && (
                                  <Button
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => navigate('/admin/payment', { state: { request: req } })}
                                  >
                                    {t('dashboard.createInvoice')}
                                  </Button>
                                )
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-2xl"
                              onClick={() => toggleDetails(idx)}
                            >
                              {expandedIdx === idx ? '▴' : '▾'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedIdx === idx && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={role === 'admin' && isEditing ? 6 : 5}>
                              <div className="p-4 space-y-2">
                                <h4 className="font-medium mb-2">{t('dashboard.requestDetails')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {Object.entries(req).map(([key, value]) =>
                                    !['id', 'user_id', 'inserted_at', 'service', 'status', 'tableName', 'userName'].includes(key) && (
                                      <div key={key} className="flex">
                                        <span className="font-medium mr-2 min-w-0 flex-shrink-0">
                                          {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                                        </span>
                                        <span className="text-gray-600 break-words">
                                          {String(value) || 'N/A'}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {invoiceUrl && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-4 rounded-lg max-w-3xl w-full relative">
                  <button
                    className="absolute top-2 right-2 text-white bg-red-600 px-2 py-1 rounded"
                    onClick={() => setInvoiceUrl(null)}
                  >
                    {t('dashboard.close')}
                  </button>
                  <iframe src={invoiceUrl} width="100%" height="600px" title="Invoice PDF" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}