import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchExistingInvoice = async () => {
      if (passedInvoice) {
       
        setBillAmount(passedInvoice.amount_owed || '');
        setPaypalLink(passedInvoice.paypal_link || '');
        setEnableFlutterwave(passedInvoice.flutterwave_enabled !== false);
        setInvoiceUrl(passedInvoice.invoice_url || '');
        setInvoiceId(passedInvoice.id);
        setStatus('');
      } else if (passedRequest) {
        
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

  
  const handleDeleteInvoice = async () => {
    if (!invoiceId) return;

    setIsDeleting(true);
    setStatus('Deleting invoice...');

    try {
      
      if (invoiceUrl) {
       
        const urlParts = invoiceUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `invoices/${fileName}`;

       
        await supabase.storage
          .from('invoices')
          .remove([filePath]);
      }

      // Delete 
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        setStatus('Failed to delete invoice: ' + error.message);
        setIsDeleting(false);
        return;
      }

      
      setStatus('Invoice deleted successfully!');
      setBillAmount('');
      setPaypalLink('');
      setEnableFlutterwave(true);
      setInvoiceFile(null);
      setInvoiceId(null);
      setInvoiceUrl('');
      setShowDeleteConfirm(false);
      
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error deleting invoice:', error);
      setStatus('An error occurred while deleting the invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

// cards
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
              </CardTitle>
              
            
              {invoiceId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Invoice
                </Button>
              )}
            </div>

           
            {invoiceId && (
              <div className="mt-4 p-3 bg-charcoal-800 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Editing Invoice for:</strong> {passedRequest.userName || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-400">
                  Service: {passedRequest.service} | Request ID: {passedRequest.id}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>

          

            <form onSubmit={handleSubmit} className="space-y-6">
              
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

              
              <div className="space-y-4 border border-charcoal-700 rounded-lg p-4">
                <h3 className="text-gray-300 font-medium">Payment Options</h3>
                
                
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
            
          </CardContent>
        </Card>

        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Card className="bg-charcoal-900 border-charcoal-700 max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Confirm Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-600/50 bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    <strong>Warning:</strong> This action cannot be undone!
                  </AlertDescription>
                </Alert>
                
                <div className="text-gray-300 space-y-2">
                  <p>Are you sure you want to delete this invoice?</p>
                  <div className="text-sm text-gray-400 bg-charcoal-800 p-3 rounded">
                    <p><strong>User:</strong> {passedRequest.userName || 'Unknown'}</p>
                    <p><strong>Service:</strong> {passedRequest.service}</p>
                    <p><strong>Amount:</strong> ${billAmount}</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    This will permanently remove the invoice from the database and delete any uploaded PDF file.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteInvoice}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Invoice'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}