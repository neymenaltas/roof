import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppUser, Place, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  activeTab = signal<'users' | 'places'>('users');

  users = signal<AppUser[]>([]);
  places = signal<Place[]>([]);

  newPlaceName = '';
  newCampaignTexts: Record<string, string> = {};
  expandedPlaceId = signal<string | null>(null);

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadUsers();
    await this.loadPlaces();
  }

  // ── Tab ────────────────────────────────────────────────

  setTab(tab: 'users' | 'places') {
    this.activeTab.set(tab);
  }

  // ── Users ──────────────────────────────────────────────

  async loadUsers() {
    this.users.set(await this.supabase.getAllUsers());
  }

  async activate(userId: string) {
    await this.supabase.updateUserStatus(userId, 'active');
    await this.loadUsers();
  }

  async deactivate(userId: string) {
    await this.supabase.updateUserStatus(userId, 'passive');
    await this.loadUsers();
  }

  async deleteUser(userId: string) {
    await this.supabase.deleteUser(userId);
    await this.loadUsers();
  }

  // ── Places ─────────────────────────────────────────────

  async loadPlaces() {
    this.places.set(await this.supabase.getAllPlaces());
  }

  async addPlace() {
    const name = this.newPlaceName.trim();
    if (!name) return;
    await this.supabase.addPlace(name);
    this.newPlaceName = '';
    await this.loadPlaces();
  }

  async setPlaceStatus(placeId: string, status: 'active' | 'passive') {
    await this.supabase.updatePlaceStatus(placeId, status);
    await this.loadPlaces();
  }

  async deletePlace(placeId: string) {
    await this.supabase.deletePlace(placeId);
    await this.loadPlaces();
  }

  togglePlace(placeId: string) {
    this.expandedPlaceId.set(this.expandedPlaceId() === placeId ? null : placeId);
  }

  // ── Campaigns ──────────────────────────────────────────

  async addCampaign(placeId: string) {
    const text = (this.newCampaignTexts[placeId] ?? '').trim();
    if (!text) return;
    await this.supabase.addCampaign(placeId, text);
    this.newCampaignTexts[placeId] = '';
    await this.loadPlaces();
  }

  async deleteCampaign(campaignId: string) {
    await this.supabase.deleteCampaign(campaignId);
    await this.loadPlaces();
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
