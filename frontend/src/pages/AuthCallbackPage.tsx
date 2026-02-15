import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('umdb_token', token);
      // Force reload to pick up auth state
      window.location.replace('/');
    } else {
      console.error('OAuth error:', error);
      navigate('/?auth_error=1', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🎬</div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
