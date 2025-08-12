import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { STATUS_KEYS, getStatusColor } from '@/components/statusConfig';

export default function RequestTableCard({
  title,
  requests,
  role,
  isEditing,
  requestsToDelete,
  toggleDeleteRequest,
  statusChanges,
  handleStatusChange,
  toggleDetails,
  expandedIdx,
  openUserModal,
  setInvoiceUrl,
  openInvoiceModal, // Added this prop
  setCurrentInvoicePaypalLink,
  navigate,
  isInactiveTable = false,
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('dashboard.noRequests')}</p>
          {role !== 'admin' && (
            <Button onClick={() => navigate('/property-form')} className="mt-4">
                {t('dashboard.submitFirst')}
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-charcoal-800 rounded-lg">
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
                            className="text-red-600 hover:text-red-800"
                          >
                            ❌
                          </Button>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className="border-accent/50 text-accent">{req.service}</Badge>
                      </TableCell>
                      <TableCell>
                        {role === 'admin' ? (
                          <button
                          className="p-0 m-0 bg-transparent border-0 cursor-pointer text-gray-200 font-semibold hover:text-accent hover:font-bold focus:outline-none focus:ring-2 focus:ring-accent/40 rounded transition-colors duration-150"
                            onClick={() => openUserModal(req.user_id)}
                          >
                            {req.userName}
                          </button>
                        ) : (
                          'You'
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">{new Date(req.inserted_at).toLocaleDateString()}</TableCell>
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
                                <SelectItem className="text-white hover:bg-charcoal-700" key={key} value={key}>
                                  {t(key)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(currentStatus)}>{t(currentStatus)}</Badge>
                        )}
                      </TableCell>
                      {/* ADMIN PAYMENT FORMS */}
                      <TableCell className="py-2 px-4">
                        {req.invoiceUrl ? (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              className="text-xs border-accent/50 text-accent hover:bg-accent hover:text-black"
                              onClick={() => {
                                if (role === 'admin' && isEditing) {
                                  // Navigate to edit invoice page
                                  navigate('/admin/payment', { 
                                    state: { 
                                      request: req,
                                      invoice: {
                                        id: req.invoiceId, // Use the actual invoice ID
                                        amount_owed: req.amount_owed,
                                        paypal_link: req.paypalLink,
                                        invoice_url: req.invoiceUrl
                                      }
                                    } 
                                  });
                                } else {
                                  // View invoice in modal using the updated function
                                  openInvoiceModal(
                                    req.invoiceUrl, 
                                    req.paypalLink, 
                                    {
                                      invoiceId: req.invoiceId,
                                      amount_owed: req.amount_owed,
                                      flutterwaveEnabled: req.flutterwaveEnabled,
                                      paymentStatus: req.paymentStatus,
                                      flutterwaveTxRef: req.flutterwaveTxRef,
                                      paidAt: req.paidAt,
                                      service: req.service,
                                      id: req.id,
                                      user_id: req.user_id
                                    }
                                  );
                                }
                              }}
                            >
                              {role === 'admin' && isEditing ? t('dashboard.editInvoice') : 
                               req.paymentStatus === 'paid' ? 'View Paid Invoice' : t('dashboard.viewInvoice')}
                            </Button>
                            
                            {/* Show payment status badge */}
                            {req.paymentStatus === 'paid' && (
                              <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                                Paid
                              </Badge>
                            )}
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
                      {/* END ADMIN PAYMENT FORMS */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-2xl text-gray-400 hover:text-white hover:bg-charcoal-800"
                          onClick={() => toggleDetails(req.id)} //changed from idx
                        >
                          {/* changed from idx */}
                          {expandedIdx === req.id ? '▴' : '▾'} 
                        </Button>
                      </TableCell>
                    </TableRow>
                          {/* changed from idx */}
                    {expandedIdx === req.id && (
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
    </div>
  );
}