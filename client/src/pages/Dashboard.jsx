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
    'status.submitted': 'bg-blue-900 text-blue-200 border-blue-700',
    'status.inReview': 'bg-yellow-900 text-yellow-200 border-yellow-700',
    'status.pendingInfo': 'bg-orange-900 text-orange-200 border-orange-700',
    'status.inProgress': 'bg-purple-900 text-purple-200 border-purple-700',
    'status.awaitingPayment': 'bg-red-900 text-red-200 border-red-700',
    'status.completed': 'bg-green-900 text-green-200 border-green-700',
    'status.onHold': 'bg-gray-700 text-gray-200 border-gray-600',
    'status.cancelled': 'bg-red-900 text-red-200 border-red-700',
    'status.archived': 'bg-gray-700 text-gray-200 border-gray-600',
  };
  return colors[statusKey] || 'bg-gray-700 text-gray-200 border-gray-600';
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
  const [currentInvoicePaypalLink, setCurrentInvoicePaypalLink] = useState(null);

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

    // First, get all service requests from the service tables
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
          status: entry.status || 'status.submitted'
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

    // Now fetch invoices and match them to requests using service_uuid
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('user_id, service_type, service_uuid, invoice_url, paypal_link, amount_owed');

    if (!invoicesError && invoicesData?.length) {
      const invoiceMap = {};
      invoicesData.forEach((inv) => {
        const key = `${inv.user_id}-${inv.service_type}-${inv.service_uuid}`;
        invoiceMap[key] = {
          invoice_url: inv.invoice_url,
          paypal_link: inv.paypal_link,
          amount_owed: inv.amount_owed
        };
      });
      
      allRequests = allRequests.map((req) => {
        const key = `${req.user_id}-${req.service}-${req.id}`;
        const invoiceData = invoiceMap[key];
        return {
          ...req,
          invoiceUrl: invoiceData?.invoice_url || null,
          paypalLink: invoiceData?.paypal_link || null,
          amount_owed: invoiceData?.amount_owed || null,
        };
      });
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

      if (error) {
        console.error('Update status error for id:', id, error.message);
        continue;
      } 

      // Send email for "Awaiting Payment"
      if (newStatus === 'status.awaitingPayment') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', req.user_id)
          .single();

        const email = profile?.email;
        const name = profile?.name;

        if (email && name) {
          await fetch('https://tykawjmgbuuywiddcrxw.supabase.co/functions/v1/send-payment-email', { //url for supabase edge function
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              // supabase anon (public) key
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5a2F3am1nYnV1eXdpZGRjcnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjY0NDIsImV4cCI6MjA2NjU0MjQ0Mn0.rlE6H5-Vf4CkIt5BNJuSVFDzREw77z-sac63OKx50FI' 
            },
            body: JSON.stringify({
              to: email,
              userName: name,
              serviceType: req.service
            })
          });
          if (!response.ok) {
          console.error('Failed to send email:', await response.text());
          }
        }
      }
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
    <div className="min-h-screen bg-charcoal-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{t('dashboard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300">
                  <strong>{t('dashboard.loggedInAs')}</strong> {name || user?.email}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>{t('dashboard.role')}</strong> {role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Controls */}
        {role === 'admin' && (
          <Card className="bg-charcoal-900 border-charcoal-800">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-black"
                  >
                    {t('dashboard.editMode')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={loading}
                      className="bg-accent hover:bg-accent/90 text-black"
                    >
                      {t('dashboard.saveChanges')}
                    </Button>
                    <Button 
                      onClick={cancelEditing} 
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {t('dashboard.cancel')}
                    </Button>
                  </>
                )}
              </div>
              {isEditing && (
                <Alert className="mt-4 bg-accent/10 border-accent/30">
                  <AlertDescription className="text-accent">
                    {t('dashboard.editActive')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requests Table */}
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-white">{t('dashboard.requestsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-300">{t('dashboard.loading')}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">{t('dashboard.noRequests')}</p>
                <Button 
                  className="mt-4 bg-accent hover:bg-accent/90 text-black" 
                  onClick={() => navigate('/property-form')}
                >
                  {t('dashboard.submitFirst')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-charcoal-700 hover:bg-charcoal-800/50">
                      {role === 'admin' && isEditing && <TableHead className="text-gray-300">{t('dashboard.delete')}</TableHead>}
                      <TableHead className="text-gray-300">{t('dashboard.service')}</TableHead>
                      <TableHead className="text-gray-300">{t('dashboard.user')}</TableHead>
                      <TableHead className="text-gray-300">{t('dashboard.date')}</TableHead>
                      <TableHead className="text-gray-300">{t('dashboard.status')}</TableHead>
                      <TableHead className="text-gray-300">{t('dashboard.payments')}</TableHead>
                      <TableHead className="text-gray-300">{t('dashboard.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req, idx) => {
                      const isDeleted = requestsToDelete.has(req.id);
                      const currentStatus = statusChanges[req.id] || req.status;

                      return (
                        <React.Fragment key={req.id}>
                          <TableRow className={`border-charcoal-700 hover:bg-charcoal-800/50 ${isDeleted ? 'opacity-50 line-through' : ''}`}>
                            {role === 'admin' && isEditing && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDeleteRequest(req.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  ❌
                                </Button>
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant="outline" className="border-accent/50 text-accent">
                                {req.service}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {role === 'admin' ? req.userName : 'You'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {new Date(req.inserted_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {role === 'admin' && isEditing ? (
                                <Select
                                  value={currentStatus}
                                  onValueChange={(value) => handleStatusChange(req.id, value)}
                                >
                                  <SelectTrigger className="w-40 bg-charcoal-800 border-charcoal-700 text-white">
                                    <SelectValue>{t(currentStatus)}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-charcoal-800 border-charcoal-700">
                                    {STATUS_KEYS.map((key) => (
                                      <SelectItem 
                                        key={key} 
                                        value={key}
                                        className="text-white hover:bg-charcoal-700"
                                      >
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
                            <TableCell className="py-2 px-4">
                              {req.invoiceUrl ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="text-xs border-accent/50 text-accent hover:bg-accent hover:text-black"
                                    onClick={() => {
                                      setInvoiceUrl(req.invoiceUrl);
                                      setCurrentInvoicePaypalLink(req.paypalLink);
                                    }}
                                  >
                                    {t('dashboard.viewInvoice')}
                                  </Button>
                                  
                                </div>
                              ) : (
                                role === 'admin' && isEditing && (
                                  <Button
                                    variant="outline"
                                    className="text-xs border-accent/50 text-accent hover:bg-accent hover:text-black"
                                    onClick={() => navigate('/admin/payment', { state: { request: req } })}
                                  >
                                    {t('dashboard.createInvoice')}
                                  </Button>
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-2xl text-gray-400 hover:text-white hover:bg-charcoal-800"
                                onClick={() => toggleDetails(idx)}
                              >
                                {expandedIdx === idx ? '▴' : '▾'}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedIdx === idx && (
                            <TableRow className="bg-charcoal-800/50 border-charcoal-700">
                              <TableCell colSpan={role === 'admin' && isEditing ? 7 : 6}>
                                <div className="p-4 space-y-2">
                                  <h4 className="font-medium mb-2 text-white">{t('dashboard.requestDetails')}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {Object.entries(req).map(([key, value]) =>
                                      !['id', 'user_id', 'inserted_at', 'service', 'status', 'tableName', 'userName'].includes(key) && (
                                        <div key={key} className="flex">
                                          <span className="font-medium mr-2 min-w-0 flex-shrink-0 text-gray-300">
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                                          </span>
                                          <span className="text-gray-400 break-words">
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
              </div>
            )}
            {invoiceUrl && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-700 p-4 rounded-lg max-w-3xl w-full relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      {currentInvoicePaypalLink && role !== 'admin' && (
                        <Button
                          variant="outline"
                          className="border-green-500/50 text-green-400 hover:bg-green-500 hover:text-black"
                          onClick={() => window.open(currentInvoicePaypalLink, '_blank')}
                        >
                          Make Payment
                        </Button>
                      )}
                    </div>
                    <button
                      className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                      onClick={() => {
                        setInvoiceUrl(null);
                        setCurrentInvoicePaypalLink(null);
                      }}
                    >
                      {t('dashboard.close')}
                    </button>
                  </div>
                  <iframe src={invoiceUrl} width="100%" height="600px" title="Invoice PDF" className="rounded" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
