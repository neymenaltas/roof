import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser, SupabaseService } from '../../core/services/supabase.service';
import { ADMIN_EMAILS } from '../../core/constants';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  status = signal<'passive' | 'active' | 'admin' | null>(null);
  user = signal<AppUser | null>(null);
  avatarUploading = signal(false);

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    if (!data.session) return;

    if (ADMIN_EMAILS.includes(data.session.user.email!)) {
      this.status.set('admin');
    } else {
      const s = await this.supabase.getCurrentUserStatus();
      this.status.set(s);
    }

    const users = await this.supabase.getAllUsers();
    const me = users.find(u => u.id === data.session!.user.id) ?? null;
    this.user.set(me);
  }

  async onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.avatarUploading.set(true);
    const { data } = await this.supabase.getSession();
    if (!data.session) { this.avatarUploading.set(false); return; }

    const url = await this.supabase.uploadAvatar(data.session.user.id, file);
    if (url) {
      await this.supabase.updateUserAvatar(data.session.user.id, url);
      this.user.update(u => u ? { ...u, avatar_url: url } : u);
    }
    this.avatarUploading.set(false);
    (event.target as HTMLInputElement).value = '';
  }

  goToQr() { this.router.navigate(['/qr']); }
  goToPlaces() { this.router.navigate(['/places']); }
  goToAdmin() { this.router.navigate(['/admin']); }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
