-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_activities (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
staff_id uuid NOT NULL,
action text NOT NULL,
request_id uuid,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT admin_activities_pkey PRIMARY KEY (id),
CONSTRAINT admin_activities_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.profiles(id),
CONSTRAINT admin_activities_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id)
);
CREATE TABLE public.aircraft_classes (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
name text NOT NULL UNIQUE,
priority integer,
price_per_km_min numeric,
price_per_km_max numeric,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT aircraft_classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.aircraft_listings (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
title text NOT NULL,
description text,
aircraft_type_id uuid,
registration_number text,
year integer,
price numeric,
currency_code text DEFAULT 'USD'::text,
images jsonb,
specifications jsonb,
status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'sold'::text, 'inactive'::text])),
created_by uuid,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT aircraft_listings_pkey PRIMARY KEY (id),
CONSTRAINT aircraft_listings_aircraft_type_id_fkey FOREIGN KEY (aircraft_type_id) REFERENCES public.aircraft_types(id),
CONSTRAINT aircraft_listings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.aircraft_types (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
name text NOT NULL,
icao text UNIQUE,
slug text UNIQUE,
aircraft_class_id uuid,
manufacturer_name text,
range_maximum integer,
altitude integer,
pax_maximum integer,
cabin_height numeric,
cabin_length numeric,
cabin_width numeric,
luggage_volume numeric,
images jsonb,
description text,
cruise_speed_kt integer,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT aircraft_types_pkey PRIMARY KEY (id),
CONSTRAINT aircraft_types_aircraft_class_id_fkey FOREIGN KEY (aircraft_class_id) REFERENCES public.aircraft_classes(id)
);
CREATE TABLE public.airports (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
icao text NOT NULL UNIQUE,
iata text,
lid text,
name text NOT NULL,
slug text UNIQUE,
city text,
country text,
country_code text,
latitude numeric,
longitude numeric,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT airports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contacts (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
name text NOT NULL,
email text NOT NULL,
phone text,
message text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
request_id uuid,
invoice_id uuid,
user_id uuid NOT NULL,
title text,
file_url text NOT NULL,
type text CHECK (type = ANY (ARRAY['payment_receipt'::text, 'contract'::text, 'final_confirmation'::text, 'other'::text])),
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT documents_pkey PRIMARY KEY (id),
CONSTRAINT documents_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id),
CONSTRAINT documents_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.empty_legs (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
source text NOT NULL CHECK (source = ANY (ARRAY['admin'::text, 'pexjet'::text])),
is_public boolean DEFAULT false,
aircraft_type text,
aircraft_type_id uuid,
dep_airport_id uuid,
arr_airport_id uuid,
dep_airport_icao text,
arr_airport_icao text,
dep_iata text,
arr_iata text,
from_date_utc timestamp with time zone NOT NULL,
to_date_utc timestamp with time zone NOT NULL,
price_type USER-DEFINED DEFAULT 'fixed'::price_type,
price numeric,
currency_code text DEFAULT 'USD'::text,
comment text,
destination_image_url text,
destination_description text,
created_by uuid,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT empty_legs_pkey PRIMARY KEY (id),
CONSTRAINT empty_legs_aircraft_type_id_fkey FOREIGN KEY (aircraft_type_id) REFERENCES public.aircraft_types(id),
CONSTRAINT empty_legs_dep_airport_id_fkey FOREIGN KEY (dep_airport_id) REFERENCES public.airports(id),
CONSTRAINT empty_legs_arr_airport_id_fkey FOREIGN KEY (arr_airport_id) REFERENCES public.airports(id),
CONSTRAINT empty_legs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.invitations (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
email text NOT NULL,
token text NOT NULL UNIQUE,
role text NOT NULL CHECK (role = 'staff'::text),
invited_by uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
expires_at timestamp with time zone NOT NULL,
used_at timestamp with time zone,
CONSTRAINT invitations_pkey PRIMARY KEY (id),
CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.invoices (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
request_id uuid NOT NULL,
amount numeric NOT NULL,
currency_code text DEFAULT 'USD'::text,
bank_details jsonb,
reference_code text UNIQUE,
status text NOT NULL DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'paid'::text, 'cancelled'::text])),
sent_at timestamp with time zone DEFAULT now(),
paid_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT invoices_pkey PRIMARY KEY (id),
CONSTRAINT invoices_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id)
);
CREATE TABLE public.messages (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
request_id uuid NOT NULL,
sender_id uuid NOT NULL,
content text NOT NULL,
attachment_urls ARRAY,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT messages_pkey PRIMARY KEY (id),
CONSTRAINT messages_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id),
CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
invoice_id uuid NOT NULL,
amount numeric NOT NULL,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text])),
reference text,
receipt_urls ARRAY,
confirmed_at timestamp with time zone,
confirmed_by uuid,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT payments_pkey PRIMARY KEY (id),
CONSTRAINT payments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id),
CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.profiles (
id uuid NOT NULL,
phone text,
country text,
onboarding_completed boolean DEFAULT false,
role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'staff'::text, 'manager'::text])),
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT profiles_pkey PRIMARY KEY (id),
CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.requests (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
type USER-DEFINED NOT NULL,
status USER-DEFINED DEFAULT 'open'::request_status,
user_id uuid NOT NULL,
assigned_staff_id uuid,
details jsonb NOT NULL,
price_agreed numeric,
currency_code text DEFAULT 'USD'::text,
estimated_flight_time_minutes integer,
confirmation_document_data jsonb,
confirmation_document_sent_at timestamp with time zone,
closed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT requests_pkey PRIMARY KEY (id),
CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
CONSTRAINT requests_assigned_staff_id_fkey FOREIGN KEY (assigned_staff_id) REFERENCES public.profiles(id)
);
