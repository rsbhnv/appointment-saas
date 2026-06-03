-- קליניקה אודליה: שירות יחיד פעיל — עיסוי משולב

update public.services
set active = false,
    updated_at = now()
where business_id = (
  select id from public.businesses where slug = 'odelia-clinic' limit 1
)
  and name in ('טיפול פנים', 'ייעוץ ראשוני');

insert into public.services (
  business_id,
  name,
  description,
  duration_minutes,
  price,
  currency,
  buffer_before_minutes,
  buffer_after_minutes,
  capacity,
  requires_payment,
  deposit_amount,
  active
)
select
  b.id,
  'עיסוי משולב',
  'עיסוי משולב — השירות היחיד בקליניקה.',
  60,
  350,
  'ILS',
  0,
  0,
  1,
  false,
  null,
  true
from public.businesses b
where b.slug = 'odelia-clinic'
  and not exists (
    select 1
    from public.services s
    where s.business_id = b.id
      and s.name = 'עיסוי משולב'
  );
