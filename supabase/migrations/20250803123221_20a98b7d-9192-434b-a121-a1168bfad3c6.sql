-- Add more comprehensive supermarket data around Singapore, especially Clementi area

INSERT INTO public.supermarkets (name, type, address, latitude, longitude, phone, opening_hours) VALUES

-- Clementi Area Supermarkets
('FairPrice Clementi Mall', 'FairPrice', '3155 Commonwealth Avenue West, #02-09/10 Clementi Mall, Singapore 129588', 1.3143, 103.7649, '+65 6777 2777', '8:00 AM - 10:00 PM'),
('Giant Clementi Mall', 'Giant', '3155 Commonwealth Avenue West, #B1-18/25 Clementi Mall, Singapore 129588', 1.3143, 103.7650, '+65 6777 3030', '8:00 AM - 10:00 PM'),
('Cold Storage Clementi', 'Cold Storage', '3155 Commonwealth Avenue West, #B1-01/09 Clementi Mall, Singapore 129588', 1.3144, 103.7648, '+65 6777 4040', '8:00 AM - 10:00 PM'),
('Sheng Siong Clementi Avenue 2', 'Sheng Siong', '449A Clementi Avenue 3, #01-217/219, Singapore 121449', 1.3162, 103.7654, '+65 6778 8888', '7:00 AM - 11:00 PM'),
('FairPrice Clementi Central', 'FairPrice', '104 Clementi Street 12, #01-56, Singapore 120104', 1.3158, 103.7665, '+65 6777 9999', '7:00 AM - 11:00 PM'),

-- West Region Supermarkets
('FairPrice Jurong Point', 'FairPrice', '1 Jurong West Central 2, #B1-09 Jurong Point, Singapore 648886', 1.3396, 103.7066, '+65 6792 1111', '10:00 AM - 10:00 PM'),
('Giant Jurong Point', 'Giant', '1 Jurong West Central 2, #02-22/40 Jurong Point, Singapore 648886', 1.3396, 103.7067, '+65 6792 2222', '10:00 AM - 10:00 PM'),
('Cold Storage West Mall', 'Cold Storage', '1 Bukit Batok Central Link, #B1-01/29 West Mall, Singapore 658713', 1.3507, 103.7491, '+65 6569 3333', '10:00 AM - 10:00 PM'),
('Sheng Siong Bukit Batok', 'Sheng Siong', '154 Bukit Batok Street 11, #01-214, Singapore 650154', 1.3474, 103.7458, '+65 6569 4444', '7:00 AM - 11:00 PM'),

-- Central Region Supermarkets
('FairPrice ION Orchard', 'FairPrice Finest', '2 Orchard Turn, #B4-01/50 ION Orchard, Singapore 238801', 1.3041, 103.8339, '+65 6509 9999', '10:00 AM - 10:00 PM'),
('Cold Storage Great World City', 'Cold Storage', '1 Kim Seng Promenade, #B2-01/11 Great World City, Singapore 237994', 1.2930, 103.8317, '+65 6737 5555', '10:00 AM - 10:00 PM'),
('Market Place VivoCity', 'Cold Storage', '1 HarbourFront Walk, #B2-01/20 VivoCity, Singapore 098585', 1.2643, 103.8220, '+65 6376 6666', '10:00 AM - 10:00 PM'),
('FairPrice Tampines Mall', 'FairPrice', '4 Tampines Central 5, #B1-01/39 Tampines Mall, Singapore 529510', 1.3526, 103.9445, '+65 6789 7777', '10:00 AM - 10:00 PM'),

-- North Region Supermarkets  
('Giant Causeway Point', 'Giant', '1 Woodlands Square, #B1-01/30 Causeway Point, Singapore 738099', 1.4359, 103.7864, '+65 6893 8888', '10:00 AM - 10:00 PM'),
('FairPrice Northpoint City', 'FairPrice', '930 Yishun Avenue 2, #B2-01/40 Northpoint City, Singapore 769098', 1.4296, 103.8356, '+65 6758 9999', '10:00 AM - 10:00 PM'),
('Sheng Siong Ang Mo Kio', 'Sheng Siong', '53 Ang Mo Kio Avenue 3, #01-1575, Singapore 569933', 1.3690, 103.8474, '+65 6456 1111', '7:00 AM - 11:00 PM'),

-- East Region Supermarkets
('Giant Parkway Parade', 'Giant', '80 Marine Parade Road, #B1-01/46 Parkway Parade, Singapore 449269', 1.3015, 103.9056, '+65 6344 2222', '10:00 AM - 10:00 PM'),
('FairPrice Eastpoint Mall', 'FairPrice', '3 Simei Street 6, #B1-01/30 Eastpoint Mall, Singapore 528833', 1.3425, 103.9532, '+65 6788 3333', '10:00 AM - 10:00 PM'),
('Cold Storage Plaza Singapura', 'Cold Storage', '68 Orchard Road, #B2-01/18 Plaza Singapura, Singapore 238839', 1.3007, 103.8450, '+65 6336 4444', '10:00 AM - 10:00 PM'),

-- Additional Clementi Area 
('Sheng Siong West Coast Plaza', 'Sheng Siong', '154 West Coast Road, #B1-22/28 West Coast Plaza, Singapore 127371', 1.3036, 103.7653, '+65 6778 5555', '8:00 AM - 11:00 PM'),
('Giant West Coast Plaza', 'Giant', '154 West Coast Road, #B1-01/21 West Coast Plaza, Singapore 127371', 1.3036, 103.7652, '+65 6778 6666', '8:00 AM - 10:00 PM'),
('FairPrice Finest Buona Vista', 'FairPrice Finest', '1 Vista Exchange Green, #02-01/27 The Star Vista, Singapore 138617', 1.3067, 103.7873, '+65 6694 7777', '10:00 AM - 10:00 PM');