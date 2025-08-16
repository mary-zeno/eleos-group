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
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertCircle, Phone, Globe, MessageSquare, UserCheck, CreditCard, Wallet, X, Download, Trash2, Filter, Search } from 'lucide-react';
import RequestTableCard from '@/components/RequestTableCard';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [profileData, setProfileData] = useState({
    phone_number: '',
    country_residence: '',
    language: '',
    emergency_contact_member1: '',
    emergency_contact1: '',
    communication_reference: ''
  });
  const [requests, setRequests] = useState({ active: [], inactive: [] });
  const [filteredRequests, setFilteredRequests] = useState({ active: [], inactive: [] });
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const { t } = useTranslation();

  // For edit mode toggle
  const [isEditing, setIsEditing] = useState(false);
  const [requestsToDelete, setRequestsToDelete] = useState(new Set());
  const [statusChanges, setStatusChanges] = useState({});

  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

 
  const [serviceFilter, setServiceFilter] = useState('all');
  
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ active: [], inactive: [] });

  //for payment 
  const [invoiceUrl, setInvoiceUrl] = useState(null);

  // User contact info modal
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentInvoicePaypalLink, setCurrentInvoicePaypalLink] = useState(null);
  
  
  const [currentInvoiceData, setCurrentInvoiceData] = useState(null);

  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      
      try {
        document.head.removeChild(script);
      } catch (error) {
        
      }
    };
  }, []);

  
  useEffect(() => {
    let activeRequests = requests.active || [];
    let inactiveRequests = requests.inactive || [];
    
    
    if (serviceFilter !== 'all') {
      activeRequests = activeRequests.filter(req => req.service === serviceFilter);
      inactiveRequests = inactiveRequests.filter(req => req.service === serviceFilter);
    }
    
    
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      
      const searchInRequest = (req) => {
      
        const searchableFields = [
          req.userName,
          req.service,
          req.status,
          req.id?.toString(),
          req.paymentStatus,
          req.amount_owed?.toString(),
       
          req.userProfile?.email,
          req.userProfile?.phone_number,
          req.userProfile?.country_residence,
          req.userProfile?.language,
          req.userProfile?.emergency_contact_member1,
          req.userProfile?.emergency_contact1,
          req.userProfile?.communication_reference,
          
          new Date(req.inserted_at).toLocaleDateString(),
          req.paidAt ? new Date(req.paidAt).toLocaleDateString() : null,
        ];
        
        
        if (req.service === t('dashboard.tables.travel')) {
          searchableFields.push(
            req.destination,
            req.departure_date,
            req.return_date,
            req.traveler_count?.toString(),
            req.travel_purpose,
            req.accommodation_preference,
            req.budget_range,
            req.special_requirements
          );
        } else if (req.service === t('dashboard.tables.business')) {
          searchableFields.push(
            req.business_name,
            req.business_type,
            req.industry,
            req.business_structure,
            req.estimated_revenue?.toString(),
            req.employee_count?.toString(),
            req.business_location,
            req.services_description,
            req.target_market,
            req.funding_requirements?.toString(),
            req.timeline
          );
        } else if (req.service === t('dashboard.tables.property')) {
          searchableFields.push(
            req.property_type,
            req.location_preference,
            req.budget_min?.toString(),
            req.budget_max?.toString(),
            req.bedrooms?.toString(),
            req.bathrooms?.toString(),
            req.square_footage?.toString(),
            req.property_features,
            req.investment_timeline,
            req.financing_needed,
            req.additional_requirements
          );
        }
        
       
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm)
        );
      };
      
      activeRequests = activeRequests.filter(searchInRequest);
      inactiveRequests = inactiveRequests.filter(searchInRequest);
    }
    
    setSearchResults({
      active: activeRequests,
      inactive: inactiveRequests
    });
  }, [serviceFilter, searchQuery, requests, t]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserData(user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          name, 
          role, 
          phone_number, 
          country_residence, 
          language, 
          emergency_contact_member1, 
          emergency_contact1, 
          communication_reference
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        setName('');
        setRole('user');
        setProfileData({
          phone_number: '',
          country_residence: '',
          language: '',
          emergency_contact_member1: '',
          emergency_contact1: '',
          communication_reference: ''
        });
      } else {
        setName(profile.name || '');
        setRole(profile.role || 'user');
        setProfileData({
          phone_number: profile.phone_number || '',
          country_residence: profile.country_residence || '',
          language: profile.language || '',
          emergency_contact_member1: profile.emergency_contact_member1 || '',
          emergency_contact1: profile.emergency_contact1 || '',
          communication_reference: profile.communication_reference || ''
        });
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
          status: entry.status || t('status.submitted')
        }));
        allRequests = allRequests.concat(enriched);
      }
    }

    
    const uniqueUserIds = [...new Set(allRequests.map((r) => r.user_id))];

    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        name, 
        email, 
        phone_number, 
        country_residence, 
        language, 
        emergency_contact_member1, 
        emergency_contact1, 
        communication_reference
      `)
      .in('id', uniqueUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
    }

    
    const userIdToName = {};
    const userIdToProfile = {};
    profiles?.forEach((p) => {
      userIdToName[p.id] = p.name || t('fallback.noName');
      userIdToProfile[p.id] = p;
    });

   
    allRequests = allRequests.map((req) => ({
      ...req,
      userName: userIdToName[req.user_id] || t('fallback.unknown'),
      userProfile: userIdToProfile[req.user_id] || null
    }));

  
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, user_id, service_type, service_uuid, invoice_url, paypal_link, flutterwave_enabled, amount_owed, payment_status, flutterwave_tx_ref, paid_at');

    if (!invoicesError && invoicesData?.length) {
      const invoiceMap = {};
      invoicesData.forEach((inv) => {
        const key = `${inv.user_id}-${inv.service_type}-${inv.service_uuid}`;
        invoiceMap[key] = {
          invoice_id: inv.id,
          invoice_url: inv.invoice_url,
          paypal_link: inv.paypal_link,
          flutterwave_enabled: inv.flutterwave_enabled,
          amount_owed: inv.amount_owed,
          payment_status: inv.payment_status,
          flutterwave_tx_ref: inv.flutterwave_tx_ref,
          paid_at: inv.paid_at
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
          flutterwaveEnabled: invoiceData?.flutterwave_enabled || false,
          amount_owed: invoiceData?.amount_owed || null,
          paymentStatus: invoiceData?.payment_status || 'pending',
          flutterwaveTxRef: invoiceData?.flutterwave_tx_ref || null,
          paidAt: invoiceData?.paid_at || null,
        };
      });
    }

    allRequests.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));

   
    const inactiveStatuses = ['status.completed', 'status.cancelled', 'status.archived'];
    const activeRequests = allRequests.filter(req => !inactiveStatuses.includes(req.status));
    const inactiveRequests = allRequests.filter(req => inactiveStatuses.includes(req.status));
    setRequests({ active: activeRequests, inactive: inactiveRequests });
    setLoading(false);
  };

  
  const getUniqueServiceTypes = () => {
    const allRequestsList = [...requests.active, ...requests.inactive];
    const uniqueServices = [...new Set(allRequestsList.map(req => req.service))];
    return uniqueServices.filter(Boolean); 
  };


  const getServiceTypeCounts = () => {
    const allRequestsList = [...requests.active, ...requests.inactive];
    const counts = {};
    
    allRequestsList.forEach(req => {
      if (req.service) {
        counts[req.service] = (counts[req.service] || 0) + 1;
      }
    });
    
    return counts;
  };

  
  const exportInactiveRequestsToCSV = () => {
    const requestsToExport = searchResults.inactive;
    
    if (!requestsToExport || requestsToExport.length === 0) {
      alert('No inactive requests to export.');
      return;
    }

    setIsExporting(true);

    try {
      
      const headers = [
        'ID',
        'Service Type',
        'User Name',
        'Status',
        'Submitted Date',
        'Payment Status',
        'Amount Owed',
        'Paid Date',
        
      ];

    
      const csvRows = [
        headers.join(','),
        ...requestsToExport.map(req => [
          req.id,
          `"${req.service}"`,
          `"${req.userName}"`,
          `"${req.status}"`,
          new Date(req.inserted_at).toLocaleDateString(),
          req.paymentStatus || 'N/A',
          req.amount_owed || 'N/A',
          req.paidAt ? new Date(req.paidAt).toLocaleDateString() : 'N/A',
        ].join(','))
      ];

      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const filterSuffix = serviceFilter === 'all' ? 'all' : serviceFilter.toLowerCase().replace(/\s+/g, '_');
        const searchSuffix = searchQuery.trim() ? `_search_${searchQuery.trim().replace(/\s+/g, '_').substring(0, 20)}` : '';
        link.setAttribute('download', `inactive_requests_${filterSuffix}${searchSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      alert(`Successfully exported ${requestsToExport.length} inactive requests to CSV.`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  
  const deleteAllInactiveRequests = async () => {
    const requestsToDeleteList = searchResults.inactive;
    
    if (!requestsToDeleteList || requestsToDeleteList.length === 0) {
      alert('No inactive requests to delete.');
      return;
    }

    setIsDeleting(true);

    try {
      
      const requestsByTable = {};
      requestsToDeleteList.forEach(req => {
        if (!requestsByTable[req.tableName]) {
          requestsByTable[req.tableName] = [];
        }
        requestsByTable[req.tableName].push(req.id);
      });

      let totalDeleted = 0;
      let errors = [];

      
      for (const [tableName, ids] of Object.entries(requestsByTable)) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .in('id', ids);

        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
          errors.push(`Failed to delete from ${tableName}: ${error.message}`);
        } else {
          totalDeleted += ids.length;
        }
      }

      if (errors.length > 0) {
        alert(`Partial deletion completed. ${totalDeleted} requests deleted successfully. Errors: ${errors.join('; ')}`);
      } else {
        alert(`Successfully deleted all ${totalDeleted} inactive requests.`);
      }

     
      await fetchRequests(userData, role);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      alert('Failed to delete inactive requests. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  
  const handleFlutterwavePayment = (invoiceData) => {
    if (!window.FlutterwaveCheckout) {
      alert('Flutterwave is loading, please try again in a moment.');
      return;
    }

    window.FlutterwaveCheckout({
      public_key: "994735bb-3bda-47ea-9a7c-3f4fb89a726e", 
      tx_ref: `invoice_${invoiceData.invoiceId}_${Date.now()}`,
      amount: invoiceData.amount_owed,
      currency: "USD", 
      customer: {
        email: user.email,
        name: name,
      },
      meta: {
        invoice_id: invoiceData.invoiceId,
        service_type: invoiceData.service,
        service_uuid: invoiceData.id,
      },
      customizations: {
        title: "Invoice Payment",
        description: `Payment for ${invoiceData.service}`,
        logo: "", 
      },
      callback: function (data) {
        console.log("Payment successful:", data);
        
        handlePaymentSuccess(data, invoiceData);
      },
      onclose: function () {
        console.log("Payment modal closed");
      },
    });
  };

 
  const handlePaymentSuccess = async (paymentData, invoiceData) => {
    try {
      
      const { error } = await supabase
        .from('invoices')
        .update({ 
          payment_status: 'paid',
          flutterwave_tx_ref: paymentData.tx_ref,
          paid_at: new Date().toISOString()
        })
        .eq('id', invoiceData.invoiceId);

      if (error) {
        console.error('Error updating payment status:', error);
        alert('Payment was successful, but there was an error updating our records. Please contact support.');
        return;
      }

      
      const serviceTable = getServiceTableName(invoiceData.service);
      await supabase
        .from(serviceTable)
        .update({ status: 'status.completed' })
        .eq('id', invoiceData.id);

      await fetchRequests(userData, role);
      
      
      setInvoiceUrl(null);
      setCurrentInvoicePaypalLink(null);
      setCurrentInvoiceData(null);
      
      alert('Payment successful! Your invoice has been marked as paid.');
    } catch (error) {
      console.error('Error processing payment success:', error);
      alert('Payment was successful, but there was an error updating our records. Please contact support.');
    }
  };

  
  const getServiceTableName = (serviceType) => {
    const serviceMap = {
      [t('dashboard.tables.travel')]: 'travel_forms',
      [t('dashboard.tables.business')]: 'business_setup_forms',
      [t('dashboard.tables.property')]: 'property_interest_forms',
    };
    return serviceMap[serviceType] || 'travel_forms';
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
    const allRequests = [...requests.active, ...requests.inactive];
   
    for (const id of requestsToDelete) {
      const req = [...requests.active, ...requests.inactive].find((r) => r.id === id);
      if (!req) continue;
      const { error } = await supabase.from(req.tableName).delete().eq('id', id);
      if (error) console.error('Delete error for id:', id, error.message);
    }

    // Update statuses
    for (const [id, newStatus] of Object.entries(statusChanges)) {
      if (requestsToDelete.has(id)) continue;

      const req = [...requests.active, ...requests.inactive].find((r) => r.id === id);
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
      // if (newStatus === 'status.awaitingPayment') {
      //   const { data: profile, error: profileError } = await supabase
      //     .from('profiles')
      //     .select('email, name')
      //     .eq('id', req.user_id)
      //     .single();

      //   const email = profile?.email;
      //   const name = profile?.name;

      //   if (email && name) {
      //     try {
      //       const response = await fetch('https://tykawjmgbuuywiddcrxw.supabase.co/functions/v1/send-payment-email', {
      //         method: 'POST',
      //         headers: { 
      //           'Content-Type': 'application/json',
      //           'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      //         },
      //         body: JSON.stringify({
      //           to: email,
      //           userName: name,
      //           serviceType: req.service
      //         })
      //       });

      //       if (!response.ok) {
      //         const errorText = await response.text();
      //         console.error('Failed to send email:', errorText);
      //       }
      //     } catch (err) {
      //       console.error('Error sending email:', err);
      //     }
      //   }
      // }
    }

   
    await fetchRequests(userData, role);

   
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

  const toggleDetails = (id) => { 
    setExpandedIdx(expandedIdx === id ? null : id);
  };

  const openUserModal = async (userId) => {
    
    const allRequestsList = [...requests.active, ...requests.inactive];
    const existingProfile = allRequestsList.find(r => r.user_id === userId)?.userProfile;
    
    if (existingProfile) {
      setSelectedUserProfile(existingProfile);
      setIsUserModalOpen(true);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        name, 
        email, 
        phone_number, 
        country_residence, 
        language, 
        emergency_contact_member1, 
        emergency_contact1, 
        communication_reference
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user profile:', error.message);
      return;
    }

    setSelectedUserProfile(profile);
    setIsUserModalOpen(true);
  };

  const openInvoiceModal = (invoiceUrl, paypalLink, invoiceData) => {
    setInvoiceUrl(invoiceUrl);
    setCurrentInvoicePaypalLink(paypalLink);
    setCurrentInvoiceData(invoiceData);
  };

  return (
    <div className="min-h-screen bg-charcoal-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{t('dashboard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300">
                    <strong>{t('dashboard.loggedInAs')}</strong> {name || user?.email}
                  </p>
                  <p className="text-sm text-gray-300">
                    <strong>{t('dashboard.role')}</strong> {role}
                  </p>
                </div>

                <div className="space-y-4">
                  {(profileData.phone_number || profileData.country_residence || profileData.language || profileData.communication_reference) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-charcoal-700">
                      {profileData.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.phone')}:</strong> {profileData.phone_number}</span>
                        </div>
                      )}
                      {profileData.country_residence && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Globe className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.country')}:</strong> {profileData.country_residence}</span>
                        </div>
                      )}
                      {profileData.language && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.language')}:</strong> {profileData.language}</span>
                        </div>
                      )}
                      {profileData.communication_reference && (
                        <div className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
                          <Mail className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.communicationPreference')}:</strong> {profileData.communication_reference}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(profileData.emergency_contact_member1 || profileData.emergency_contact1) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-charcoal-700">
                      {profileData.emergency_contact_member1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <UserCheck className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.emergencyContact')}:</strong> {profileData.emergency_contact_member1}</span>
                        </div>
                      )}
                      {profileData.emergency_contact1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4 text-accent" />
                          <span><strong>{t('dashboard.profile.emergencyPhone')}:</strong> {profileData.emergency_contact1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Controls */}
        {role === 'admin' && (
          <Card className="bg-charcoal-900 border-charcoal-800">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 bg-charcoal-800 border border-charcoal-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300 whitespace-nowrap hidden sm:inline">Service:</span>
                      </div>
                      <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger className="w-[180px] bg-charcoal-800 border-charcoal-600 text-white">
                          <SelectValue placeholder="All Services" />
                        </SelectTrigger>
                        <SelectContent className="bg-charcoal-800 border-charcoal-600">
                          <SelectItem value="all" className="text-white hover:bg-charcoal-700">
                            All ({requests.active?.length + requests.inactive?.length || 0})
                          </SelectItem>
                          {getUniqueServiceTypes().map((service) => {
                            const count = getServiceTypeCounts()[service] || 0;
                            return (
                              <SelectItem key={service} value={service} className="text-white hover:bg-charcoal-700">
                                {service} ({count})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    onClick={exportInactiveRequestsToCSV}
                    disabled={isExporting || !searchResults.inactive?.length}
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exporting...' : `Export Results (${searchResults.inactive?.length || 0})`}
                  </Button>
                  
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting || !searchResults.inactive?.length}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : `Delete Results (${searchResults.inactive?.length || 0})`}
                  </Button>
                </div>
              </div>
              
              {(serviceFilter !== 'all' || searchQuery.trim()) && (
                <Alert className="mt-4 bg-blue-500/10 border-blue-500/30">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1 mt-0.5">
                      {serviceFilter !== 'all' && <Filter className="h-4 w-4" />}
                      {searchQuery.trim() && <Search className="h-4 w-4" />}
                    </div>
                    <AlertDescription className="text-blue-400">
                      <div className="space-y-1">
                        {serviceFilter !== 'all' && (
                          <div>Service filter: <strong>{serviceFilter}</strong></div>
                        )}
                        {searchQuery.trim() && (
                          <div>Search: <strong>"{searchQuery.trim()}"</strong></div>
                        )}
                        <div className="text-sm">
                          Results: {searchResults.active?.length || 0} active, {searchResults.inactive?.length || 0} inactive
                          {(serviceFilter !== 'all' || searchQuery.trim()) && (
                            <button
                              onClick={() => {
                                setServiceFilter('all');
                                setSearchQuery('');
                              }}
                              className="ml-2 text-blue-300 hover:text-white underline"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
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
            ) : (!searchResults || (searchResults.active?.length === 0 && searchResults.inactive?.length === 0)) ? (
              <div className="text-center py-8">
                {serviceFilter === 'all' && !searchQuery.trim() ? (
                  <>
                    <p className="text-gray-400">{t('dashboard.noRequests')}</p>
                    <Button 
                      className="mt-4 bg-accent hover:bg-accent/90 text-black" 
                      onClick={() => navigate('/property-form')}
                    >
                      {t('dashboard.submitFirst')}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400">
                      No requests found
                      {serviceFilter !== 'all' && ` for service type: ${serviceFilter}`}
                      {searchQuery.trim() && ` matching: "${searchQuery.trim()}"`}
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button 
                        className="bg-accent hover:bg-accent/90 text-black" 
                        onClick={() => {
                          setServiceFilter('all');
                          setSearchQuery('');
                        }}
                      >
                        Clear Filters
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white" 
                        onClick={() => navigate('/property-form')}
                      >
                        Create New Request
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <RequestTableCard
                  title={
                    serviceFilter === 'all' && !searchQuery.trim() 
                      ? t("dashboard.activeRequests") 
                      : `Active Results${serviceFilter !== 'all' ? ` - ${serviceFilter}` : ''}${searchQuery.trim() ? ` - "${searchQuery.trim()}"` : ''}`
                  }
                  requests={searchResults.active}
                  role={role}
                  isEditing={isEditing}
                  requestsToDelete={requestsToDelete}
                  toggleDeleteRequest={toggleDeleteRequest}
                  statusChanges={statusChanges}
                  handleStatusChange={handleStatusChange}
                  toggleDetails={toggleDetails}
                  expandedIdx={expandedIdx}
                  openUserModal={openUserModal}
                  openInvoiceModal={openInvoiceModal}
                  navigate={navigate}
                  isInactiveTable={false}
                />

                <RequestTableCard
                  title={
                    serviceFilter === 'all' && !searchQuery.trim() 
                      ? t("dashboard.inactiveRequests") 
                      : `Inactive Results${serviceFilter !== 'all' ? ` - ${serviceFilter}` : ''}${searchQuery.trim() ? ` - "${searchQuery.trim()}"` : ''}`
                  }
                  requests={searchResults.inactive}
                  role={role}
                  isEditing={isEditing}
                  requestsToDelete={requestsToDelete}
                  toggleDeleteRequest={toggleDeleteRequest}
                  statusChanges={statusChanges}
                  handleStatusChange={handleStatusChange}
                  toggleDetails={toggleDetails}
                  expandedIdx={expandedIdx}
                  openUserModal={openUserModal}
                  openInvoiceModal={openInvoiceModal}
                  navigate={navigate}
                  isInactiveTable={true}
                />
              </>
            )}

            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-700 p-6 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Confirm Bulk Deletion</h3>
                  <div className="text-gray-300 mb-6">
                    <p className="mb-2">
                      Are you sure you want to delete <strong className="text-red-400">{searchResults.inactive?.length || 0}</strong> 
                      {(serviceFilter !== 'all' || searchQuery.trim()) ? ' matching' : ''} inactive requests?
                    </p>
                    <p className="text-sm text-gray-400">
                      This action cannot be undone. All matching inactive requests 
                      (completed, cancelled, archived) will be permanently removed from the database.
                      {serviceFilter !== 'all' && (
                        <span className="block mt-1">Service filter: <strong>{serviceFilter}</strong></span>
                      )}
                      {searchQuery.trim() && (
                        <span className="block mt-1">Search: <strong>"{searchQuery.trim()}"</strong></span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={deleteAllInactiveRequests}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete All'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {invoiceUrl && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-700 p-4 rounded-lg max-w-4xl w-full relative mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      {currentInvoicePaypalLink && (
                        <Button
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center gap-2"
                          onClick={() => window.open(currentInvoicePaypalLink, '_blank')}
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay with PayPal
                        </Button>
                      )}
                      
                      {currentInvoiceData?.flutterwaveEnabled && currentInvoiceData?.amount_owed && (
                        <Button
                          variant="outline"
                          className="border-green-500/50 text-green-400 hover:bg-green-500 hover:text-black flex items-center gap-2"
                          onClick={() => handleFlutterwavePayment(currentInvoiceData)}
                        >
                          <Wallet className="h-4 w-4" />
                          Pay with Flutterwave
                        </Button>
                      )}

                      {currentInvoiceData?.paymentStatus === 'paid' && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Payment Completed</span>
                          {currentInvoiceData?.paidAt && (
                            <span className="text-xs text-gray-400">
                              ({new Date(currentInvoiceData.paidAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      )}

                      {!currentInvoicePaypalLink && !currentInvoiceData?.flutterwaveEnabled && currentInvoiceData?.paymentStatus !== 'paid' && (
                        <div className="text-yellow-400 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          No payment options configured for this invoice
                        </div>
                      )}
                    </div>
                    <button
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center gap-1"
                      onClick={() => {
                        setInvoiceUrl(null);
                        setCurrentInvoicePaypalLink(null);
                        setCurrentInvoiceData(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                      {t('dashboard.close')}
                    </button>
                  </div>
                  
                  {(currentInvoicePaypalLink || currentInvoiceData?.flutterwaveEnabled) && currentInvoiceData?.paymentStatus !== 'paid' && (
                    <div className="mb-4 p-3 bg-charcoal-800 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Available Payment Methods:</h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {currentInvoicePaypalLink && (
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            PayPal (External)
                          </Badge>
                        )}
                        {currentInvoiceData?.flutterwaveEnabled && (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            Flutterwave (Secure Popup)
                          </Badge>
                        )}
                        {currentInvoiceData?.amount_owed && (
                          <div className="text-sm text-gray-300">
                            Amount: <span className="font-medium text-white">${currentInvoiceData.amount_owed}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentInvoiceData?.paymentStatus === 'paid' && (
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <h3 className="font-medium">Payment Completed</h3>
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>This invoice has been paid successfully.</p>
                        {currentInvoiceData?.flutterwaveTxRef && (
                          <p className="text-xs text-gray-400 mt-1">
                            Transaction Reference: {currentInvoiceData.flutterwaveTxRef}
                          </p>
                        )}
                        {currentInvoiceData?.paidAt && (
                          <p className="text-xs text-gray-400">
                            Paid on: {new Date(currentInvoiceData.paidAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <iframe 
                    src={invoiceUrl} 
                    width="100%" 
                    height="600px" 
                    title="Invoice PDF" 
                    className="rounded border border-charcoal-600" 
                  />
                </div>
              </div>
            )}

            {isUserModalOpen && selectedUserProfile && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-charcoal-900 border border-charcoal-800 p-6 rounded-lg shadow-lg max-w-lg w-full relative">
                  <button
                    className="absolute top-2 right-2 text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                    onClick={() => setIsUserModalOpen(false)}
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-semibold mb-4 text-white">{t('dashboard.userInfoTitle') || 'User Contact Info'}</h2>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-accent" />
                      <span><strong>{t('dashboard.name') || 'Name'}:</strong> {selectedUserProfile.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-accent" />
                      <span><strong>{t('dashboard.email') || 'Email'}:</strong> {selectedUserProfile.email || 'N/A'}</span>
                    </div>
                    {selectedUserProfile.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-accent" />
                        <span><strong>Phone:</strong> {selectedUserProfile.phone_number}</span>
                      </div>
                    )}
                    {selectedUserProfile.country_residence && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-accent" />
                        <span><strong>{t('dashboard.profile.country')}:</strong> {selectedUserProfile.country_residence}</span>
                      </div>
                    )}
                    {selectedUserProfile.language && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-accent" />
                        <span><strong>{t('dashboard.profile.language')}:</strong> {selectedUserProfile.language}</span>
                      </div>
                    )}
                    {selectedUserProfile.emergency_contact_member1 && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-accent" />
                        <span><strong>{t('dashboard.profile.emergencyContact')}:</strong> {selectedUserProfile.emergency_contact_member1}</span>
                      </div>
                    )}
                    {selectedUserProfile.emergency_contact1 && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-accent" />
                        <span><strong>{t('dashboard.profile.emergencyPhone')}:</strong> {selectedUserProfile.emergency_contact1}</span>
                      </div>
                    )}
                    {selectedUserProfile.communication_reference && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-accent" />
                        <span><strong>{t('dashboard.profile.communicationPreference')}:</strong> {selectedUserProfile.communication_reference}</span>
                      </div>
                    )}
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