import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(username, password);
      else await register(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-iwa-chat">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-iwa-accent flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg">
            💬
          </div>
          <h1 className="text-3xl font-bold text-iwa-text">iWa</h1>
          <p className="text-iwa-subtext mt-1">Modern Messenger</p>
        </div>

        {/* Form */}
        <div className="bg-iwa-sidebar rounded-2xl p-8 shadow-xl border border-iwa-border">
          <h2 className="text-xl font-semibold text-iwa-text mb-6 text-center">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-iwa-subtext text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-iwa-input border border-iwa-border rounded-lg px-4 py-3 text-iwa-text placeholder-iwa-subtext focus:outline-none focus:border-iwa-accent transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-iwa-subtext text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-iwa-input border border-iwa-border rounded-lg px-4 py-3 text-iwa-text placeholder-iwa-subtext focus:outline-none focus:border-iwa-accent transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-iwa-accent hover:bg-blue-600 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-iwa-subtext text-sm mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-iwa-accent hover:underline"
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
