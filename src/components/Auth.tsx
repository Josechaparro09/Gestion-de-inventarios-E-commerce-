// src/components/Auth.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { signIn, signUp } from '../lib/supabase';
export function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
        showToast({
          message: error.message,
          type: 'error'
        });
        return;
      }

      showToast({
        message: isSignUp ? 'Registro exitoso' : 'Inicio de sesión exitoso',
        type: 'success'
      });

      // Navigate to the main app after successful authentication
      navigate('/products/list');
    } catch (err: any) {
      setError(err.message);
      showToast({
        message: err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <img src="/images/Netxel.svg" alt="Netxel" className="h-12 mx-auto" />
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Correo"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : (isSignUp ? 'Registrarse' : 'Iniciar sesión')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-sm text-teal-600 hover:text-teal-500"
            >
              {isSignUp 
                ? '¿Ya tienes una cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}