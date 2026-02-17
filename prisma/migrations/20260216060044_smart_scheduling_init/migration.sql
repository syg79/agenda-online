-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Curitiba',
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'PR',
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Photographer" ADD COLUMN     "baseLat" DOUBLE PRECISION DEFAULT -25.4284,
ADD COLUMN     "baseLng" DOUBLE PRECISION DEFAULT -49.2733,
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "neighborhoods" JSONB,
ADD COLUMN     "travelRadius" INTEGER DEFAULT 15;

-- CreateTable
CREATE TABLE "CoverageArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaType" TEXT NOT NULL DEFAULT 'auto',
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoverageArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteCache" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteCache_origin_destination_key" ON "RouteCache"("origin", "destination");

-- ============================================
-- VIEWS PARA A SECRETÁRIA (Adapted for Prisma Schema)
-- ============================================

-- View: Pedidos pendentes (precisam agendar)
CREATE OR REPLACE VIEW "v_pending_orders" AS
SELECT 
  b.*,
  -- Quantos dias esperando
  CURRENT_DATE - b."createdAt"::date AS days_waiting
FROM "Booking" b
WHERE b."status" = 'PENDING'
  AND b."latitude" IS NOT NULL
ORDER BY b."createdAt" ASC;

-- View: Agenda do dia com detalhes
CREATE OR REPLACE VIEW "v_schedule_detail" AS
SELECT
  b."date" as "scheduled_date",
  -- Extract slot from time string "HH:MM" -> (HH - 8)
  CAST(SPLIT_PART(b."time", ':', 1) AS INTEGER) - 8 AS "scheduled_slot",
  b."time" AS horario,
  p."id" AS "photographer_id",
  p."name" AS "photographer_name",
  p."color" AS "photographer_color",
  b."id" AS "order_id",
  b."clientName",
  b."address",
  b."neighborhood",
  b."latitude",
  b."longitude",
  b."status",
  b."duration",
  b."services"
