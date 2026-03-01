CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  age INT,
  phone_number TEXT,
  guardian_phone TEXT,
  guardian_mode_enabled BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE risk_checks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  sim_swap_result BOOLEAN,
  kyc_result BOOLEAN,
  number_verification_result BOOLEAN,
  trust_score INT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);