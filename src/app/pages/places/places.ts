import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Place, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-places',
  imports: [],
  templateUrl: './places.html',
  styleUrl: './places.scss',
})
export class Places implements OnInit {
  places = signal<Place[]>([]);
  expandedPlaceId = signal<string | null>(null);

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    this.places.set(await this.supabase.getAllPlaces(true));
  }

  toggle(placeId: string) {
    this.expandedPlaceId.set(this.expandedPlaceId() === placeId ? null : placeId);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
