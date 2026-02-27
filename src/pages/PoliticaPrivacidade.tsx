import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert">
        <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <h2>1. Introdução</h2>
        <p>A TocaMais ("nós") valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>

        <h2>2. Dados Coletados</h2>
        <h3>2.1 Dados fornecidos pelo usuário</h3>
        <ul>
          <li>Nome, e-mail e senha (cadastro)</li>
          <li>Foto de perfil e foto de capa</li>
          <li>Cidade, bio, estilo musical, links de redes sociais</li>
          <li>Chave PIX e informações de pagamento (artistas)</li>
          <li>CPF (quando necessário para pagamentos)</li>
          <li>Endereço e tipo de estabelecimento (estabelecimentos)</li>
        </ul>

        <h3>2.2 Dados coletados automaticamente</h3>
        <ul>
          <li>Geolocalização (com consentimento, para busca de artistas próximos)</li>
          <li>Dados de uso da Plataforma (páginas visitadas, interações)</li>
          <li>Informações do dispositivo (tipo, sistema operacional, navegador)</li>
          <li>Endereço IP</li>
        </ul>

        <h2>3. Finalidade do Tratamento</h2>
        <p>Utilizamos seus dados para:</p>
        <ul>
          <li>Criar e gerenciar sua conta</li>
          <li>Processar gorjetas e pagamentos</li>
          <li>Conectar artistas e público por geolocalização</li>
          <li>Enviar notificações sobre pedidos e gorjetas</li>
          <li>Melhorar a experiência do usuário</li>
          <li>Cumprir obrigações legais e regulatórias</li>
          <li>Prevenir fraudes e garantir a segurança da Plataforma</li>
        </ul>

        <h2>4. Base Legal</h2>
        <p>O tratamento dos dados pessoais é realizado com base em:</p>
        <ul>
          <li><strong>Consentimento:</strong> geolocalização, notificações</li>
          <li><strong>Execução de contrato:</strong> cadastro, pagamentos, prestação do serviço</li>
          <li><strong>Interesse legítimo:</strong> segurança, prevenção a fraudes, melhorias</li>
          <li><strong>Obrigação legal:</strong> dados fiscais e financeiros</li>
        </ul>

        <h2>5. Compartilhamento de Dados</h2>
        <p>Seus dados podem ser compartilhados com:</p>
        <ul>
          <li><strong>Processadores de pagamento:</strong> para viabilizar transações via PIX</li>
          <li><strong>Outros usuários:</strong> nome e foto de perfil são públicos; artistas veem o nome de quem envia gorjetas</li>
          <li><strong>Autoridades públicas:</strong> quando exigido por lei ou ordem judicial</li>
        </ul>
        <p>Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing.</p>

        <h2>6. Armazenamento e Segurança</h2>
        <ul>
          <li>Os dados são armazenados em servidores seguros com criptografia</li>
          <li>Utilizamos protocolos HTTPS para transmissão de dados</li>
          <li>Senhas são armazenadas com hash criptográfico (nunca em texto puro)</li>
          <li>Acesso aos dados é restrito a funcionários autorizados</li>
          <li>Realizamos backups periódicos para prevenção de perda de dados</li>
        </ul>

        <h2>7. Retenção de Dados</h2>
        <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão da conta, os dados serão removidos em até 30 dias, exceto quando houver obrigação legal de retenção (ex.: registros financeiros por 5 anos).</p>

        <h2>8. Direitos do Titular (LGPD Art. 18)</h2>
        <p>Você tem direito a:</p>
        <ul>
          <li>Confirmar a existência de tratamento de seus dados</li>
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
          <li>Solicitar portabilidade dos dados</li>
          <li>Revogar consentimento a qualquer momento</li>
          <li>Solicitar exclusão dos dados tratados com base em consentimento</li>
        </ul>
        <p>Para exercer seus direitos, entre em contato pelo suporte da Plataforma.</p>

        <h2>9. Cookies e Tecnologias Similares</h2>
        <p>Utilizamos cookies e armazenamento local para:</p>
        <ul>
          <li>Manter sua sessão ativa (autenticação)</li>
          <li>Armazenar preferências (tema claro/escuro)</li>
          <li>Melhorar o desempenho da Plataforma</li>
        </ul>

        <h2>10. Menores de Idade</h2>
        <p>A Plataforma não é direcionada a menores de 13 anos. Menores entre 13 e 18 anos devem ter autorização dos responsáveis legais para utilizar o serviço.</p>

        <h2>11. Alterações nesta Política</h2>
        <p>Esta Política pode ser atualizada periodicamente. Alterações significativas serão comunicadas aos usuários pela Plataforma.</p>

        <h2>12. Encarregado de Dados (DPO)</h2>
        <p>Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso Encarregado de Dados pelo suporte da Plataforma.</p>

        <div className="pb-20" />
      </main>
    </div>
  );
};

export default PoliticaPrivacidade;
