// Request status keys & colors
export const STATUS_KEYS = [
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

export const getStatusColor = (statusKey) => {
  const colors = {
    'status.submitted': 'bg-blue-100 text-blue-800',
    'status.inReview': 'bg-yellow-100 text-yellow-800',
    'status.pendingInfo': 'bg-orange-100 text-orange-800',
    'status.inProgress': 'bg-purple-100 text-purple-800',
    'status.awaitingPayment': 'bg-red-100 text-red-800',
    'status.completed': 'bg-green-100 text-green-800',
    'status.onHold': 'bg-gray-100 text-gray-800',
    'status.cancelled': 'bg-red-100 text-red-800',
    'status.archived': 'bg-gray-100 text-gray-800',
  };
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};
