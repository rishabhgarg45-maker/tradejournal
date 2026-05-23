-- TradeZella Clone - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price DECIMAL(12, 5) NOT NULL,
  exit_price DECIMAL(12, 5),
  quantity INTEGER NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_date TIMESTAMPTZ,
  stop_loss DECIMAL(12, 5),
  take_profit DECIMAL(12, 5),
  fees DECIMAL(12, 2) NOT NULL DEFAULT 0,
  strategy VARCHAR(100),
  setup TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  screenshot_url TEXT,
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('DAY', 'SWING', 'SCALP')),
  status VARCHAR(10) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN', 'CLOSED')),
  contract_multiplier DECIMAL(12, 2),
  contract_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX trades_user_id_idx ON trades(user_id);
CREATE INDEX trades_entry_date_idx ON trades(entry_date DESC);
CREATE INDEX trades_symbol_idx ON trades(symbol);
CREATE INDEX trades_status_idx ON trades(status);

-- Brokerage accounts table
CREATE TABLE brokerage_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  is_connected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider, account_id)
);

-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_trade_type VARCHAR(10) DEFAULT 'DAY',
  risk_per_trade DECIMAL(5, 2) DEFAULT 1.00,
  target_per_trade DECIMAL(5, 2) DEFAULT 2.00,
  theme VARCHAR(10) DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table for analytics
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own trades"
  ON trades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own brokerage accounts"
  ON brokerage_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brokerage_accounts_updated_at
  BEFORE UPDATE ON brokerage_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
