import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Auth() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async () => {
    setStatus('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setStatus(t('auth.status.loginError') + error.message);
    } else {
      setStatus(t('auth.status.loginSuccess'));
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setStatus('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setStatus(t('auth.status.signupError') + error.message);
    } else if (data?.user) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email: data.user.email, name: name.trim() }]);

      if (insertError) {
        setStatus(t('auth.status.profileError') + insertError.message);
      } else {
        setStatus(t('auth.status.signupSuccess'));
      }
    }
    setLoading(false);
  };

  const handleSignupClick = () => {
    if (!showNameField) {
      setShowNameField(true);
    } else {
      handleSignup();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.welcome')}</CardTitle>
          <CardDescription>{t('auth.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNameField && (
            <Input
              type="text"
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <Input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleLogin}
              disabled={loading}
              variant="default"
              className="flex-1"
            >
              {t('auth.login')}
            </Button>

            <Button
              onClick={handleSignupClick}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {t('auth.signup')}
            </Button>
          </div>

          {status && (
            <div className={`text-sm font-medium ${status.toLowerCase().includes('error')
              ? 'text-red-600'
              : 'text-green-600'
              }`}>
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}