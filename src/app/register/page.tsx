'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BeeSwarm from '@/components/BeeSwarm';
import HoneycombBackground from '@/components/HoneycombBackground';
import BeeCursor from '@/components/BeeCursor';
import BeehiveBackground from '@/components/BeehiveBackground';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    if (formData.password !== formData.confirmPassword) {
      setStatus('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Error: Registration failed');
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
          <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">🐝 Join the Swarm</h1>
        </div>

        <div className="card-premium">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-premium w-full"
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

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
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-premium w-full"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🐝 Building Your Honeycomb...' : '🍯 Join the Hive'}
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
              Already part of the swarm?{' '}
              <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
                🍯 Enter the Hive
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}