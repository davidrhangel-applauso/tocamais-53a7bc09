import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Music, DollarSign, Users } from "lucide-react";

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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AnalyticsDashboard = ({ data }: AnalyticsDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardDescription>Taxa de Aceitação</CardDescription>
            </div>
            <CardTitle className="text-3xl text-primary">
              {data.taxaAceitacao.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <CardDescription>Ticket Médio</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">
              R$ {data.ticketMedio.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <CardDescription>Total de Clientes</CardDescription>
            </div>
            <CardTitle className="text-3xl text-accent">
              {data.totalClientes}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos nos Últimos 7 Dias</CardTitle>
            <CardDescription>Tendência de pedidos recebidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.pedidosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
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
          <CardHeader>
            <CardTitle>Gorjetas nos Últimos 7 Dias</CardTitle>
            <CardDescription>Receita de gorjetas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.gorjetasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
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
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Músicas Mais Pedidas</CardTitle>
              <CardDescription>Top 5 pedidos mais frequentes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.topMusicas.length > 0 ? (
            <div className="space-y-4">
              {data.topMusicas.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{item.musica}</span>
                  </div>
                  <span className="text-muted-foreground">{item.total} pedidos</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pedido registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
