-- Remover políticas antigas que podem estar mal configuradas
DROP POLICY IF EXISTS "Allow insert for service role" ON public.payment_attempts;
DROP POLICY IF EXISTS "Allow select for service role" ON public.payment_attempts;

-- Garantir que RLS está habilitado (bloqueia todo acesso por padrão)
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Forçar RLS mesmo para o owner da tabela
ALTER TABLE public.payment_attempts FORCE ROW LEVEL SECURITY;

-- Não criar nenhuma política permissiva = acesso bloqueado para todos os clientes
-- Edge functions usando service role bypassa RLS automaticamente
-- Isso garante que APENAS as edge functions podem acessar esta tabela