import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { ADMIN_EMAILS } from '../../core/constants';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  avatarFile: File | null = null;
  avatarPreview = signal<string | null>(null);
  error = signal('');
  loading = signal(false);
  success = signal(false);

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    if (data.session) this.router.navigate(['/']);
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async register() {
    this.error.set('');

    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.error.set('Tüm alanlar gereklidir.');
      return;
    }

    if (ADMIN_EMAILS.includes(this.email.toLowerCase())) {
      this.error.set('Bu email adresi ile kayıt olunamaz.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Şifreler eşleşmiyor.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`;

    this.loading.set(true);
    const { data, error } = await this.supabase.signUpWithEmail(this.email, this.password, fullName);

    if (error) {
      this.loading.set(false);
      console.error('signup error:', error.status, error.message, (error as any).code);
      this.error.set(this.isEmailTakenError(error) ? 'Bu email adresi zaten kayıtlı.' : 'Kayıt olunamadı. Lütfen tekrar deneyin.');
      return;
    }

    // Profil fotoğrafı yükle (session varsa)
    if (data.session && this.avatarFile) {
      const url = await this.supabase.uploadAvatar(data.session.user.id, this.avatarFile);
      if (url) await this.supabase.updateUserAvatar(data.session.user.id, url);
    }

    this.loading.set(false);

    if (data.session) {
      this.router.navigate(['/']);
    } else {
      this.success.set(true);
    }
  }

  private isEmailTakenError(error: any): boolean {
    const msg = error.message?.toLowerCase() ?? '';
    const code = error.code?.toLowerCase() ?? '';
    return (
      error.status === 422 ||
      code.includes('already') ||
      code === 'user_already_exists' ||
      code === 'email_exists' ||
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('already in use') ||
      msg.includes('already taken') ||
      msg.includes('email address is already')
    );
  }

  signInWithGoogle() {
    this.supabase.signInWithGoogle('register');
  }
}
