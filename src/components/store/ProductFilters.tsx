import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface FilterState {
  searchTerm: string;
  categoria: string | null;
  disponibilidade: 'todas' | 'pronta_entrega' | 'entrega_7_dias';
  precoMin: number;
  precoMax: number;
  ordenacao: 'popularidade' | 'preco_menor' | 'preco_maior' | 'nome';
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const ProductFilters = ({ filters, onFiltersChange }: ProductFiltersProps) => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    fetchCategorias();
    fetchMaxPrice();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('categoria')
        .eq('is_active', true)
        .not('categoria', 'is', null);

      if (error) throw error;

      const uniqueCategorias = [...new Set(data.map(p => p.categoria).filter(Boolean))] as string[];
      setCategorias(uniqueCategorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const fetchMaxPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('preco_venda')
        .eq('is_active', true)
        .order('preco_venda', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        const max = Math.ceil(data.preco_venda);
        setMaxPrice(max);
        onFiltersChange({ ...filters, precoMax: max });
      }
    } catch (error) {
      console.error('Erro ao carregar preço máximo:', error);
    }
  };

  const handleClearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      categoria: null,
      disponibilidade: 'todas',
      precoMin: 0,
      precoMax: maxPrice,
      ordenacao: 'popularidade',
    });
  };

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Busca */}
      <div className="space-y-2">
        <Label>Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome ou descrição..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={filters.categoria || 'todas'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, categoria: value === 'todas' ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Disponibilidade */}
        <div className="space-y-2">
          <Label>Disponibilidade</Label>
          <Select
            value={filters.disponibilidade}
            onValueChange={(value: any) => 
              onFiltersChange({ ...filters, disponibilidade: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="pronta_entrega">Pronta Entrega</SelectItem>
              <SelectItem value="entrega_7_dias">Entrega em 7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="space-y-2">
          <Label>Ordenar por</Label>
          <Select
            value={filters.ordenacao}
            onValueChange={(value: any) => 
              onFiltersChange({ ...filters, ordenacao: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularidade">Mais Populares</SelectItem>
              <SelectItem value="preco_menor">Menor Preço</SelectItem>
              <SelectItem value="preco_maior">Maior Preço</SelectItem>
              <SelectItem value="nome">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Faixa de Preço */}
        <div className="space-y-2">
          <Label>
            Preço: R$ {filters.precoMin.toFixed(0)} - R$ {filters.precoMax.toFixed(0)}
          </Label>
          <Slider
            value={[filters.precoMin, filters.precoMax]}
            min={0}
            max={maxPrice}
            step={10}
            onValueChange={([min, max]) => 
              onFiltersChange({ ...filters, precoMin: min, precoMax: max })
            }
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};
