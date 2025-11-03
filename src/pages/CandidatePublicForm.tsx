import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CandidatePublicForm = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    email: '',
    telefone: '',
    casado: '',
    tem_filhos: '',
    nasceu_regiao: '',
    tempo_regiao: '',
    familia_regiao: '',
    experiencia_comercial: '',
    nota_gostar_pessoas: '',
    nota_proatividade: '',
    nota_ambicao: '',
    maior_renda_mensal: '',
    renda_desejada: '',
    nota_ensinavel: '',
    situacao_emprego: '',
    disponibilidade: {
      segunda_manha: false,
      segunda_tarde: false,
      segunda_noite: false,
      terca_manha: false,
      terca_tarde: false,
      terca_noite: false,
      quarta_manha: false,
      quarta_tarde: false,
      quarta_noite: false,
      quinta_manha: false,
      quinta_tarde: false,
      quinta_noite: false,
      sexta_manha: false,
      sexta_tarde: false,
      sexta_noite: false,
      sabado_manha: false,
      sabado_tarde: false,
      sabado_noite: false,
      restricoes: ''
    },
    tempo_desempregado: '',
    como_soube: '',
    cargo_desejado: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o link da organização é válido
      const { data: org, error: orgError } = await (supabase as any)
        .from('organizations')
        .select('id')
        .eq('unique_link', linkId)
        .maybeSingle();

      if (orgError || !org) {
        toast({
          title: 'Link inválido',
          description: 'Este link de candidatura não é válido.',
          variant: 'destructive',
        });
        return;
      }

      // Inserir candidato
      const { error } = await (supabase as any).from('candidates').insert({
        organization_id: org.id,
        nome: formData.nome.trim(),
        idade: parseInt(formData.idade),
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
        casado: formData.casado === 'sim',
        tem_filhos: formData.tem_filhos === 'sim',
        nasceu_regiao: formData.nasceu_regiao === 'sim',
        tempo_regiao: formData.tempo_regiao,
        familia_regiao: formData.familia_regiao === 'sim',
        experiencia_comercial: formData.experiencia_comercial === 'sim',
        nota_gostar_pessoas: parseInt(formData.nota_gostar_pessoas),
        nota_proatividade: parseInt(formData.nota_proatividade),
        nota_ambicao: parseInt(formData.nota_ambicao),
        maior_renda_mensal: parseFloat(formData.maior_renda_mensal),
        renda_desejada: parseFloat(formData.renda_desejada),
        nota_ensinavel: parseInt(formData.nota_ensinavel),
        situacao_emprego: formData.situacao_emprego,
        disponibilidade_horario: formData.disponibilidade,
        tempo_desempregado: formData.tempo_desempregado,
        como_soube: formData.como_soube,
        cargo_desejado: formData.cargo_desejado.trim(),
        status: 'pendente',
      });

      if (error) throw error;

      toast({
        title: 'Candidatura enviada!',
        description: 'Sua candidatura foi recebida com sucesso. Entraremos em contato em breve.',
      });

      // Limpar formulário
      navigate('/candidatura-enviada');
    } catch (error) {
      console.error('Error submitting candidate:', error);
      toast({
        title: 'Erro ao enviar candidatura',
        description: 'Não foi possível enviar sua candidatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Candidatura</CardTitle>
            <CardDescription>
              Preencha todos os campos abaixo para se candidatar à vaga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Nome e Idade */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Qual seu nome e sua idade?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idade">Idade *</Label>
                    <Input
                      id="idade"
                      type="number"
                      min="16"
                      max="100"
                      value={formData.idade}
                      onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              {/* 2. Estado Civil e Filhos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. Você é casado? Tem filhos?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>É casado(a)? *</Label>
                    <RadioGroup
                      value={formData.casado}
                      onValueChange={(value) => setFormData({ ...formData, casado: value })}
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="casado-sim" />
                        <Label htmlFor="casado-sim">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="casado-nao" />
                        <Label htmlFor="casado-nao">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Tem filhos? *</Label>
                    <RadioGroup
                      value={formData.tem_filhos}
                      onValueChange={(value) => setFormData({ ...formData, tem_filhos: value })}
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="filhos-sim" />
                        <Label htmlFor="filhos-sim">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="filhos-nao" />
                        <Label htmlFor="filhos-nao">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* 3 e 4. Região */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">3. Você nasceu na região? Se não, quanto tempo mora aqui?</h3>
                <div className="space-y-2">
                  <RadioGroup
                    value={formData.nasceu_regiao}
                    onValueChange={(value) => setFormData({ ...formData, nasceu_regiao: value })}
                    required
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="nasceu-sim" />
                      <Label htmlFor="nasceu-sim">Sim, nasci na região</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="nasceu-nao" />
                      <Label htmlFor="nasceu-nao">Não, vim de outra região</Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.nasceu_regiao === 'nao' && (
                  <div className="space-y-2">
                    <Label htmlFor="tempo_regiao">Há quanto tempo mora na região? *</Label>
                    <Input
                      id="tempo_regiao"
                      value={formData.tempo_regiao}
                      onChange={(e) => setFormData({ ...formData, tempo_regiao: e.target.value })}
                      placeholder="Ex: 5 anos"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">4. Sua família é da região de SJC / Jacareí?</h3>
                <RadioGroup
                  value={formData.familia_regiao}
                  onValueChange={(value) => setFormData({ ...formData, familia_regiao: value })}
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="familia-sim" />
                    <Label htmlFor="familia-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="familia-nao" />
                    <Label htmlFor="familia-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 5. Experiência Comercial */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">5. Você já atuou no setor comercial/vendas?</h3>
                <RadioGroup
                  value={formData.experiencia_comercial}
                  onValueChange={(value) => setFormData({ ...formData, experiencia_comercial: value })}
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="exp-sim" />
                    <Label htmlFor="exp-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="exp-nao" />
                    <Label htmlFor="exp-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 6-9. Avaliações de 0 a 10 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">6. De 0 a 10, o quanto você gosta de trabalhar e lidar com pessoas?</h3>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.nota_gostar_pessoas}
                  onChange={(e) => setFormData({ ...formData, nota_gostar_pessoas: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">7. De 0 a 10, o quanto você se considera uma pessoa pró-ativa?</h3>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.nota_proatividade}
                  onChange={(e) => setFormData({ ...formData, nota_proatividade: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">8. De 0 a 10, o quanto você se considera uma pessoa ambiciosa?</h3>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.nota_ambicao}
                  onChange={(e) => setFormData({ ...formData, nota_ambicao: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="maior_renda">Qual foi sua maior renda mensal até hoje? *</Label>
                    <Input
                      id="maior_renda"
                      type="number"
                      step="0.01"
                      value={formData.maior_renda_mensal}
                      onChange={(e) => setFormData({ ...formData, maior_renda_mensal: e.target.value })}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="renda_desejada">Quanto deseja ganhar por mês? *</Label>
                    <Input
                      id="renda_desejada"
                      type="number"
                      step="0.01"
                      value={formData.renda_desejada}
                      onChange={(e) => setFormData({ ...formData, renda_desejada: e.target.value })}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">9. De 0 a 10, o quanto você se considera uma pessoa ensinável?</h3>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.nota_ensinavel}
                  onChange={(e) => setFormData({ ...formData, nota_ensinavel: e.target.value })}
                  required
                />
              </div>

              {/* 10. Situação de Emprego */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">10. Atualmente você está trabalhando ou desempregado?</h3>
                <RadioGroup
                  value={formData.situacao_emprego}
                  onValueChange={(value) => setFormData({ ...formData, situacao_emprego: value })}
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trabalhando" id="trab" />
                    <Label htmlFor="trab">Trabalhando</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="desempregado" id="desemp" />
                    <Label htmlFor="desemp">Desempregado</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 11. Disponibilidade */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">11. Qual sua disponibilidade de tempo durante a semana?</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].map((dia) => (
                    <div key={dia} className="space-y-2">
                      <Label className="capitalize">{dia.replace('_', '-')}</Label>
                      {['manha', 'tarde', 'noite'].map((periodo) => (
                        <div key={`${dia}_${periodo}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${dia}_${periodo}`}
                            checked={formData.disponibilidade[`${dia}_${periodo}` as keyof typeof formData.disponibilidade] as boolean}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                disponibilidade: {
                                  ...formData.disponibilidade,
                                  [`${dia}_${periodo}`]: checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor={`${dia}_${periodo}`} className="capitalize">
                            {periodo}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restricoes">Alguma restrição de horário?</Label>
                  <Textarea
                    id="restricoes"
                    value={formData.disponibilidade.restricoes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disponibilidade: {
                          ...formData.disponibilidade,
                          restricoes: e.target.value,
                        },
                      })
                    }
                    placeholder="Descreva suas restrições de horário, se houver"
                    rows={3}
                  />
                </div>
              </div>

              {/* 12. Tempo Desempregado */}
              {formData.situacao_emprego === 'desempregado' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">12. Há quanto tempo está desempregado?</h3>
                  <Input
                    value={formData.tempo_desempregado}
                    onChange={(e) => setFormData({ ...formData, tempo_desempregado: e.target.value })}
                    placeholder="Ex: 3 meses"
                    required
                  />
                </div>
              )}

              {/* 13. Como Soube */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">13. Como ficou sabendo desta oportunidade?</h3>
                <Textarea
                  value={formData.como_soube}
                  onChange={(e) => setFormData({ ...formData, como_soube: e.target.value })}
                  placeholder="Conte-nos como conheceu esta vaga"
                  rows={3}
                  required
                />
              </div>

              {/* Cargo Desejado */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cargo de Interesse</h3>
                <Input
                  value={formData.cargo_desejado}
                  onChange={(e) => setFormData({ ...formData, cargo_desejado: e.target.value })}
                  placeholder="Ex: Vendedor, Gerente Comercial"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Enviando...' : 'Enviar Candidatura'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidatePublicForm;
