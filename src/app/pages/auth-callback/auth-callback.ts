import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

const NEW_USER_THRESHOLD_MS = 30_000; // 30 saniye içinde oluşturulduysa yeni kullanıcı

@Component({
  selector: 'app-auth-callback',
  imports: [],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100dvh;background:var(--bg)">
      <div style="display:flex;flex-direction:column;align-items:center;gap:1rem">
        <div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--text);border-radius:50%;animation:spin .7s linear infinite"></div>
        <p style="color:var(--text-2);font-size:.9rem">Giriş yapılıyor…</p>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();

    if (!data.session) {
      this.router.navigate(['/login']);
      return;
    }

    const from = this.route.snapshot.queryParamMap.get('from');

    if (from === 'register') {
      const createdAt = new Date(data.session.user.created_at).getTime();
      const isNewUser = Date.now() - createdAt < NEW_USER_THRESHOLD_MS;

      if (!isNewUser) {
        // Mevcut kullanıcı register'dan geldi → login'e yönlendir
        await this.supabase.signOut();
        this.router.navigate(['/login'], { queryParams: { existing: '1' } });
        return;
      }
    }

    this.router.navigate(['/']);
  }
}
