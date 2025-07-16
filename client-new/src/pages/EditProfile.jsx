import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function EditProfile({ user }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchName = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (data) setName(data.name || '');
      if (error) console.error('Failed to fetch name:', error.message);
    };

    fetchName();
  }, [user]);

  const handleUpdate = async () => {
    if (!user?.id) {
      setStatus('User not found. Please log in again.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      // Update auth info (email/password)
      const updates = {};
      if (email !== user.email && email.trim()) updates.email = email.trim();
      if (password.trim()) updates.password = password.trim();

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) {
          setStatus(`Error updating auth: ${authError.message}`);
          setLoading(false);
          return;
        }
      }

      // Update name in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id);

      if (profileError) {
        setStatus(`Error updating profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setStatus('Profile updated successfully!');
      setPassword(''); // Clear password field after successful update
    } catch (error) {
      setStatus(`Unexpected error: ${error.message}`);
    }

    setLoading(false);
  };

  const isFormValid = name.trim() && email.trim();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Changing your email will require verification
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Only enter a password if you want to change it
              </p>
            </div>

            {/* Status Message */}
            {status && (
              <Alert className={
                status.includes('successfully') 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }>
                {status.includes('successfully') ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={
                  status.includes('successfully') 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }>
                  {status}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleUpdate} 
                disabled={loading || !isFormValid}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            {/* User Info Display */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Current Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Email Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}