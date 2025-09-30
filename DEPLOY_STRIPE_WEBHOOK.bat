@echo off
echo ========================================
echo Deploy Stripe Webhook Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo Fazendo deploy da funcao stripe-webhook...
npx supabase functions deploy stripe-webhook

echo.
echo ========================================
echo Deploy concluido!
echo ========================================
pause