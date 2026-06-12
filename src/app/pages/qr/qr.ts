import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr',
  imports: [],
  templateUrl: './qr.html',
  styleUrl: './qr.scss',
})
export class Qr implements OnInit, OnDestroy {
  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  countDown = signal(60);
  expired = signal(false);

  private userId = '';
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    this.userId = data.session?.user.id ?? '';
    await this.generate();
    this.startCountdown();
  }

  async generate() {
    const url = `${window.location.origin}/member/${this.userId}?t=${Date.now()}`;
    await QRCode.toCanvas(this.qrCanvas.nativeElement, url, { width: 256 });
  }

  startCountdown() {
    if (this.interval) clearInterval(this.interval);
    this.countDown.set(60);
    this.expired.set(false);

    this.interval = setInterval(() => {
      const next = this.countDown() - 1;
      if (next <= 0) {
        this.countDown.set(0);
        this.expired.set(true);
        clearInterval(this.interval!);
      } else {
        this.countDown.set(next);
      }
    }, 1000);
  }

  async refresh() {
    await this.generate();
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
