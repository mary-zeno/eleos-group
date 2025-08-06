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

        if (!error && data.length) {
          const formatted = data.map((entry) => ({
            id: entry.id,
            service: table.service,
            inserted_at: entry.inserted_at,
          }));
          allRequests = allRequests.concat(formatted);
        }
      }

      allRequests.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
      setRequests(allRequests);
    };

    fetchRequests();
  }, [selectedUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedService || !billAmount) {
      setStatus('Please fill in all fields.');
      return;
    }

    setStatus('Uploading...');
    let invoiceUrl = null;

    if (invoiceFile) {
      const fileExt = invoiceFile.name.split('.').pop();
      const fileName = `${selectedUserId}-${Date.now()}.${fileExt}`;
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

    const { error: insertError } = await supabase.from('invoices').insert([
      {
        user_id: selectedUserId,
        service_type: selectedService,
        amount_owed: billAmount,
        invoice_url: invoiceUrl,
      },
    ]);

    if (insertError) {
      setStatus('Failed to insert invoice: ' + insertError.message);
      return;
    }

    setStatus('Invoice created successfully!');
    setBillAmount('');
    setSelectedService('');
    setSelectedUserId('');
    setInvoiceFile(null);
  };

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

              {/* Invoice upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">{t('adminPayment.uploadInvoice')}</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                  className="bg-charcoal-800 border-charcoal-700 text-white file:bg-charcoal-700 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-medium">
                {t('adminPayment.submit')}
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
