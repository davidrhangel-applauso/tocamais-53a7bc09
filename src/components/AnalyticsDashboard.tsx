import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Music, DollarSign, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnalyticsData {
  pedidosPorDia: { data: string; total: number }[];
  gorjetasPorDia: { data: string; valor: number }[];
  topMusicas: { musica: string; total: number }[];
  taxaAceitacao: number;
  ticketMedio: number;
  totalClientes: number;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const AnalyticsDashboard = ({ data }: AnalyticsDashboardProps) => {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 200 : 300;
  const fontSize = isMobile ? 10 : 12;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <CardDescription className="text-xs md:text-sm">Taxa de Aceitação</CardDescription>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-primary">
              {data.taxaAceitacao.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              <CardDescription className="text-xs md:text-sm">Ticket Médio</CardDescription>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-green-600">
              R$ {data.ticketMedio.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              <CardDescription className="text-xs md:text-sm">Total de Clientes</CardDescription>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-accent">
              {data.totalClientes}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pedidos por Dia */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Pedidos nos Últimos 7 Dias</CardTitle>
            <CardDescription className="text-xs md:text-sm">Tendência de pedidos recebidos</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={data.pedidosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={fontSize}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={fontSize}
                  width={isMobile ? 30 : 40}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: fontSize
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gorjetas por Dia */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Gorjetas nos Últimos 7 Dias</CardTitle>
            <CardDescription className="text-xs md:text-sm">Receita de gorjetas</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={data.gorjetasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={fontSize}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={fontSize}
                  width={isMobile ? 30 : 40}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: fontSize
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                />
                <Bar 
                  dataKey="valor" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Músicas */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <div>
              <CardTitle className="text-base md:text-lg">Músicas Mais Pedidas</CardTitle>
              <CardDescription className="text-xs md:text-sm">Top 5 pedidos mais frequentes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {data.topMusicas.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {data.topMusicas.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary font-bold text-sm md:text-base">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm md:text-base truncate max-w-[180px] md:max-w-none">{item.musica}</span>
                  </div>
                  <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">{item.total} pedidos</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
              Nenhum pedido registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;