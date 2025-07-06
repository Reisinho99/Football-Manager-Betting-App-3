
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function CreateLeagueDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [country, setCountry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leagueName.trim() || !country.trim()) {
      toast({
        title: "Erro",
        description: "Por favor preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/leagues", {
        name: leagueName.trim(),
        country: country.trim(),
        isActive: true
      });

      toast({
        title: "Liga criada",
        description: "A nova liga foi criada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      
      setLeagueName("");
      setCountry("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a liga.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Liga
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Liga</DialogTitle>
          <DialogDescription>
            Crie uma liga personalizada para competições especiais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leagueName">Nome da Liga</Label>
              <Input
                id="leagueName"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="ex: Liga dos Campeões, Mundial de Clubes"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País/Região</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="ex: Europa, Mundial, Portugal"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Liga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
