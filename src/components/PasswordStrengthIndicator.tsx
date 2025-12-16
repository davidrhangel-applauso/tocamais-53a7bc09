import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strengthPercentage = (passedChecks / 4) * 100;

  const getStrengthLabel = () => {
    if (passedChecks === 0) return { label: "", color: "" };
    if (passedChecks === 1) return { label: "Muito fraca", color: "text-red-500" };
    if (passedChecks === 2) return { label: "Fraca", color: "text-orange-500" };
    if (passedChecks === 3) return { label: "Média", color: "text-yellow-500" };
    return { label: "Forte", color: "text-green-500" };
  };

  const getProgressColor = () => {
    if (passedChecks <= 1) return "bg-red-500";
    if (passedChecks === 2) return "bg-orange-500";
    if (passedChecks === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const strength = getStrengthLabel();

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Força da senha</span>
            <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${getProgressColor()}`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements checklist */}
      <div className="text-xs p-2 bg-muted/50 rounded-lg">
        <p className="font-medium text-muted-foreground mb-1">A senha deve conter:</p>
        <div className="grid grid-cols-2 gap-1">
          <div className={`flex items-center gap-1 ${checks.minLength ? 'text-green-500' : 'text-muted-foreground'}`}>
            {checks.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>8+ caracteres</span>
          </div>
          <div className={`flex items-center gap-1 ${checks.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
            {checks.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Letra maiúscula</span>
          </div>
          <div className={`flex items-center gap-1 ${checks.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
            {checks.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Número</span>
          </div>
          <div className={`flex items-center gap-1 ${checks.hasSpecial ? 'text-green-500' : 'text-muted-foreground'}`}>
            {checks.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Caractere especial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
