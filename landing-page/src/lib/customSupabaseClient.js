const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const supabase = {
  functions: {
    invoke: async (name, options = {}) => {
      if (name !== 'subscribe') {
        return { data: null, error: { message: `Unsupported function: ${name}` } };
      }
      const body = options.body || {};
      try {
        const resp = await fetch(`${API_BASE_URL}/public/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return { data: null, error: { message: data.error || 'Request failed' } };
        }
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message || 'Network error' } };
      }
    },
  },
};
