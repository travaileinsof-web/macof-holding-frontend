import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/v1/admin/login', {
        email,
        password
      });

      if (response.data.success && response.data.data.token) {
        localStorage.setItem('admin_token', response.data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
        navigate('/admin/dashboard');
      } else {
        setError(response.data.message || 'Erreur de connexion');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else if (err.response?.status === 429) {
        setError('Trop de tentatives. Réessayez dans 1 minute.');
      } else {
        setError('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
          alt="Office"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative z-10 w-full max-w-md p-8 bg-card border border-black/10 rounded-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-foreground tracking-widest uppercase mb-2">
            <span className="text-primary">M</span>ACOF
          </h1>
          <p className="text-gray-600">Accès Administrateur</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-200 text-sm rounded-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@macof-holding.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
         <Button type="submit" variant="luxury" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se Connecter'}
        </Button>
        </form>
      </div>
    </div>
  );
}
