import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('adminPayment.title')}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User dropdown */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">{t('adminPayment.selectUser')}</label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setSelectedService('');
            }}
            required
            className="w-full rounded-md border-gray-300 shadow-sm p-2"
          >
            <option value="">{t('adminPayment.chooseUser')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Service dropdown */}
        {requests.length > 0 && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">{t('adminPayment.selectService')}</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
              className="w-full rounded-md border-gray-300 shadow-sm p-2"
            >
              <option value="">{t('adminPayment.chooseRequest')}</option>
              {requests.map((r) => (
                <option key={r.id} value={r.service}>
                  {r.service} - {new Date(r.inserted_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount input */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">{t('adminPayment.amountOwed')}</label>
          <Input
            type="number"
            min="0"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            required
          />
        </div>

        {/* Invoice upload */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">{t('adminPayment.uploadInvoice')}</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setInvoiceFile(e.target.files[0])}
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full">
          {t('adminPayment.submit')}
        </Button>

        {status && <p className="text-sm text-center text-gray-600">{status}</p>}
      </form>
    </div>
  );
}
