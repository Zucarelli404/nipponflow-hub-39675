import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, Radio, FileText, Plus, Play, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LivePlayer from '@/components/courses/LivePlayer';
import TeleAulaRoom from '@/components/courses/TeleAulaRoom';

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'ebook' | 'aula' | 'live' | 'teleaula';
  status: 'rascunho' | 'publicado' | 'arquivado';
  conteudo_url: string | null;
  duracao_minutos: number | null;
  data_live: string | null;
  created_at: string;
  autor_nome?: string;
}

const CursosView = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeLive, setActiveLive] = useState<Course | null>(null);
  const [activeTeleAula, setActiveTeleAula] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'aula',
    conteudo_url: '',
    duracao_minutos: '',
    data_live: '',
  });
  const { userRole, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await (supabase as any)
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar autores
      const autorIds = [...new Set(coursesData?.map((c: any) => c.autor_id) || [])] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', autorIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);

      const coursesWithAuthors = coursesData?.map((course: any) => ({
        ...course,
        autor_nome: profilesMap.get(course.autor_id) || 'Autor Desconhecido',
      })) || [];

      setCourses(coursesWithAuthors);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Erro ao carregar cursos',
        description: 'Não foi possível carregar os cursos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await (supabase as any)
        .from('courses')
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao,
          tipo: formData.tipo,
          conteudo_url: formData.conteudo_url || null,
          duracao_minutos: formData.duracao_minutos ? parseInt(formData.duracao_minutos) : null,
          data_live: formData.data_live || null,
          autor_id: user?.id,
          status: 'rascunho',
        });

      if (error) throw error;

      toast({
        title: 'Curso criado',
        description: 'Novo conteúdo adicionado com sucesso.',
      });

      setDialogOpen(false);
      setFormData({
        titulo: '',
        descricao: '',
        tipo: 'aula',
        conteudo_url: '',
        duracao_minutos: '',
        data_live: '',
      });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Erro ao criar curso',
        description: 'Não foi possível criar o curso.',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ebook':
        return <FileText className="h-4 w-4" />;
      case 'aula':
        return <Video className="h-4 w-4" />;
      case 'live':
        return <Radio className="h-4 w-4" />;
      case 'teleaula':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ebook':
        return 'E-book';
      case 'aula':
        return 'Aula';
      case 'live':
        return 'Live';
      case 'teleaula':
        return 'TeleAula';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'publicado':
        return 'bg-success text-success-foreground';
      case 'rascunho':
        return 'bg-warning text-warning-foreground';
      case 'arquivado':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleAccessCourse = (course: Course) => {
    if (course.tipo === 'live') {
      setActiveLive(course);
    } else if (course.tipo === 'teleaula') {
      setActiveTeleAula(course);
    } else if (course.conteudo_url) {
      window.open(course.conteudo_url, '_blank');
    } else {
      toast({
        title: 'Conteúdo não disponível',
        description: 'Este conteúdo ainda não possui URL configurada.',
        variant: 'destructive',
      });
    }
  };

  const canCreate = userRole === 'admin' || userRole === 'diretor';

  const filterByType = (type?: string) => {
    if (!type) return courses;
    return courses.filter(c => c.tipo === type);
  };

  return (
    <>
      {activeLive && (
        <LivePlayer
          courseId={activeLive.id}
          titulo={activeLive.titulo}
          descricao={activeLive.descricao}
          dataLive={activeLive.data_live || ''}
          streamUrl={activeLive.conteudo_url || undefined}
          onClose={() => setActiveLive(null)}
        />
      )}

      {activeTeleAula && (
        <TeleAulaRoom
          courseId={activeTeleAula.id}
          titulo={activeTeleAula.titulo}
          descricao={activeTeleAula.descricao}
          onClose={() => setActiveTeleAula(null)}
        />
      )}

      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Cursos e Conteúdos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            E-books, Aulas, Lives e TeleAulas
          </p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Conteúdo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Conteúdo</DialogTitle>
                <DialogDescription>
                  Adicione um novo E-book, Aula, Live ou TeleAula ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Introdução ao Marketing Digital"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebook">E-book</SelectItem>
                      <SelectItem value="aula">Aula</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="teleaula">TeleAula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o conteúdo do curso..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conteudo_url">URL do Conteúdo</Label>
                  <Input
                    id="conteudo_url"
                    value={formData.conteudo_url}
                    onChange={(e) => setFormData({ ...formData, conteudo_url: e.target.value })}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                {formData.tipo !== 'ebook' && (
                  <div className="space-y-2">
                    <Label htmlFor="duracao_minutos">Duração (minutos)</Label>
                    <Input
                      id="duracao_minutos"
                      value={formData.duracao_minutos}
                      onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                      placeholder="60"
                      type="number"
                      min="1"
                    />
                  </div>
                )}

                {formData.tipo === 'live' && (
                  <div className="space-y-2">
                    <Label htmlFor="data_live">Data e Hora da Live</Label>
                    <Input
                      id="data_live"
                      value={formData.data_live}
                      onChange={(e) => setFormData({ ...formData, data_live: e.target.value })}
                      type="datetime-local"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Conteúdo</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ebook">E-books</TabsTrigger>
          <TabsTrigger value="aula">Aulas</TabsTrigger>
          <TabsTrigger value="live">Lives</TabsTrigger>
          <TabsTrigger value="teleaula">TeleAulas</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Carregando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum conteúdo cadastrado ainda
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(course.tipo)}
                        <Badge variant="outline">{getTypeLabel(course.tipo)}</Badge>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{course.titulo}</CardTitle>
                    <CardDescription>{course.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Autor: {course.autor_nome}</p>
                        {course.duracao_minutos && (
                          <p>Duração: {course.duracao_minutos} minutos</p>
                        )}
                        {course.data_live && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <p>
                              {new Date(course.data_live).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => handleAccessCourse(course)}
                      >
                        {course.tipo === 'live' && <Radio className="mr-2 h-4 w-4" />}
                        {course.tipo === 'teleaula' && <Video className="mr-2 h-4 w-4" />}
                        {course.tipo === 'aula' && <Play className="mr-2 h-4 w-4" />}
                        {course.tipo === 'ebook' && <BookOpen className="mr-2 h-4 w-4" />}
                        {course.tipo === 'live' ? 'Assistir Live' : 
                         course.tipo === 'teleaula' ? 'Entrar na Sala' : 
                         course.tipo === 'aula' ? 'Assistir Aula' : 'Ler E-book'}
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {['ebook', 'aula', 'live', 'teleaula'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-6">
            {filterByType(type).length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">{getTypeIcon(type)}</div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum conteúdo do tipo {getTypeLabel(type)} cadastrado ainda
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterByType(type).map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(course.tipo)}
                          <Badge variant="outline">{getTypeLabel(course.tipo)}</Badge>
                        </div>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{course.titulo}</CardTitle>
                      <CardDescription>{course.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Autor: {course.autor_nome}</p>
                      {course.duracao_minutos && (
                        <p>Duração: {course.duracao_minutos} minutos</p>
                      )}
                      {course.data_live && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <p>
                            {new Date(course.data_live).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handleAccessCourse(course)}
                    >
                      {course.tipo === 'live' && <Radio className="mr-2 h-4 w-4" />}
                      {course.tipo === 'teleaula' && <Video className="mr-2 h-4 w-4" />}
                      {course.tipo === 'aula' && <Play className="mr-2 h-4 w-4" />}
                      {course.tipo === 'ebook' && <BookOpen className="mr-2 h-4 w-4" />}
                      {course.tipo === 'live' ? 'Assistir Live' : 
                       course.tipo === 'teleaula' ? 'Entrar na Sala' : 
                       course.tipo === 'aula' ? 'Assistir Aula' : 'Ler E-book'}
                    </Button>
                  </CardFooter>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </>
  );
};

export default CursosView;
