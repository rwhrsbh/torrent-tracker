'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BeeSwarm from '@/components/BeeSwarm';
import HoneycombBackground from '@/components/HoneycombBackground';
import BeeCursor from '@/components/BeeCursor';
import BeehiveBackground from '@/components/BeehiveBackground';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Login successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(result.user));
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error: Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex items-center justify-center p-4">
      <BeehiveBackground />
      <HoneycombBackground />
      <BeeSwarm />
      <BeeCursor />
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500">
            🍯 HiveShare - Premium Bee Tracker 🐝
          </Link>
          <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">🐝 Sign Into the Hive</h1>
        </div>

        <div className="card-premium">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-premium w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-premium w-full"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🐝 Buzzing Into Hive...' : '🍯 Enter the Hive'}
            </button>
          </form>

          {status && (
            <div className={`mt-4 p-4 rounded ${
              status.includes('Error') 
                ? 'bg-red-900 border border-red-700' 
                : 'bg-green-900 border border-green-700'
            }`}>
              {status}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Not part of the swarm yet?{' '}
              <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-medium">
                🐝 Join the Hive
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}