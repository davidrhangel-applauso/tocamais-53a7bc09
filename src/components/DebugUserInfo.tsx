import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield } from "lucide-react";

interface DebugUserInfoProps {
  userId?: string;
  userType?: "artista" | "cliente";
  profileExists: boolean;
}

const DebugUserInfo = ({ userId, userType, profileExists }: DebugUserInfoProps) => {
  return (
    <Card className="border-accent/50 bg-accent/5 mb-4">
      <div className="p-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">DEBUG MODE</span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">User ID:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {userId ? userId.slice(0, 8) + "..." : "N/A"}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tipo:</span>
          <Badge variant={userType === "artista" ? "default" : "secondary"}>
            {userType === "artista" ? "🎵 Artista" : "👤 Cliente"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Perfil:</span>
          <Badge variant={profileExists ? "default" : "destructive"}>
            {profileExists ? "✓ Existe" : "✗ Não encontrado"}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default DebugUserInfo;
