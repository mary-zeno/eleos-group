import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
      setStatus(t('editProfile.status.userNotFound'));
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
          setStatus(t('editProfile.status.authUpdateError') + authError.message)
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
        setStatus(t('editProfile.status.profileUpdateError') + profileError.message)
        setLoading(false);
        return;
      }

      setStatus(t('editProfile.status.profileUpdateSuccess'));
      setPassword(''); // Clear password field after successful update
    } catch (error) {
      setStatus(t('editProfile.status.unexpectedError') + error.message)
    }

    setLoading(false);
  };

  const isFormValid = name.trim() && email.trim();

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-charcoal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editProfile.back')}
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-charcoal-900 border-charcoal-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              {t('editProfile.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4" />
                {t('editProfile.emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('editProfile.emailPlaceholder')}
                disabled={loading}
                className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-400">
                {t('editProfile.emailNote')}
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-300">
                <User className="h-4 w-4" />
                {t('editProfile.nameLabel')}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('editProfile.namePlaceholder')}
                disabled={loading}
                className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-gray-300">
                <Lock className="h-4 w-4" />
                {t('editProfile.passwordLabel')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('editProfile.emailPlaceholder')}
                disabled={loading}
                className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-400">
                {t('editProfile.passwordNote')}
              </p>
            </div>

            {/* Status Message */}
            {status && (
              <Alert className={
                status.includes('successfully')
                  ? 'border-green-700 bg-green-900/20'
                  : 'border-red-700 bg-red-900/20'
              }>
                {status.includes('successfully') ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={
                  status.includes('successfully')
                    ? 'text-green-400'
                    : 'text-red-400'
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
                className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium"
              >
                {loading ? t('editProfile.saving') : t('editProfile.save')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700"
              >
                {t('editProfile.cancel')}
              </Button>
            </div>

            {/* User Info Display */}
            <div className="pt-4 border-t border-charcoal-700">
              <h3 className="text-sm font-medium text-white mb-2">{t('editProfile.currentInfo')}</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p><strong className="text-gray-300">{t('editProfile.userId')}</strong> {user?.id}</p>
                <p><strong className="text-gray-300">{t('editProfile.created')}</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('common.na')}</p>
                <p><strong className="text-gray-300">{t('editProfile.emailVerified')}</strong> {user?.email_confirmed_at ? t('common.yes') : t('common.no')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}