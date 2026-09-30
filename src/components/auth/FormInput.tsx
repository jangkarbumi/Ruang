import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FormInput({
  label,
  id,
  icon: Icon,
  type = 'text',
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ElementType;
  hint?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? 'text-destructive' : ''}>
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input
          id={id}
          type={inputType}
          className={`${Icon ? 'pl-9' : ''} ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {(hint || error) && (
        <p className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