FROM "Booking" b
JOIN "Photographer" p ON p."id" = b."photographerId"
WHERE b."status" IN ('CONFIRMED', 'COMPLETED', 'IN_PROGRESS')
ORDER BY b."date", p."id", b."time";

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Verificar se ponto está na área de cobertura
CREATE OR REPLACE FUNCTION check_coverage(
  check_lat DOUBLE PRECISION,
  check_lng DOUBLE PRECISION
)
RETURNS TABLE (
  area_name TEXT,
  area_type TEXT,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca."name",
    ca."areaType",
    ROUND(
      (6371 * ACOS(
        LEAST(1.0, GREATEST(-1.0, 
          COS(RADIANS(check_lat)) * COS(RADIANS(ca."centerLat")) *
          COS(RADIANS(ca."centerLng") - RADIANS(check_lng)) +
          SIN(RADIANS(check_lat)) * SIN(RADIANS(ca."centerLat"))
        ))
      ))::NUMERIC, 2
    ) AS distance_km
  FROM "CoverageArea" ca
  WHERE ca."isActive" = TRUE
    AND (6371 * ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(check_lat)) * COS(RADIANS(ca."centerLat")) *
        COS(RADIANS(ca."centerLng") - RADIANS(check_lng)) +
        SIN(RADIANS(check_lat)) * SIN(RADIANS(ca."centerLat"))
      ))
    )) <= ca."radiusKm"
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- Buscar slots livres de um fotógrafo em uma data
CREATE OR REPLACE FUNCTION get_free_slots(
  target_date TIMESTAMP(3),
  photo_id TEXT
)
RETURNS TABLE (
  slot INTEGER,
  horario TEXT,
  is_free BOOLEAN,
  adjacent_order_id TEXT,
  adjacent_order_lat DOUBLE PRECISION,
  adjacent_order_lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH all_slots AS (
    SELECT generate_series(0, 9) AS s
  ),
  occupied AS (
    SELECT 
      CAST(SPLIT_PART(b."time", ':', 1) AS INTEGER) - 8 AS s,
      b."id",
      b."latitude",
      b."longitude",
      CAST(CEIL(b."duration" / 60.0) AS INTEGER) as estimated_duration
    FROM "Booking" b
    WHERE b."date" = target_date
      AND b."photographerId" = photo_id
      AND b."status" IN ('CONFIRMED')
  )
  SELECT
    a.s AS slot,
    LPAD((8 + a.s)::TEXT, 2, '0') || ':00' AS horario,
    occ.id IS NULL AS is_free,
    -- Pegar o agendamento do slot anterior ou posterior (para calcular distância)
    COALESCE(
      (SELECT id FROM occupied WHERE s = a.s - 1 LIMIT 1),
      (SELECT id FROM occupied WHERE s = a.s + 1 LIMIT 1)
    ) AS adjacent_order_id,
    COALESCE(
      (SELECT latitude FROM occupied WHERE s = a.s - 1 LIMIT 1),
      (SELECT latitude FROM occupied WHERE s = a.s + 1 LIMIT 1)
    ) AS adjacent_order_lat,
    COALESCE(
      (SELECT longitude FROM occupied WHERE s = a.s - 1 LIMIT 1),
      (SELECT longitude FROM occupied WHERE s = a.s + 1 LIMIT 1)
    ) AS adjacent_order_lng
  FROM all_slots a
  LEFT JOIN occupied occ ON occ.s = a.s
  ORDER BY a.s;
END;
$$ LANGUAGE plpgsql STABLE;

-- Buscar os melhores slots para um endereço (para o cliente)
CREATE OR REPLACE FUNCTION find_best_slots(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 10,
  days_ahead INTEGER DEFAULT 14
)
RETURNS TABLE (
  suggested_date TIMESTAMP(3), -- Changed to match Booking.date type
  photographer_id TEXT,
  photographer_name TEXT,
  slot INTEGER,
  horario TEXT,
  nearby_distance_km NUMERIC,
  slot_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(
      CURRENT_DATE + 1,
      CURRENT_DATE + days_ahead,
      '1 day'::interval
    )::timestamp(3) AS d -- Cast to match Booking.date
  ),
  all_possibilities AS (
    SELECT
      dr.d AS the_date,
      p."id" AS p_id,
      p."name" AS p_name,
      gs.s AS the_slot,
      -- Verificar se slot está livre
      NOT EXISTS (
        SELECT 1 FROM "Booking" b
        WHERE b."date" = dr.d
          AND b."photographerId" = p."id"
          AND CAST(SPLIT_PART(b."time", ':', 1) AS INTEGER) - 8 = gs.s
          AND b."status" IN ('CONFIRMED')
      ) AS slot_free,
      -- Distância para o agendamento mais próximo do mesmo fotógrafo no dia
      (
        SELECT MIN(
          6371 * ACOS(
            LEAST(1.0, GREATEST(-1.0,
              COS(RADIANS(target_lat)) * COS(RADIANS(b2."latitude")) *
              COS(RADIANS(b2."longitude") - RADIANS(target_lng)) +
              SIN(RADIANS(target_lat)) * SIN(RADIANS(b2."latitude"))
            ))
          )
        )
        FROM "Booking" b2
        WHERE b2."date" = dr.d
          AND b2."photographerId" = p."id"
          AND b2."status" IN ('CONFIRMED')
          AND b2."latitude" IS NOT NULL
      ) AS nearest_km,
      -- Contar agendamentos no dia
      (
        SELECT COUNT(*)
        FROM "Booking" b3
        WHERE b3."date" = dr.d
          AND b3."photographerId" = p."id"
          AND b3."status" IN ('CONFIRMED')
      ) AS day_count
    FROM date_range dr
    CROSS JOIN "Photographer" p
    CROSS JOIN (SELECT generate_series(0, 9) AS s) gs
    WHERE p."active" = TRUE
  )
  SELECT
    ap.the_date,
    ap.p_id,
    ap.p_name,
    ap.the_slot,
    LPAD((8 + ap.the_slot)::TEXT, 2, '0') || ':00',
    ROUND(COALESCE(ap.nearest_km, 999)::NUMERIC, 2),
    -- Score: combinar distância + posição na agenda
    ROUND((
      COALESCE(ap.nearest_km, 50) * 1.0 +            -- distância pesa
      ABS(ap.the_slot - 4) * 0.5 +                     -- preferir meio do dia
      (EXTRACT(DAY FROM (ap.the_date - CURRENT_DATE))) * 0.3 + -- preferir mais cedo
      CASE WHEN ap.day_count = 0 THEN 20 ELSE 0 END    -- penalizar dia vazio
    )::NUMERIC, 2)
  FROM all_possibilities ap
  WHERE ap.slot_free = TRUE
    AND (ap.nearest_km IS NULL OR ap.nearest_km <= max_distance_km)
  ORDER BY 7 ASC  -- score
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;
