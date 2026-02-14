

## Substituir Metricas por Secao Persuasiva

### Problema
A secao de metricas mostra dados reais do banco que sao muito baixos (R$58, 3 artistas, 0 avaliacoes), transmitindo a impressao de plataforma vazia e afastando novos usuarios.

### Solucao
Substituir o bloco de metricas por uma secao de **proposta de valor** focada nos beneficios concretos para o artista, sem depender de numeros do banco. A secao de compartilhamento social (WhatsApp/Instagram) sera mantida e reposicionada.

### Nova Secao: "Por que artistas escolhem o Toca+"

Tres cards com icones destacando:
1. **"100% das gorjetas no seu bolso"** - Com plano PRO, sem taxas escondidas
2. **"Receba via PIX na hora"** - Dinheiro cai direto na sua conta, sem burocracia
3. **"QR Code inteligente"** - Seus fas pedem musicas e enviam gorjetas com um scan

Os botoes de compartilhamento social ficam abaixo dos cards.

### Detalhes Tecnicos

**Arquivo:** `src/components/landing/MetricsSection.tsx`
- Remover toda a logica de fetch do banco de dados (queries a gorjetas, profiles, avaliacoes_artistas)
- Remover o state de metricas
- Substituir o grid de numeros por 3 cards com icones do Lucide (Wallet, Zap, QrCode)
- Manter o bloco de SocialShareButtons integrado na mesma secao
- Manter a mesma estrutura de section/container para consistencia visual

**Nenhuma alteracao necessaria em outros arquivos** - o componente ja esta importado e renderizado em Landing.tsx.

### Quando reativar as metricas
Futuramente, quando a plataforma tiver numeros expressivos (ex: +R$10.000 em gorjetas, +100 artistas), a secao de metricas pode ser reintroduzida com impacto real.
