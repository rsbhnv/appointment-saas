-- Update public booking description for Odelia clinic (slug-based, not hard-coded in app UI).

update public.businesses
set
  description = 'עיסוי רפואי, דיקור, רפלקסולוגיה ועוד',
  updated_at = now()
where slug = 'odelia-clinic';
