
-- Create push_subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to send push notification on new notificacao
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_project_url text;
BEGIN
  -- Only send push if user has push subscriptions
  IF EXISTS (SELECT 1 FROM push_subscriptions WHERE user_id = NEW.usuario_id) THEN
    SELECT COALESCE(current_setting('app.settings.supabase_url', true), 'https://tnhbijlskoffgoocftfq.supabase.co')
    INTO v_project_url;

    PERFORM extensions.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      body := jsonb_build_object(
        'user_id', NEW.usuario_id,
        'title', NEW.titulo,
        'body', NEW.mensagem,
        'link', COALESCE(NEW.link, '/painel'),
        'notification_id', NEW.id
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on notificacoes table
CREATE TRIGGER on_new_notificacao_send_push
  AFTER INSERT ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_push_notification();
