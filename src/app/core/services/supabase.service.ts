import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  status: 'passive' | 'active';
  created_at: string;
}

export interface Campaign {
  id: string;
  place_id: string;
  description: string;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  status: 'active' | 'passive';
  created_at: string;
  campaigns?: Campaign[];
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  get client() {
    return this.supabase;
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }

  signInWithGoogle(from: 'login' | 'register' = 'login') {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?from=${from}`,
        queryParams: { prompt: 'select_account' },
      },
    });
  }

  signInWithEmail(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUpWithEmail(email: string, password: string, fullName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  }

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error } = await this.supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (error) { console.error('avatar upload error:', error); return null; }

    const { data } = this.supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  async updateUserAvatar(userId: string, avatarUrl: string) {
    await this.supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
    await this.supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  // ── Users ──────────────────────────────────────────────

  async getCurrentUserStatus(): Promise<'passive' | 'active' | null> {
    const { data: sessionData } = await this.getSession();
    if (!sessionData.session) return null;

    const { data } = await this.supabase
      .from('users')
      .select('status')
      .eq('id', sessionData.session.user.id)
      .single();

    return data?.status ?? null;
  }

  async getAllUsers(): Promise<AppUser[]> {
    const { data } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return data ?? [];
  }

  async updateUserStatus(userId: string, status: 'passive' | 'active') {
    return this.supabase.from('users').update({ status }).eq('id', userId);
  }

  async deleteUser(userId: string) {
    return this.supabase.from('users').delete().eq('id', userId);
  }

  // ── Places ─────────────────────────────────────────────

  async getAllPlaces(activeOnly = false): Promise<Place[]> {
    let query = this.supabase
      .from('places')
      .select('*, campaigns(*)')
      .order('created_at', { ascending: true });

    if (activeOnly) query = query.eq('status', 'active');

    const { data } = await query;

    return (data ?? []).map((p: any) => ({
      ...p,
      campaigns: (p.campaigns ?? []).sort(
        (a: Campaign, b: Campaign) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));
  }

  async addPlace(name: string) {
    return this.supabase.from('places').insert({ name });
  }

  async updatePlaceStatus(id: string, status: 'active' | 'passive') {
    return this.supabase.from('places').update({ status }).eq('id', id);
  }

  async deletePlace(id: string) {
    return this.supabase.from('places').delete().eq('id', id);
  }

  // ── Campaigns ──────────────────────────────────────────

  async addCampaign(placeId: string, description: string) {
    return this.supabase.from('campaigns').insert({ place_id: placeId, description });
  }

  async deleteCampaign(id: string) {
    return this.supabase.from('campaigns').delete().eq('id', id);
  }
}
