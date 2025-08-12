import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const passedRequest = location.state?.request || null;
  const passedInvoice = location.state?.invoice || null;

  const [billAmount, setBillAmount] = useState('');
  const [paypalLink, setPaypalLink] = useState('');
  const [enableFlutterwave, setEnableFlutterwave] = useState(true);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchExistingInvoice = async () => {
      if (passedInvoice) {
        // Prefill with passed invoice data
        setBillAmount(passedInvoice.amount_owed || '');
        setPaypalLink(passedInvoice.paypal_link || '');
        setEnableFlutterwave(passedInvoice.flutterwave_enabled !== false);
        setInvoiceUrl(passedInvoice.invoice_url || '');
        setInvoiceId(passedInvoice.id);
        setStatus('');
      } else if (passedRequest) {
        // Try loading from DB if invoice wasn't passed in
        const { data: existingInvoice, error } = await supabase
          .from('invoices')
          .select('id, amount_owed, paypal_link, flutterwave_enabled, invoice_url')
          .eq('user_id', passedRequest.user_id)
          .eq('service_type', passedRequest.service)
          .eq('service_uuid', passedRequest.id)
          .single();

        if (existingInvoice) {
          setBillAmount(existingInvoice.amount_owed || '');
          setPaypalLink(existingInvoice.paypal_link || '');
          setEnableFlutterwave(existingInvoice.flutterwave_enabled !== false);
          setInvoiceUrl(existingInvoice.invoice_url || '');
          setInvoiceId(existingInvoice.id);
        }
      }
    };

    fetchExistingInvoice();
  }, [passedRequest, passedInvoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passedRequest || !billAmount) {
      setStatus('Please fill in all required fields.');
      return;
    }

    setStatus('Uploading...');
    let uploadedInvoiceUrl = invoiceUrl;

    if (invoiceFile) {
      const fileExt = invoiceFile.name.split('.').pop();
      const fileName = `${passedRequest.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, invoiceFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        setStatus('Failed to upload invoice: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('invoices').getPublicUrl(filePath);
      uploadedInvoiceUrl = data.publicUrl;
    }

    const invoiceData = {
      user_id: passedRequest.user_id,
      service_type: passedRequest.service,
      service_uuid: passedRequest.id,
      amount_owed: billAmount,
      paypal_link: paypalLink,
      flutterwave_enabled: enableFlutterwave,
      invoice_url: uploadedInvoiceUrl,
    };

    let result;

    if (invoiceId) {
      // Update
      result = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId);

      if (result.error) {
        setStatus('Failed to update invoice: ' + result.error.message);
        return;
      }
      setStatus('Invoice updated successfully!');
    } else {
      // Insert
      result = await supabase
        .from('invoices')
        .insert([invoiceData]);

      if (result.error) {
        setStatus('Failed to create invoice: ' + result.error.message);
        return;
      }
      setStatus('Invoice created successfully!');
    }

    // Reset
    setBillAmount('');
    setPaypalLink('');
    setEnableFlutterwave(true);
    setInvoiceFile(null);
    setInvoiceId(null);
    setInvoiceUrl('');
  };

// START OF CARDS (keeping your original comment)
  if (!passedRequest) {
    return (
      <div className="min-h-screen bg-charcoal-950 p-4">
        <Card className="bg-charcoal-900 border-charcoal-800 max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">No request selected. Please navigate from the dashboard.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-accent text-black">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-2xl mx-auto mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="text-white">
              {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </CardTitle>
          </CardHeader>
          <CardContent>

          {/* START FORM CAUTION (keeping your original comment) */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-gray-300">Amount Owed (USD)</Label>
                <Input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                  className="bg-charcoal-800 border-charcoal-700 text-white"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Payment Options Section */}
              <div className="space-y-4 border border-charcoal-700 rounded-lg p-4">
                <h3 className="text-gray-300 font-medium">Payment Options</h3>
                
                {/* PayPal Link */}
                <div className="space-y-2">
                  <Label className="text-gray-300">PayPal Link</Label>
                  <Input
                    type="url"
                    value={paypalLink}
                    onChange={(e) => setPaypalLink(e.target.value)}
                    className="bg-charcoal-800 border-charcoal-700 text-white"
                    placeholder="https://paypal.me/..."
                  />
                  <p className="text-xs text-gray-400">
                    Leave empty to only show Flutterwave option
                  </p>
                </div>

                {/* Flutterwave Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="flutterwave"
                    checked={enableFlutterwave}
                    onCheckedChange={setEnableFlutterwave}
                  />
                  <Label htmlFor="flutterwave" className="text-gray-300">
                    Enable Flutterwave Payment (Secure In-Site Popup)
                  </Label>
                </div>
                <p className="text-xs text-gray-400">
                  Flutterwave will automatically use the amount above and open in a secure popup
                </p>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Upload Invoice (PDF)</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                  className="bg-charcoal-800 border-charcoal-700 text-white"
                />
                {invoiceUrl && !invoiceFile && (
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline text-sm"
                  >
                    View Existing Invoice
                  </a>
                )}
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-medium">
                {invoiceId ? 'Update Invoice' : 'Create Invoice'}
              </Button>

              {status && (
                <p className={`text-sm text-center mt-2 ${
                  status.includes('Failed') || status.includes('Error')
                    ? 'text-red-400'
                    : status.includes('successfully')
                    ? 'text-green-400'
                    : 'text-gray-300'
                }`}>
                  {status}
                </p>
              )}
            </form>
            {/* END FORM CAUTION (keeping your original comment) */}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}