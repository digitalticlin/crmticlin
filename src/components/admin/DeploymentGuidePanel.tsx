
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function DeploymentGuidePanel() {
  const { isSuperAdmin } = usePermissions();
  
  if (!isSuperAdmin) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Guia de Implantação</CardTitle>
          <CardDescription>Você não tem permissão para acessar esta documentação</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <FileText className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Guia de Implantação em Produção</CardTitle>
            <CardDescription>
              Instruções completas para preparar e implantar o sistema Ticlin em ambiente de produção
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
            <p className="font-medium text-amber-800">Importante</p>
            <p className="text-amber-700 mt-1">
              Antes de implantar em produção, certifique-se de concluir todos os testes no ambiente de homologação 
              e validar que todas as funcionalidades estão operando conforme esperado.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="text-base">1. Preparação do Ambiente</span>
                  <Badge variant="outline" className="ml-2">Crítico</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Verifique as configurações do Supabase:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Confirme que todas as RLS (Row Level Security) estão configuradas corretamente</li>
                      <li>Verifique os backups automáticos</li>
                      <li>Configure os limites de armazenamento e gerencie buckets</li>
                    </ul>
                  </li>
                  <li>Configuração do Evolution API para WhatsApp:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Verifique a estabilidade da instância do Evolution API</li>
                      <li>Configure os webhooks para recebimento de mensagens</li>
                      <li>Teste a conexão e reconexão automática dos números</li>
                    </ul>
                  </li>
                  <li>Configuração de Cache e CDN:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure CDN para arquivos estáticos</li>
                      <li>Implemente estratégias de cache para otimização</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="text-base">2. Segurança e Conformidade</span>
                  <Badge variant="outline" className="ml-2">Essencial</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Proteção de dados:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Confirme que todos os dados sensíveis estão criptografados</li>
                      <li>Implemente políticas de retenção de dados</li>
                      <li>Verifique conformidade com LGPD/GDPR conforme necessário</li>
                    </ul>
                  </li>
                  <li>Autenticação e Autorização:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Habilite autenticação de dois fatores para administradores</li>
                      <li>Configure políticas de senha robustas</li>
                      <li>Implemente limites de tentativas de login</li>
                    </ul>
                  </li>
                  <li>Auditoria e Monitoramento:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure logs de auditoria para ações críticas</li>
                      <li>Implemente alertas de segurança</li>
                      <li>Monitore acessos suspeitos</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="text-base">3. Escalabilidade e Performance</span>
                  <Badge variant="outline" className="ml-2">Importante</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Otimização de Banco de Dados:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure índices para consultas frequentes</li>
                      <li>Implemente estratégias de cache</li>
                      <li>Monitore performance de queries e otimize conforme necessário</li>
                    </ul>
                  </li>
                  <li>Gerencie Recursos:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure limites de consumo para cada cliente</li>
                      <li>Implemente throttling para APIs</li>
                      <li>Configure auto-scaling conforme necessário</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="text-base">4. Monitoramento e Manutenção</span>
                  <Badge variant="outline" className="ml-2">Necessário</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Monitoramento em Tempo Real:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure alertas para falhas críticas</li>
                      <li>Monitore tempos de resposta e disponibilidade</li>
                      <li>Implemente logging centralizado</li>
                    </ul>
                  </li>
                  <li>Procedimentos de Backup:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Configure backups automáticos diários</li>
                      <li>Teste processos de restauração</li>
                      <li>Implemente política de retenção de backups</li>
                    </ul>
                  </li>
                  <li>Atualizações e Patches:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Mantenha bibliotecas e dependências atualizadas</li>
                      <li>Planeje janelas de manutenção</li>
                      <li>Documente procedimentos de rollback</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="text-base">5. Plano de Treinamento e Suporte</span>
                  <Badge variant="outline" className="ml-2">Recomendado</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Documentação do Usuário:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Manuais para diferentes perfis de usuário</li>
                      <li>Tutoriais em vídeo para principais funcionalidades</li>
                      <li>FAQs e guias de solução de problemas</li>
                    </ul>
                  </li>
                  <li>Treinamento:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Sessions de onboarding para novos usuários</li>
                      <li>Treinamento especializado para administradores</li>
                      <li>Material de treinamento atualizado</li>
                    </ul>
                  </li>
                  <li>Suporte Contínuo:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Defina canais de suporte (chat, email, telefone)</li>
                      <li>Estabeleça SLAs para diferentes níveis de severidade</li>
                      <li>Implemente sistema de feedback e melhoria contínua</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Última atualização: 13 de maio, 2025
        </div>
        
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Baixar guia completo (PDF)
        </Button>
      </CardFooter>
    </Card>
  );
}
