import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermosDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert">
        <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <h2>1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar a plataforma TocaMais ("Plataforma"), você concorda integralmente com estes Termos de Uso. Se não concordar, não utilize a Plataforma.</p>

        <h2>2. Descrição do Serviço</h2>
        <p>A TocaMais é uma plataforma digital que conecta artistas de rua, músicos e estabelecimentos ao público, permitindo o envio de gorjetas digitais via PIX e pedidos de músicas. A Plataforma atua como intermediária tecnológica, não sendo responsável pela prestação dos serviços artísticos.</p>

        <h2>3. Cadastro e Conta</h2>
        <ul>
          <li>O usuário deve fornecer informações verdadeiras, completas e atualizadas.</li>
          <li>Cada pessoa pode manter apenas uma conta na Plataforma.</li>
          <li>O usuário é responsável pela segurança de suas credenciais de acesso.</li>
          <li>Menores de 18 anos devem ter autorização dos responsáveis legais.</li>
        </ul>

        <h2>4. Gorjetas e Pagamentos</h2>
        <ul>
          <li>As gorjetas são transferências voluntárias do público para artistas.</li>
          <li>A Plataforma pode cobrar uma taxa de serviço sobre as gorjetas, conforme o plano do artista (Gratuito ou PRO).</li>
          <li>Os pagamentos são processados via PIX através de parceiros de pagamento autorizados.</li>
          <li>Gorjetas enviadas não são reembolsáveis, salvo em casos de fraude comprovada.</li>
          <li>A TocaMais não se responsabiliza por falhas nos sistemas de pagamento de terceiros.</li>
        </ul>

        <h2>5. Planos e Assinaturas</h2>
        <ul>
          <li>O plano Gratuito possui funcionalidades limitadas e taxa de 20% sobre gorjetas.</li>
          <li>O plano PRO oferece taxa 0% sobre gorjetas e funcionalidades adicionais, mediante pagamento de assinatura mensal.</li>
          <li>O cancelamento da assinatura PRO pode ser feito a qualquer momento, com efeito ao final do período pago.</li>
        </ul>

        <h2>6. Responsabilidades do Usuário</h2>
        <ul>
          <li>Não utilizar a Plataforma para atividades ilegais ou fraudulentas.</li>
          <li>Não publicar conteúdo ofensivo, difamatório ou que viole direitos de terceiros.</li>
          <li>Manter suas informações de perfil e pagamento atualizadas.</li>
          <li>Respeitar os direitos autorais e de propriedade intelectual.</li>
        </ul>

        <h2>7. Propriedade Intelectual</h2>
        <p>Todo o conteúdo da Plataforma (marca, layout, código, textos) é de propriedade da TocaMais ou de seus licenciadores. O uso não autorizado é proibido. O conteúdo publicado pelos usuários (fotos, repertório, bio) permanece de propriedade do respectivo autor, que concede à Plataforma licença não exclusiva para exibição.</p>

        <h2>8. Limitação de Responsabilidade</h2>
        <ul>
          <li>A TocaMais não garante disponibilidade ininterrupta da Plataforma.</li>
          <li>Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais.</li>
          <li>A qualidade dos serviços artísticos é de responsabilidade exclusiva dos artistas.</li>
          <li>Não somos responsáveis por disputas entre usuários.</li>
        </ul>

        <h2>9. Suspensão e Encerramento</h2>
        <p>A TocaMais reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem aviso prévio, a seu exclusivo critério.</p>

        <h2>10. Alterações nos Termos</h2>
        <p>Estes Termos podem ser atualizados a qualquer momento. Alterações significativas serão comunicadas aos usuários. O uso continuado da Plataforma após alterações constitui aceitação dos novos Termos.</p>

        <h2>11. Legislação Aplicável</h2>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias.</p>

        <h2>12. Contato</h2>
        <p>Para dúvidas sobre estes Termos, entre em contato pelo suporte da Plataforma.</p>

        <div className="pb-20" />
      </main>
    </div>
  );
};

export default TermosDeUso;
