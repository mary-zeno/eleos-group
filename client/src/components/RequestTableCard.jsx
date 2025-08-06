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
                    <TableCell>
                      {role === 'admin' ? (
                        <button
                          className="text-blue-600 underline hover:text-blue-800"
                          onClick={() => openUserModal(req.user_id)}
                        >
                          {req.userName}
                        </button>
                      ) : (
                        'You'
                      )}
                    </TableCell>
                    <TableCell>{new Date(req.inserted_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {role === 'admin' && isEditing ? (
                        <Select
                          value={currentStatus}
                          onValueChange={(value) => handleStatusChange(req.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue>{t(currentStatus)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(currentStatus)}>{t(currentStatus)}</Badge>
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
                              ![
                                'id',
                                'user_id',
                                'inserted_at',
                                'service',
                                'status',
                                'tableName',
                                'userName',
                                'invoiceUrl',
                              ].includes(key) ? (
                                <div key={key} className="flex">
                                  <span className="font-medium mr-2 min-w-0 flex-shrink-0">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:
                                  </span>
                                  <span className="text-gray-600 break-words">{String(value) || 'N/A'}</span>
                                </div>
                              ) : null
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
    </div>
  );
}
