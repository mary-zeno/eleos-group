import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminPayment() {
    const location = useLocation();
    const passedRequest = location.state?.request || null;
    const [billAmount, setBillAmount] = useState('');
    const [paypalLink, setPaypalLink] = useState('');
    const [status, setStatus] = useState('');
    const [invoiceFile, setInvoiceFile] = useState(null);

    // Load existing invoice data when component mounts if we have a passed request
    useEffect(() => {
      if (!passedRequest) return;

      const loadExistingInvoice = async () => {
        // Generate service_uuid from the request
        const serviceUuid = `${passedRequest.user_id}-${passedRequest.tableName}-${passedRequest.id}`;
        
        const { data: existingInvoice, error } = await supabase
          .from('invoices')
          .select('amount_owed, paypal_link')
          .eq('service_uuid', serviceUuid)
          .single();
  const location = useLocation();
  const passedRequest = location.state?.request || null;
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(passedRequest?.user_id || '');
  const [selectedService, setSelectedService] = useState(passedRequest?.service || '');
  const [billAmount, setBillAmount] = useState('');
  const [status, setStatus] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Fetch non-admin users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'user');
      if (error) {
        console.error('Error fetching users:', error.message);
      } else {
        const filtered = data.filter((user) => user.name?.trim());
        setUsers(filtered);
      }
    };
    fetchUsers();
  }, []);

  // Fetch requests for selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchRequests = async () => {
      const tables = [
        { name: 'travel_forms', service: 'Travel' },
        { name: 'business_setup_forms', service: 'Business' },
        { name: 'property_interest_forms', service: 'Property' },
      ];

      let allRequests = [];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('id, inserted_at')
          .eq('user_id', selectedUserId);

        if (!error && existingInvoice) {
          setBillAmount(existingInvoice.amount_owed || '');
          setPaypalLink(existingInvoice.paypal_link || '');
          setStatus('Editing existing invoice');
        } else {
          setBillAmount('');
          setPaypalLink('');
          setStatus('');
        }
      };

      loadExistingInvoice();
    }, [passedRequest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passedRequest || !billAmount) {
      setStatus('Please fill in all required fields.');
      return;
    }

    setStatus('Uploading...');
    let invoiceUrl = null;

    if (invoiceFile) {
      const fileExt = invoiceFile.name.split('.').pop();
      const fileName = `${passedRequest.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, invoiceFile);

      if (uploadError) {
        setStatus('Failed to upload invoice: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('invoices').getPublicUrl(filePath);
      invoiceUrl = data.publicUrl;
    }

    // Check if an invoice already exists for this specific request
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, invoice_url')
      .eq('user_id', passedRequest.user_id)
      .eq('service_type', passedRequest.service)
      .eq('service_uuid', passedRequest.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      setStatus('Error checking existing invoice: ' + checkError.message);
      return;
    }

    let result;
    if (existingInvoice) {
      // Update existing invoice
      const updateData = {
        amount_owed: billAmount,
        paypal_link: paypalLink,
      };
      
      // Only update invoice_url if a new file was uploaded
      if (invoiceUrl) {
        updateData.invoice_url = invoiceUrl;
      }

      result = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', existingInvoice.id);

      if (result.error) {
        setStatus('Failed to update invoice: ' + result.error.message);
        return;
      }
      setStatus('Invoice updated successfully!');
    } else {
      // Insert new invoice
      result = await supabase.from('invoices').insert([
        {
          user_id: passedRequest.user_id,
          service_type: passedRequest.service,
          service_uuid: passedRequest.id,
          amount_owed: billAmount,
          invoice_url: invoiceUrl,
          paypal_link: paypalLink,
        },
      ]);

      if (result.error) {
        setStatus('Failed to create invoice: ' + result.error.message);
        return;
      }
      setStatus('Invoice created successfully!');
    }

    setBillAmount('');
    setPaypalLink('');
    setInvoiceFile(null);
  };

  if (!passedRequest) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Invoice</h2>
        <p className="text-red-600">No request selected. Please navigate from the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4 sm:p-6 lg:p-8">
      {/* Back to Dashboard */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editProfile.back')}
          </Button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-white">{t('adminPayment.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User dropdown */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t('adminPayment.selectUser')}</Label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedService('');
                  }}
                  required
                  className="w-full bg-charcoal-800 border-charcoal-700 text-white rounded-md shadow-sm p-2 focus:ring-accent focus:border-accent"
                >
                  <option value="">{t('adminPayment.chooseUser')}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-charcoal-800">{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Service dropdown */}
              {requests.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('adminPayment.selectService')}</Label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    required
                    className="w-full bg-charcoal-800 border-charcoal-700 text-white rounded-md shadow-sm p-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="">{t('adminPayment.chooseRequest')}</option>
                    {requests.map((r) => (
                      <option key={r.id} value={r.service} className="bg-charcoal-800">
                        {r.service} - {new Date(r.inserted_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t('adminPayment.amountOwed')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                  className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
                />
              </div>
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Invoice</h2>
      
      {/* Request Information Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Request Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><strong>User:</strong> {passedRequest.userName}</div>
          <div><strong>Service:</strong> {passedRequest.service}</div>
          <div><strong>Date:</strong> {new Date(passedRequest.inserted_at).toLocaleDateString()}</div>
          <div><strong>Request ID:</strong> {passedRequest.id}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount input */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Amount Owed (USD)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            required
            placeholder="Enter amount"
          />
        </div>

        {/* PayPal Link */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">PayPal Payment Link</label>
          <Input
            type="url"
            placeholder="https://paypal.me/..."
            value={paypalLink}
            onChange={(e) => setPaypalLink(e.target.value)}
          />
        </div>

              {/* Invoice upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Upload Invoice (PDF)</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                  className="bg-charcoal-800 border-charcoal-700 text-white file:bg-charcoal-700 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-medium">
                {status === 'Editing existing invoice' ? 'Update Invoice' : 'Create Invoice'}
              </Button>

              {status && (
                <div className={`text-sm font-medium text-center ${
                  status.includes('Failed') || status.includes('Error') || status.includes('error')
                    ? 'text-red-400'
                    : status.includes('successfully')
                    ? 'text-green-400'
                    : 'text-gray-300'
                }`}>
                  {status}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
