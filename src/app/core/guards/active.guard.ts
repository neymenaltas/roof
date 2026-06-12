import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { ADMIN_EMAILS } from '../constants';

export const activeGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabase.getSession();
  if (!data.session) return router.createUrlTree(['/login']);

  if (ADMIN_EMAILS.includes(data.session.user.email!)) return true;

  const status = await supabase.getCurrentUserStatus();
  if (status === 'active') return true;

  return router.createUrlTree(['/']);
};
