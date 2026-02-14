# Implementation Plan - Tadabase Integration & Scheduling Enhancements

# Goal
Enhance the integration with Tadabase to support full data synchronization (Create, Update, Cancel) and improve the Scheduling capabilities (Address handling, Photographer assignment).
The integration will now strictly follow the proven patterns found in `C:\ApolarBot`.

## User Review Required
> [!IMPORTANT]
> **Credentials Update**:
> I will replace the current `.env` credentials with the ones found in `C:\ApolarBot`.
> - **App ID**: `DXQ80qgQYR`
> - **App Key**: `GGnMopK42ONX`
> - **App Secret**: `vqPOTT37VSLfQkBgZGd0ZVajf7Ry4Vkh`
> - **Table ID**: `o6WQb5NnBZ`

## Proposed Changes

### 1. Backend Integration Layer (`lib/tadabase.ts`)
Rewrite `lib/tadabase.ts` to match `ApolarBot`'s logic.
- **Authentication**: Use `X-Tadabase-App-id`, `X-Tadabase-App-Key`, `X-Tadabase-App-Secret`.
- **Field Mappings**:
    - `protocol` -> `field_139` (Referência)
    - `address` -> `field_94` (Object: `{address, city, state, zip}`)
        - **Refinement**: `address` property must be *only* "Street + Number".
        - `city` property = `booking.neighborhood`
        - `state` property = `booking.city`
    - `complement` -> `field_136`
    - `type` -> `field_92` (Map: 'Apartamento'->'Ap', etc.)
    - `area` -> `field_95`
    - `client` -> `field_86` (Use `LOJAS_IDS` map)
    - `status` -> `field_114` (Default 'Pendente')
    - `serviceType` -> `field_110` (Default 'Fotos')
    - **Date/Time**:
        - `time` -> `field_406` (Horario da Sessao)
        - `date` -> `field_103` (Data da Solicitação - verified as best fit or `o6WQbadNnB` if valid ID)
- **Logic**:
    - `syncBooking`: Check if record exists by `field_139` (Protocol). If yes, `PUT`. If no, `POST`.

### 2. Environment Variables
#### [MODIFY] `.env`
- Update credentials to match `ApolarBot`.

### 3. API Endpoints
#### [MODIFY] `app/api/bookings/route.ts`
- Use `tadabase.syncBooking()` for robust syncing.

#### [NEW] `app/api/bookings/[id]/route.ts`
- Implement `PATCH` and `DELETE` to sync updates.

## Phase 3: Advanced Tadabase Integration (Implemented)

### 1. Update Logic (Situation 1)
- [x] Verify if Tadabase API supports `POST` to `/records/{id}` for updates or requires `PUT`.
- [x] Ensure `syncBooking` correctly handles updates when a booking is modified in the Secretary Dashboard.
- **Action**: Create a `PUT` or `PATCH` endpoint for bookings that triggers `syncBooking`.

### 2. Pre-filled Links (Situation 2)
- [x] **Desired Flow**: Client receives link `https://.../agendar?protocol=AG-123`.
- **Backend**:
    - [x] Create `GET /api/tadabase/booking?protocol=...` to fetch record data from Tadabase.
- **Frontend**:
    - [x] Update `BookingForm` to read `protocol` from URL.
    - [x] If present, fetch data from API.
    - [x] Pre-fill fields (Address, Client Name, etc.).
    - [x] Disable/Lock certain fields if needed (e.g., Protocol, Client Name).
    - [x] Allow changing Date/Time.
    - [x] On Submit -> Update existing record (PUT) instead of Create new (POST).
    - [x] **UX Refinements**: Date Pre-selection, Clickable Navigation, Validation.
    - [x] **Advanced Scheduling**: Created strategic plan (`advanced_scheduling_plan.md`) for future implementation.

## Verification Plan

### Automated Tests
- Mock `fetch` to verify `tadabase.syncBooking` calls the correct URL with correct payload.

### Manual Verification
1. **Create Booking**: Use public flow, check if valid data appears in Tadabase `o6WQb5NnBZ`.
2. **Assign Photographer**: In Secretary Dashboard, assign a photographer. Check if it updates the record.
3. **Link Update**: Use `/agendar?protocol=...` link, change data, and verify Tadabase update.
