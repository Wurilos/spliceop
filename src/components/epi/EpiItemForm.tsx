import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EpiItem } from '@/hooks/useEpiItems';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const schema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
});

type FormData = z.infer<typeof schema>;

interface EpiItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData & { photo_url?: string | null }) => void;
  initialData?: EpiItem | null;
  loading?: boolean;
}

export function EpiItemForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: EpiItemFormProps) {
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        code: initialData.code,
        description: initialData.description,
      });
      setPhotoUrl(initialData.photo_url);
    } else {
      form.reset({
        code: '',
        description: '',
      });
      setPhotoUrl(null);
    }
  }, [initialData, form]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('epi-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('epi-photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      toast({ title: 'Foto enviada com sucesso!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  const handleSubmit = (data: FormData) => {
    onSubmit({ ...data, photo_url: photoUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Item de EPI' : 'Novo Item de EPI'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: EPI-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do item de EPI"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Foto do Item</label>
              {photoUrl ? (
                <div className="relative w-full h-40 border rounded-md overflow-hidden">
                  <img
                    src={photoUrl}
                    alt="Foto do item"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Clique para enviar uma foto
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? 'Salvando...' : initialData ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
