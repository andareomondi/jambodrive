# Cosmara

Car rental, airport pickups, wedding car bookings and the gallery for Cosmara
(Cozy Mobility Tours), at cosmara.co.ke.

## Stack

- Next.js (App Router) and React
- Supabase (Postgres, Auth, Storage, Realtime, pg_cron)
- Tailwind CSS and shadcn/ui components
- M-Pesa Daraja (STK push) for payments
- Resend for transactional email

## Surfaces

| Surface | Host | Serves |
| --- | --- | --- |
| Main site | `cosmara.co.ke` | Shop, cars, airport pickups, wedding events, customer dashboard |
| Gallery | `gallery.cosmara.co.ke` | Event gallery |
| Admin | `admin.cosmara.co.ke` | Fleet, bookings, users, pickups, gallery (super admins) |
| Operations | `facilitator.cosmara.co.ke` | Deliveries and pickups for drivers and staff (facilitators) |

Routing lives in `lib/routing/surfaces.ts` and `lib/supabase/proxy.ts`.

## Development

```bash
npm install
cp .env.example .env.local   # fill in the values listed below
npm run dev                  # http://localhost:3000, admin at http://admin.localhost:3000
```

### Environment variables

| Name | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | M-Pesa callback (server only) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `cosmara.co.ke` in production; unset in development |
| `MPESA_CALLBACK_SECRET` | Authenticates Daraja callbacks |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Payment confirmation emails (server only) |

## Scripts

- `npm run dev`, `npm run build`, `npm run start`
- `npm run typecheck`
- `npm run lint`
- `npm test`

## Database

Schema changes live in `supabase/migrations/`. Apply them in order in the Supabase SQL editor or with the Supabase CLI.
