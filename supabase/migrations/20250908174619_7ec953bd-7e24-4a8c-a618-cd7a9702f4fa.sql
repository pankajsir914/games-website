-- Storage setup for admin payment methods and payment proofs
-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('payment-qr-codes', 'payment-qr-codes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Policies for payment-qr-codes (public QR images uploaded by admins)
create policy "Public read QR codes"
  on storage.objects for select
  using (bucket_id = 'payment-qr-codes');

create policy "Admins upload QR codes"
  on storage.objects for insert
  with check (bucket_id = 'payment-qr-codes' and is_admin_user(auth.uid()));

create policy "Admins update QR codes"
  on storage.objects for update
  using (bucket_id = 'payment-qr-codes' and is_admin_user(auth.uid()))
  with check (bucket_id = 'payment-qr-codes' and is_admin_user(auth.uid()));

create policy "Admins delete QR codes"
  on storage.objects for delete
  using (bucket_id = 'payment-qr-codes' and is_admin_user(auth.uid()));

-- Policies for payment-proofs (private; users upload and view their own, admins can view all)
create policy "Users upload own payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own payment proofs"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins read all payment proofs"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs' and is_admin_user(auth.uid())
  );