import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
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

  const handleLogin = async () => {
    setStatus('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setStatus(`Login Error: ${error.message}`);
    } else {
      setStatus('Login successful! Redirecting...');
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
      setStatus(`Signup Error: ${error.message}`);
    } else if (data?.user) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email: data.user.email, name: name.trim() }]);

      if (insertError) {
        setStatus(`Profile creation error: ${insertError.message}`);
      } else {
        setStatus('Signup successful! Please check your email to verify your account.');
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
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Login or create a new account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNameField && (
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            type="password"
            placeholder="Password"
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
              Log In
            </Button>
            <Button 
              onClick={handleSignupClick} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>

          {status && (
            <div className={`text-sm font-medium ${
              status.toLowerCase().includes('error') 
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