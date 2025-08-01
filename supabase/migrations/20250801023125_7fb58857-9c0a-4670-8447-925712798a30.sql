-- Create supermarkets table to store real supermarket locations
CREATE TABLE public.supermarkets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type TEXT NOT NULL,
  phone TEXT,
  opening_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.supermarkets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read supermarkets (public data)
CREATE POLICY "Supermarkets are viewable by everyone" 
ON public.supermarkets 
FOR SELECT 
USING (true);

-- Create index for faster location-based queries
CREATE INDEX idx_supermarkets_location ON public.supermarkets (latitude, longitude);

-- Insert some real Singapore supermarket locations
INSERT INTO public.supermarkets (name, address, latitude, longitude, type, phone, opening_hours) VALUES
('FairPrice Orchard', '290 Orchard Rd, Paragon, Singapore 238859', 1.3048, 103.8350, 'FairPrice', '+65 6738 1888', '10:00 AM - 10:00 PM'),
('Cold Storage Marina Bay Sands', '2 Bayfront Ave, B2-01, Singapore 018972', 1.2840, 103.8607, 'Cold Storage', '+65 6688 8868', '8:00 AM - 12:00 AM'),
('Giant Tampines Mall', '4 Tampines Central 5, B1-K9, Singapore 529510', 1.3525, 103.9447, 'Giant', '+65 6260 8633', '8:00 AM - 11:00 PM'),
('Sheng Siong Bedok Mall', '311 New Upper Changi Rd, B1-K1/K2, Singapore 467360', 1.3243, 103.9300, 'Sheng Siong', '+65 6243 3003', '8:00 AM - 11:00 PM'),
('FairPrice Finest Bukit Timah Plaza', '1 Jln Anak Bukit, B1-09, Singapore 588996', 1.3389, 103.7778, 'FairPrice Finest', '+65 6468 6218', '8:00 AM - 11:00 PM'),
('Cold Storage Great World City', '1 Kim Seng Promenade, B1-109, Singapore 237994', 1.2932, 103.8317, 'Cold Storage', '+65 6836 0812', '8:00 AM - 12:00 AM'),
('Giant VivoCity', '1 HarbourFront Walk, B2-08, Singapore 098585', 1.2644, 103.8226, 'Giant', '+65 6376 9037', '8:00 AM - 12:00 AM'),
('Sheng Siong Toa Payoh', '190 Lor 6 Toa Payoh, #01-508, Singapore 310190', 1.3324, 103.8480, 'Sheng Siong', '+65 6259 4438', '7:00 AM - 11:00 PM');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_supermarkets_updated_at
BEFORE UPDATE ON public.supermarkets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();