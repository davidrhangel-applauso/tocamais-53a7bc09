import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export type MusicComboboxItem = {
  id: string;
  titulo: string;
  artista_original?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MusicComboboxItem[];
  selectedTitle: string;
  onSelectTitle: (title: string) => void;
  triggerPlaceholder?: string;
  searchPlaceholder?: string;
  className?: string;
  /** Force Drawer (bottom sheet) even on desktop - useful inside Dialogs */
  forceDrawer?: boolean;
};

/**
 * Desktop: Popover (Radix)
 * Mobile: Drawer (vaul) — avoids nested scroll/touch conflicts that often break Popover+CommandList on mobile.
 */
export function MusicCombobox({
  open,
  onOpenChange,
  items,
  selectedTitle,
  onSelectTitle,
  triggerPlaceholder = "Selecione uma música...",
  searchPlaceholder = "Buscar música...",
  className,
  forceDrawer = false,
}: Props) {
  const isMobile = useIsMobile();
  const useDrawer = isMobile || forceDrawer;

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between font-normal", className)}
    >
      {selectedTitle ? selectedTitle : triggerPlaceholder}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const list = (
    <Command
      shouldFilter={true}
      filter={(value, search) => {
        const normalize = (str: string) =>
          str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalize(value).includes(normalize(search)) ? 1 : 0;
      }}
    >
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList className={cn(isMobile && "max-h-[60vh]")}>
        <CommandEmpty>Nenhuma música encontrada.</CommandEmpty>
        <CommandGroup>
          {items.map((m) => (
            <CommandItem
              key={m.id}
              value={`${m.titulo} ${m.artista_original || ""}`}
              onSelect={() => {
                onSelectTitle(m.titulo);
                onOpenChange(false);
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", selectedTitle === m.titulo ? "opacity-100" : "opacity-0")} />
              <div className="flex flex-col">
                <span>{m.titulo}</span>
                {!!m.artista_original && (
                  <span className="text-xs text-muted-foreground">{m.artista_original}</span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (useDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Escolha uma música</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {list}
      </PopoverContent>
    </Popover>
  );
}
