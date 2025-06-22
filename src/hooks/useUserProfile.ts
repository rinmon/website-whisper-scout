
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          // プロファイルが見つからない場合はデフォルト値を設定
          setProfile({
            id: user.id,
            full_name: user.email?.split('@')[0] || 'ユーザー',
            avatar_url: null,
            role: 'user',
            email: user.email
          });
        } else {
          setProfile({
            ...data,
            email: user.email
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setProfile({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'ユーザー',
          avatar_url: null,
          role: 'user',
          email: user.email
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};
