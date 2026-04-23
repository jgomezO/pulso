CREATE TABLE copilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conversation_id, message_index)
);

ALTER TABLE copilot_feedback ENABLE ROW LEVEL SECURITY;
