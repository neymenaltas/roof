import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService, AppUser } from '../../core/services/supabase.service';

const QR_TTL_MS = 60_000;

@Component({
  selector: 'app-member',
  imports: [],
  templateUrl: './member.html',
  styleUrl: './member.scss',
})
export class Member implements OnInit {
  user = signal<AppUser | null>(null);
  loading = signal(true);
  notFound = signal(false);
  expired = signal(false);
  accessDenied = signal(false);

  constructor(private route: ActivatedRoute, private supabase: SupabaseService) {}

  async ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('t');
    if (t && Date.now() - Number(t) > QR_TTL_MS) {
      this.expired.set(true);
      this.loading.set(false);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST301 = RLS/auth error, PGRST116 = no rows found
      if (error.code === 'PGRST301' || error.message?.includes('permission')) {
        this.accessDenied.set(true);
      } else {
        this.notFound.set(true);
      }
    } else if (!data) {
      this.notFound.set(true);
    } else {
      this.user.set(data);
    }

    this.loading.set(false);
  }
}
