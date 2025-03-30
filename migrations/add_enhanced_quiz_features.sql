-- Add new fields to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS available_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS correct_marks FLOAT DEFAULT 2,
ADD COLUMN IF NOT EXISTS negative_marks FLOAT DEFAULT 0;

-- Add image_url field to questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url field to options (we need to extract options from the array to support images)
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  image_url TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create a function to migrate existing question options to the new table
CREATE OR REPLACE FUNCTION migrate_question_options() RETURNS void AS $$
DECLARE
  q RECORD;
  opt TEXT;
  pos INTEGER;
  is_correct BOOLEAN;
BEGIN
  FOR q IN SELECT id, options, correct_answer FROM questions WHERE options IS NOT NULL LOOP
    pos := 0;
    FOREACH opt IN ARRAY q.options LOOP
      pos := pos + 1;
      is_correct := (opt = q.correct_answer);
      
      INSERT INTO options (question_id, option_text, is_correct, position)
      VALUES (q.id, opt, is_correct, pos);
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Call the function to migrate existing data
SELECT migrate_question_options();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_available_until ON quizzes(available_until); 