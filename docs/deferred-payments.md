## Déploiement paiement différé – migrations à exécuter

Ces étapes doivent être appliquées sur Supabase avant de déployer les dernières modifications front/back liées aux paiements différés.

### 1. Nouvelle table `stripe_pending_capture`

```sql
create table if not exists public.stripe_pending_capture (
  id bigint generated always as identity primary key,
  payment_intent_id text not null unique,
  passenger_account_id bigint references public.account(id),
  driver_account_id text not null,
  trip_id bigint not null,
  booking_ids jsonb not null default '[]'::jsonb,
  amount integer not null,
  capture_after timestamptz not null,
  status text not null default 'requires_capture',
  charge_id text,
  captured_at timestamptz,
  canceled_at timestamptz,
  inserted_at timestamptz not null default timezone('utc', now())
);
```

### 2. Colonnes supplémentaires dans `booking`

```sql
alter table public.booking
  add column if not exists payment_intent_id text,
  add column if not exists payment_status text,
  add column if not exists payment_capture_after timestamptz;
```

`payment_status` est utilisé côté front pour suivre les réservations payées en crédits (`wallet_reserved`, `wallet_released`) ainsi que les captures Stripe (`requires_capture`).

### 3. Requêtes autorisées depuis le front

Les requêtes publiques utilisées par l’application :
- `select`/`update` sur `booking.payment_status`, `payment_capture_after`, `payment_intent_id`
- `insert`/`select`/`update` sur `stripe_pending_capture`

Adapter vos policies RLS pour n’autoriser que le propriétaire (`passenger_account_id`) à lire ses lignes, et le serveur Node (service key) pour les insert/update.

### 4. Rappels backend

- le serveur `serveur-mae-covoit-ekko` doit utiliser la clé service Supabase pour manipuler `stripe_pending_capture`.
- configurez la variable d’environnement `STRIPE_WEBHOOK_SECRET` et l’URL `/webhook` côté Stripe pour suivre les refunds.

Une fois ces migrations en place, le front peut afficher correctement les soldes “disponibles” vs “réservés” et la logique d’annulation automatique (profil) fonctionne sans erreurs.
