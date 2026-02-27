import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthEstabelecimento from "./pages/AuthEstabelecimento";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import SearchArtists from "./pages/SearchArtists";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistPanel from "./pages/ArtistPanel";
import EstabelecimentoProfile from "./pages/EstabelecimentoProfile";
import EstabelecimentoPanel from "./pages/EstabelecimentoPanel";
import Analytics from "./pages/Analytics";
import Messages from "./pages/Messages";
import Conversations from "./pages/Conversations";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Instructions from "./pages/Instructions";
import ProSales from "./pages/ProSales";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/pro" element={<ProSales />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth-estabelecimento" element={<AuthEstabelecimento />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/home" element={<Home />} />
            <Route path="/buscar" element={<SearchArtists />} />
            <Route path="/artista/:id" element={<ArtistProfile />} />
            <Route path="/local/:id" element={<EstabelecimentoProfile />} />
            <Route path="/painel" element={<ArtistPanel />} />
            <Route path="/painel-local" element={<EstabelecimentoPanel />} />
            <Route path="/relatorios" element={<Analytics />} />
            <Route path="/conversas" element={<Conversations />} />
            <Route path="/mensagens" element={<Messages />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/instrucoes" element={<Instructions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
