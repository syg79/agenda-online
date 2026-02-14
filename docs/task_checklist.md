# Task List: Tadabase Integration & Deployment

- [x] Integrate Tadabase.io API
  - [x] Create `lib/tadabase.ts` client
  - [x] Implement `TadabaseService` class with sync methods
  - [x] Connect `POST /api/bookings` to trigger sync
  - [x] User Verification (Version 0.01.0 Released)

# Task Checklist

## Phase 3: Advanced Tadabase Integration (Updates & Pre-filling)
- [ ] **Planning**
  - [ ] Analyze Tadabase API for Updates (PUT/POST)
  - [ ] Design "Pre-filled Link" Architecture (`/agendar?id=...`)
- [x] **Implementation: Sync Updates (Situation 1)**
  - [x] Verify `lib/tadabase.ts` Update Logic (POST vs PUT)
  - [x] Implement `updateBooking` trigger in Secretary Dashboard
  - [x] Fix Status Mapping (Dynamic 'Cancelado'/'Pendente'/'Agendado')
- [x] **Implementation: Pre-filled Forms (Situation 2)**
  - [x] Create API Route to Fetch Tadabase Record (`GET /api/tadabase/record`)
  - [x] Update `BookingForm` to accept `initialData`/`id` param
  - [x] Populate form fields from Tadabase data
- [ ] **Verification**
  - [x] Test Booking Update (Change Date/Time -> Check Tadabase)
  - [x] Test Pre-filled Link (Backend API Responding: 200 OK)
  - [x] **UX Header**: Optimized for mobile/long addresses (Stack layout).
  - [x] **Logic Fix**: Reset availability/slots when Neighborhood changes.
  - [x] **Advanced Scheduling**: Created `advanced_scheduling_plan.md` (Strategy for filtering/optimization).
  - [x] **UX Refinements**: Date Pre-selection, Clickable Navigation, Phone Mask, Email Validation.
  - [x] **Service Fixes**: Fixed Order, "Tour 360", "Drone Combo" persistence, Navigation Reset Fix.
  - [x] **Tadabase Mapping**: Implement Quantity Counters (`field_118`, `field_188`, `field_417`, `field_117`).
  - [x] **Logic Fix**: Reset availability/slots when Neighborhood changes.
  - [x] **Advanced Scheduling**: Created `advanced_scheduling_plan.md` (Strategy for filtering/optimization).
  - [x] **UX Refinements**: Date Pre-selection, Clickable Navigation, Phone Mask, Email Validation.
  - [x] **Service Fixes**: Fixed Order, "Tour 360", "Drone Combo" persistence, Navigation Reset Fix.
  - [x] **Tadabase Mapping**: Implement Quantity Counters (`field_118`, `field_188`, `field_417`, `field_117`).
  - [x] **Drone Logic**: Implemented Mutual Exclusivity (Combo vs Standalone) + Visual Disclaimer (Toast).
  - [x] **Action Buttons**: WhatsApp, Google Calendar (Link), Email on Confirmation.
  - [x] Fix: Duplicate Booking on Update via Form (Root Cause: Tadabase needs POST for updates)
  - [x] **Fix: Availability API 500 Error** (Vercel + Supabase Pooler: `?pgbouncer=true` required)
  - [x] **Apolarbot Feasibility**: Confirmed `main_final.py` uses Playwright + Flask. Requires Docker hosting (Render/Railway). NOT compatible with Vercel.
## Phase 4: Advanced Scheduling (Optimization & Filtering)
- [ ] **Planning**
  - [x] Create Strategy Plan (`advanced_scheduling_plan.md`)
  - [ ] Define Coverage Rules (Neighborhood -> Photographer mapping)
  - [ ] Define Capability Rules (Service -> Photographer mapping)
- [ ] **Implementation: Rules Engine**
  - [ ] Create `lib/scheduling-rules.ts` (Hardcoded rules for MVP)
  - [ ] Implement `filterPhotographersByNeighborhood(neighborhood)`
  - [ ] Implement `filterPhotographersByService(services)`
- [ ] **Implementation: Availability Integration**
  - [ ] Update `getAvailability` to use new filters
  - [ ] Ensure "Sectorization" logic is respected (Photographer only available in neighbor sectors if time allows - Future/Complex)
  - [ ] **MVP Goal**: Just enforce Neighborhood/Service constraints first.
- [ ] **Verification**
  - [ ] Test: Photographer X only appears for Neighborhood Y
  - [ ] Test: Photographer X only appears for Neighborhood Y
  - [ ] Test: Photographer Z (No Drone) doesn't appear for Drone Service

## Phase 5: Future Roadmap (Derivative Projects)
1. **Apolarbot Automation (Python/Render)**
   - *Status*: Feasibility Plan Created (`apolarbot_render_plan.md`).
   - *Goal*: Heavy background automation (scraping, night optimization).
2. **Real-Time Calendar Sync (Google API)**
   - *Status*: Concept discussed.
   - *Goal*: Create/Edit/Delete events directly in user's Google Calendar via Server-to-Server API (OAuth2).
3. **Official WhatsApp API Integration**
   - *Status*: Concept discussed.
   - *Goal*: Send automated confirmations/reminders without manual clicks (Requires Meta Business verify).
4. **Tadabase Real-Time Updates (Webhooks)**
   - *Status*: Concept discussed.
   - *Goal*: Use Tadabase Outgoing Webhooks to trigger immediate updates in Agenda Online (Bi-directional sync).

