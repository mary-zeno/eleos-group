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
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import RequestTableCard from '@/components/RequestTableCard';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [requests, setRequests] = useState({ active: [], inactive: [] });
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const { t } = useTranslation();

  // For edit mode toggle
  const [isEditing, setIsEditing] = useState(false);
  const [requestsToDelete, setRequestsToDelete] = useState(new Set());
  const [statusChanges, setStatusChanges] = useState({});

  //for payment 
  const [invoiceUrl, setInvoiceUrl] = useState(null);

  // User contact info modal
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
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
      .select('id, user_id, service_type, service_uuid, invoice_url, paypal_link, amount_owed');

    if (!invoicesError && invoicesData?.length) {
      const invoiceMap = {};
      invoicesData.forEach((inv) => {
        const key = `${inv.user_id}-${inv.service_type}-${inv.service_uuid}`;
        invoiceMap[key] = {
          invoice_id: inv.id,
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
          invoiceId: invoiceData?.invoice_id || null,
          invoiceUrl: invoiceData?.invoice_url || null,
          paypalLink: invoiceData?.paypal_link || null,
          amount_owed: invoiceData?.amount_owed || null,
        };
      });
    }

    allRequests.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
    setRequests(allRequests);

    // Set all requests (not splitting into active/inactive for now)
    setRequests(allRequests);
    //splitting active/inactive
    const inactiveStatuses = ['status.completed', 'status.cancelled', 'status.archived'];
    const activeRequests = allRequests.filter(req => !inactiveStatuses.includes(req.status));
    const inactiveRequests = allRequests.filter(req => inactiveStatuses.includes(req.status));
    setRequests({ active: activeRequests, inactive: inactiveRequests });
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
          try {
            const response = await fetch('https://tykawjmgbuuywiddcrxw.supabase.co/functions/v1/send-payment-email', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                to: email,
                userName: name,
                serviceType: req.service
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to send email:', errorText);
            }
          } catch (err) {
            console.error('Error sending email:', err);
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


  const openUserModal = async (userId) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user profile:', error.message);
      return;
    }

    setSelectedUserProfile(profile);
    setIsUserModalOpen(true);
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
            ) : (!requests || requests.length === 0) ? (
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
              <>
                <RequestTableCard
                  title={t("dashboard.activeRequests")}
                  requests={requests.active}
                  role={role}
                  isEditing={isEditing}
                  requestsToDelete={requestsToDelete}
                  toggleDeleteRequest={toggleDeleteRequest}
                  statusChanges={statusChanges}
                  handleStatusChange={handleStatusChange}
                  toggleDetails={toggleDetails}
                  expandedIdx={expandedIdx}
                  openUserModal={openUserModal}
                  setInvoiceUrl={setInvoiceUrl}
                  setCurrentInvoicePaypalLink={setCurrentInvoicePaypalLink}
                  navigate={navigate}
                  isInactiveTable={false}
                />

                <RequestTableCard
                  title={t("dashboard.inactiveRequests")}
                  requests={requests.inactive}
                  role={role}
                  isEditing={isEditing}
                  requestsToDelete={requestsToDelete}
                  toggleDeleteRequest={toggleDeleteRequest}
                  statusChanges={statusChanges}
                  handleStatusChange={handleStatusChange}
                  toggleDetails={toggleDetails}
                  expandedIdx={expandedIdx}
                  openUserModal={openUserModal}
                  setInvoiceUrl={setInvoiceUrl}
                  setCurrentInvoicePaypalLink={setCurrentInvoicePaypalLink}
                  navigate={navigate}
                  isInactiveTable={true}
                />
              </>
            )}
            {invoiceUrl && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-700 p-4 rounded-lg max-w-3xl w-full relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      {currentInvoicePaypalLink  && (
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
            {isUserModalOpen && selectedUserProfile && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-lg shadow-lg max-w-sm w-full relative">
                  <button
                    className="absolute top-2 right-2 text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                    onClick={() => setIsUserModalOpen(false)}
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-semibold mb-4 text-white">{t('dashboard.userInfoTitle') || 'User Contact Info'}</h2>
                  <div className="space-y-2 text-gray-300">
                    <div><strong>{t('dashboard.name') || 'Name'}:</strong> {selectedUserProfile.name}</div>
                    <div><strong>{t('dashboard.email') || 'Email'}:</strong> {selectedUserProfile.email}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
