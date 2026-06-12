import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = '';
  password = '';
  error = signal('');
  info = signal('');
  loading = signal(false);

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    if (data.session) this.router.navigate(['/']);

    if (this.route.snapshot.queryParamMap.get('existing') === '1') {
      this.info.set('Bu email adresi zaten kayıtlı. Lütfen giriş yapın.');
    }
  }

  async signInWithEmail() {
    this.error.set('');
    this.info.set('');
    if (!this.email || !this.password) {
      this.error.set('Email ve şifre gereklidir.');
      return;
    }
    this.loading.set(true);
    const { error } = await this.supabase.signInWithEmail(this.email, this.password);
    this.loading.set(false);

    if (error) {
      this.error.set('Email veya şifre hatalı.');
    } else {
      this.router.navigate(['/']);
    }
  }

  signInWithGoogle() {
    this.supabase.signInWithGoogle('login');
  }
}
