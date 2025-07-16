import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const STATUS_OPTIONS = [
  'Submitted',
  'In Review',
  'Pending Info',
  'In Progress',
  'Awaiting Payment',
  'Completed',
  'On Hold',
  'Cancelled',
  'Archived',
];

const getStatusColor = (status) => {
  const colors = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'In Review': 'bg-yellow-100 text-yellow-800',
    'Pending Info': 'bg-orange-100 text-orange-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Awaiting Payment': 'bg-red-100 text-red-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Archived': 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);

  // For edit mode toggle
  const [isEditing, setIsEditing] = useState(false);
  const [requestsToDelete, setRequestsToDelete] = useState(new Set());
  const [statusChanges, setStatusChanges] = useState({});

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

    const tables = [
      { name: 'travel_forms', service: 'Travel' },
      { name: 'business_setup_forms', service: 'Business' },
      { name: 'property_interest_forms', service: 'Property' },
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
          status: entry.status || 'Submitted',
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
      userIdToName[p.id] = p.name || 'No Name';
    });

    // Add userName field to each request
    allRequests = allRequests.map((req) => ({
      ...req,
      userName: userIdToName[req.user_id] || 'Unknown',
    }));

    allRequests.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
    setRequests(allRequests);
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

      if (error) console.error('Update status error for id:', id, error.message);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to your Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <strong>Logged in as:</strong> {name || user?.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Role:</strong> {role}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/edit-profile')}>
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Controls */}
      {role === 'admin' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  ✏️ Edit Mode
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveChanges} disabled={loading}>
                    💾 Save Changes
                  </Button>
                  <Button onClick={cancelEditing} variant="outline">
                    ❌ Cancel
                  </Button>
                </>
              )}
            </div>
            {isEditing && (
              <Alert className="mt-4">
                <AlertDescription>
                  Edit mode is active. You can update statuses and mark requests for deletion.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No requests submitted yet.</p>
              <Button className="mt-4" onClick={() => navigate('/property-form')}>
                Submit Your First Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {role === 'admin' && isEditing && <TableHead>Delete</TableHead>}
                  <TableHead>Service</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
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
                        <TableCell>{role === 'admin' ? req.userName : 'You'}</TableCell>
                        <TableCell>{new Date(req.inserted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {role === 'admin' && isEditing ? (
                            <Select
                              value={currentStatus}
                              onValueChange={(value) => handleStatusChange(req.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getStatusColor(currentStatus)}>
                              {currentStatus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDetails(idx)}
                          >
                            {expandedIdx === idx ? 'Hide' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedIdx === idx && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={role === 'admin' && isEditing ? 6 : 5}>
                            <div className="p-4 space-y-2">
                              <h4 className="font-medium mb-2">Request Details:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {Object.entries(req).map(([key, value]) =>
                                  !['id', 'user_id', 'inserted_at', 'service', 'status', 'tableName', 'userName'].includes(key) && (
                                    <div key={key} className="flex">
                                      <span className="font-medium mr-2 min-w-0 flex-shrink-0">
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                                      </span>
                                      <span className="text-gray-600 break-words">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}